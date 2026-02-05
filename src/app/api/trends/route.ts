import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { calculateRdiPercent, normalizeNutrientName } from '@/lib/nutrients'
import { utcToday, utcDateRange } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const periodParam = searchParams.get('period') || '7'

    if (!userId) {
      return apiError('userId is required', 400)
    }

    const period = parseInt(periodParam, 10)
    if (![7, 30, 90].includes(period)) {
      return apiError('period must be 7, 30, or 90', 400)
    }

    // Calculate date range in UTC
    const todayStr = utcToday()
    const startDateObj = new Date(todayStr + 'T00:00:00.000Z')
    startDateObj.setUTCDate(startDateObj.getUTCDate() - period + 1)
    const startStr = startDateObj.toISOString().split('T')[0]
    const { gte: startDate, lte: endDate } = utcDateRange(startStr, todayStr)

    // Get all intake logs for the period
    const intakeLogs = await prisma.intakeLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        product: {
          include: {
            nutrients: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Group intakes by date and aggregate nutrients
    const dataByDate = new Map<string, Map<string, { amount: number; unit: string }>>()

    // Initialize all dates in the period
    for (let i = 0; i < period; i++) {
      const d = new Date(startDate)
      d.setUTCDate(d.getUTCDate() + i)
      const dateKey = d.toISOString().split('T')[0]
      dataByDate.set(dateKey, new Map())
    }

    // Aggregate nutrients by date
    for (const intake of intakeLogs) {
      const dateKey = intake.date.toISOString().split('T')[0]
      let dayNutrients = dataByDate.get(dateKey)

      if (!dayNutrients) {
        dayNutrients = new Map()
        dataByDate.set(dateKey, dayNutrients)
      }

      for (const nutrient of intake.product.nutrients) {
        const normalizedName = normalizeNutrientName(nutrient.name)
        const scaledAmount = nutrient.amount * intake.quantity

        const existing = dayNutrients.get(normalizedName)
        if (existing) {
          existing.amount += scaledAmount
        } else {
          dayNutrients.set(normalizedName, {
            amount: scaledAmount,
            unit: nutrient.unit,
          })
        }
      }
    }

    // Convert to trend data points
    const trendData = Array.from(dataByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, nutrients]) => ({
        date,
        nutrients: Array.from(nutrients.entries()).map(([name, data]) => ({
          name,
          amount: data.amount,
          unit: data.unit,
          rdiPercent: calculateRdiPercent(name, data.amount, data.unit) || undefined,
        })),
      }))

    // Calculate summary statistics per nutrient
    const nutrientStats = new Map<string, { amounts: number[]; unit: string }>()

    for (const [, dayNutrients] of Array.from(dataByDate)) {
      for (const [name, data] of Array.from(dayNutrients)) {
        const existing = nutrientStats.get(name)
        if (existing) {
          existing.amounts.push(data.amount)
        } else {
          nutrientStats.set(name, {
            amounts: [data.amount],
            unit: data.unit,
          })
        }
      }
    }

    const summary = Array.from(nutrientStats.entries()).map(([name, data]) => {
      const nonZeroAmounts = data.amounts.filter(a => a > 0)
      const avg = nonZeroAmounts.length > 0
        ? nonZeroAmounts.reduce((a, b) => a + b, 0) / nonZeroAmounts.length
        : 0
      const min = nonZeroAmounts.length > 0 ? Math.min(...nonZeroAmounts) : 0
      const max = nonZeroAmounts.length > 0 ? Math.max(...nonZeroAmounts) : 0
      const daysWithIntake = nonZeroAmounts.length

      return {
        name,
        unit: data.unit,
        average: avg,
        min,
        max,
        daysWithIntake,
        averageRdiPercent: calculateRdiPercent(name, avg, data.unit) || undefined,
      }
    })

    return NextResponse.json({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      data: trendData,
      summary: summary.sort((a, b) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    console.error('Trends error:', error)
    return apiError('Failed to fetch trends data', 500)
  }
}
