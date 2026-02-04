import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'

export async function POST(request: Request) {
  try {
    const { regimenId, productId, quantity = 1, scheduleDays = '0,1,2,3,4,5,6' } = await request.json()

    if (!regimenId || !productId) {
      return apiError('regimenId and productId are required', 400)
    }

    const [regimen, product] = await Promise.all([
      prisma.regimen.findUnique({ where: { id: regimenId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ])

    if (!regimen) {
      return apiError('Regimen not found', 404)
    }

    if (!product) {
      return apiError('Product not found', 404)
    }

    const item = await prisma.$transaction(async (tx) => {
      const maxSortOrder = await tx.regimenItem.aggregate({
        where: { regimenId },
        _max: { sortOrder: true },
      })

      const newItem = await tx.regimenItem.create({
        data: {
          regimenId,
          productId,
          quantity,
          sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
          scheduleDays,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              servingUnit: true,
            },
          },
        },
      })
      return newItem
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return apiError('Failed to add item to regimen', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const { itemId, quantity, sortOrder, scheduleDays } = await request.json()

    if (!itemId) {
      return apiError('itemId is required', 400)
    }

    const updateData: { quantity?: number; sortOrder?: number; scheduleDays?: string } = {}
    if (quantity !== undefined) updateData.quantity = quantity
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (scheduleDays !== undefined) updateData.scheduleDays = scheduleDays

    const item = await prisma.regimenItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            servingUnit: true,
          },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return apiError('Failed to update regimen item', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return apiError('itemId is required', 400)
    }

    await prisma.regimenItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('Failed to remove item from regimen', 500)
  }
}
