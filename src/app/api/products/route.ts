import { NextResponse } from 'next/server'
import { prisma, productInclude } from '@/lib/prisma'
import { ProductData } from '@/types'
import { apiError } from '@/lib/apiUtils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const skip = (page - 1) * pageSize

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: pageSize,
        include: productInclude,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count(),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return apiError('Failed to fetch products', 500)
  }
}

export async function POST(request: Request) {
  try {
    const data: ProductData = await request.json()

    if (!data.name) {
      return apiError('Product name is required', 400)
    }

    // Check if product with this UPC already exists
    if (data.upc) {
      const existing = await prisma.product.findUnique({
        where: { upc: data.upc },
        include: productInclude,
      })
      if (existing) {
        return NextResponse.json(existing)
      }
    }

    const nutrientsToCreate =
      data.nutrients && Array.isArray(data.nutrients)
        ? {
            create: data.nutrients.map(n => ({
              name: n.name,
              amount: n.amount,
              unit: n.unit,
              dailyValuePercent: n.dailyValuePercent,
            })),
          }
        : { create: [] }

    // Create new product with nutrients
    const product = await prisma.product.create({
      data: {
        upc: data.upc,
        name: data.name,
        brand: data.brand,
        servingSize: data.servingSize,
        servingUnit: data.servingUnit,
        imageUrl: data.imageUrl,
        nutrients: nutrientsToCreate,
      },
      include: productInclude,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return apiError('Failed to create product', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nutrients } = await request.json()

    if (!id) {
      return apiError('Product ID is required', 400)
    }

    if (!Array.isArray(nutrients)) {
      return apiError('Nutrients must be an array', 400)
    }

    // Delete existing nutrients and create new ones in a transaction
    await prisma.$transaction([
      prisma.nutrient.deleteMany({
        where: { productId: id },
      }),
      ...nutrients
        .filter((n: { name: string; amount: number; unit: string }) => n.name && n.amount !== undefined)
        .map((n: { name: string; amount: number; unit: string; dailyValuePercent?: number }) =>
          prisma.nutrient.create({
            data: {
              productId: id,
              name: n.name,
              amount: n.amount,
              unit: n.unit,
              dailyValuePercent: n.dailyValuePercent,
            },
          })
        ),
    ])

    // Return updated product
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return apiError('Failed to update product', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Product ID is required', 400)
    }

    // Delete related records first (IntakeLog doesn't have cascade delete)
    await prisma.intakeLog.deleteMany({
      where: { productId: id },
    })

    // Now delete the product (nutrients and regimenItems cascade automatically)
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return apiError('Failed to delete product', 500)
  }
}
