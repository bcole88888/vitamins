import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { isScheduledForDay } from '@/lib/schedule'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dayParam = searchParams.get('day')

    if (!userId) {
      return apiError('userId is required', 400)
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

    // Filter items by day if specified
    if (dayParam !== null) {
      const day = parseInt(dayParam, 10)
      if (day >= 0 && day <= 6) {
        for (const regimen of regimens) {
          regimen.items = regimen.items.filter(item =>
            isScheduledForDay(item.scheduleDays, day)
          )
        }
      }
    }

    return NextResponse.json(regimens)
  } catch (error) {
    return apiError('Failed to fetch regimens', 500)
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return apiError('userId is required', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return apiError('User not found', 404)
    }

    const regimen = await prisma.regimen.create({
      data: {
        userId,
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
    return apiError('Failed to create regimen', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Regimen ID is required', 400)
    }

    await prisma.regimen.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('Failed to delete regimen', 500)
  }
}
