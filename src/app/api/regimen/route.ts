import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const regimens = await prisma.regimen.findMany({
      where: { userId },
      include: {
        items: {
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
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(regimens)
  } catch (error) {
    console.error('Error fetching regimens:', error)
    return NextResponse.json({ error: 'Failed to fetch regimens' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name = 'Daily Regimen' } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const regimen = await prisma.regimen.create({
      data: {
        userId,
        name,
      },
      include: {
        items: {
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
        },
      },
    })

    return NextResponse.json(regimen, { status: 201 })
  } catch (error) {
    console.error('Error creating regimen:', error)
    return NextResponse.json({ error: 'Failed to create regimen' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Regimen ID is required' }, { status: 400 })
    }

    await prisma.regimen.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting regimen:', error)
    return NextResponse.json({ error: 'Failed to delete regimen' }, { status: 500 })
  }
}
