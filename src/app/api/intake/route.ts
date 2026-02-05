import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { utcDayRange, utcDateRange } from '@/lib/utils'
import { intakeCreateSchema, parseBody } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (date) {
      where.date = utcDayRange(date)
    } else if (startDate && endDate) {
      where.date = utcDateRange(startDate, endDate)
    }

    const intakes = await prisma.intakeLog.findMany({
      where,
      include: {
        product: {
          include: {
            nutrients: true,
          },
        },
        user: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(intakes)
  } catch (error) {
    console.error('Error fetching intakes:', error)
    return NextResponse.json({ error: 'Failed to fetch intakes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseBody(intakeCreateSchema, await request.json())
    if (!parsed.success) return parsed.response

    const { userId, productId, quantity, date } = parsed.data

    // Verify user and product exist
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const intake = await prisma.intakeLog.create({
      data: {
        userId,
        productId,
        quantity,
        date: date ? new Date(date + 'T12:00:00.000Z') : new Date(),
      },
      include: {
        product: {
          include: {
            nutrients: true,
          },
        },
        user: true,
      },
    })

    return NextResponse.json(intake, { status: 201 })
  } catch (error) {
    console.error('Error creating intake:', error)
    return NextResponse.json({ error: 'Failed to log intake' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Intake ID is required' }, { status: 400 })
    }

    await prisma.intakeLog.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting intake:', error)
    return NextResponse.json({ error: 'Failed to delete intake' }, { status: 500 })
  }
}
