import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { isScheduledForDay, getDayOfWeek } from '@/lib/schedule'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateParam = searchParams.get('date')

    if (!userId) {
      return apiError('userId is required', 400)
    }

    // Get the date to check (default to today)
    const checkDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()
    const dayOfWeek = getDayOfWeek(checkDate)

    // Get start and end of the day for intake check
    const startOfDay = new Date(checkDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(checkDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get user's regimen with items
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
              },
            },
          },
        },
      },
    })

    if (regimens.length === 0) {
      return NextResponse.json({
        pendingCount: 0,
        completedCount: 0,
        totalCount: 0,
        pendingItems: [],
      })
    }

    // Get today's intake logs
    const intakeLogs = await prisma.intakeLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        productId: true,
      },
    })

    const loggedProductIds = new Set(intakeLogs.map(log => log.productId))

    // Calculate pending items (scheduled for today but not logged)
    const allItems = regimens.flatMap(r => r.items)
    const scheduledItems = allItems.filter(item =>
      isScheduledForDay(item.scheduleDays, dayOfWeek)
    )

    const pendingItems = scheduledItems.filter(
      item => !loggedProductIds.has(item.productId)
    )

    const completedItems = scheduledItems.filter(
      item => loggedProductIds.has(item.productId)
    )

    return NextResponse.json({
      pendingCount: pendingItems.length,
      completedCount: completedItems.length,
      totalCount: scheduledItems.length,
      pendingItems: pendingItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productBrand: item.product.brand,
        quantity: item.quantity,
      })),
    })
  } catch (error) {
    console.error('Check notifications error:', error)
    return apiError('Failed to check pending items', 500)
  }
}
