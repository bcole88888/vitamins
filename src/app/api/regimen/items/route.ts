import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { regimenId, productId, quantity = 1 } = await request.json()

    if (!regimenId || !productId) {
      return NextResponse.json(
        { error: 'regimenId and productId are required' },
        { status: 400 }
      )
    }

    const [regimen, product] = await Promise.all([
      prisma.regimen.findUnique({ where: { id: regimenId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ])

    if (!regimen) {
      return NextResponse.json({ error: 'Regimen not found' }, { status: 404 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const maxSortOrder = await prisma.regimenItem.aggregate({
      where: { regimenId },
      _max: { sortOrder: true },
    })

    const item = await prisma.regimenItem.create({
      data: {
        regimenId,
        productId,
        quantity,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
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

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error adding item to regimen:', error)
    return NextResponse.json({ error: 'Failed to add item to regimen' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { itemId, quantity, sortOrder } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    const updateData: { quantity?: number; sortOrder?: number } = {}
    if (quantity !== undefined) updateData.quantity = quantity
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

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
    console.error('Error updating regimen item:', error)
    return NextResponse.json({ error: 'Failed to update regimen item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    await prisma.regimenItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing item from regimen:', error)
    return NextResponse.json({ error: 'Failed to remove item from regimen' }, { status: 500 })
  }
}
