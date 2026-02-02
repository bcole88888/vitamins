import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductData } from '@/types'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        nutrients: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data: ProductData = await request.json()

    if (!data.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    // Check if product with this UPC already exists
    if (data.upc) {
      const existing = await prisma.product.findUnique({
        where: { upc: data.upc },
        include: { nutrients: true },
      })
      if (existing) {
        return NextResponse.json(existing)
      }
    }

    // Create new product with nutrients
    const product = await prisma.product.create({
      data: {
        upc: data.upc,
        name: data.name,
        brand: data.brand,
        servingSize: data.servingSize,
        servingUnit: data.servingUnit,
        imageUrl: data.imageUrl,
        nutrients: {
          create: data.nutrients.map(n => ({
            name: n.name,
            amount: n.amount,
            unit: n.unit,
            dailyValuePercent: n.dailyValuePercent,
          })),
        },
      },
      include: {
        nutrients: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
