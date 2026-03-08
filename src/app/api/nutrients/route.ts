import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AggregatedNutrient } from '@/types'
import { calculateRdiPercent, getRdiInfo, normalizeNutrientName } from '@/lib/nutrients'
import { utcDayRange, utcDateRange } from '@/lib/utils'

interface RawRow {
  nutrientName: string
  unit: string
  productName: string
  totalAmount: number
  timeOfDay: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!date && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Either date or startDate/endDate is required' },
        { status: 400 }
      )
    }

    let dateGte: Date
    let dateLte: Date
    if (date) {
      ({ gte: dateGte, lte: dateLte } = utcDayRange(date))
    } else {
      ({ gte: dateGte, lte: dateLte } = utcDateRange(startDate!, endDate!))
    }

    // Fetch intake logs with related nutrients and product names
    const intakeLogs = await prisma.intakeLog.findMany({
      where: {
        date: { gte: dateGte, lte: dateLte },
        ...(userId ? { userId } : {}),
      },
      select: {
        quantity: true,
        timeOfDay: true,
        product: {
          select: {
            name: true,
            nutrients: {
              select: { name: true, amount: true, unit: true },
            },
          },
        },
      },
    })

    const intakeCount = intakeLogs.length

    // Build aggregated rows from the intake logs
    const rows: RawRow[] = []
    for (const intake of intakeLogs) {
      for (const nutrient of intake.product.nutrients) {
        rows.push({
          nutrientName: nutrient.name,
          unit: nutrient.unit,
          productName: intake.product.name,
          timeOfDay: intake.timeOfDay,
          totalAmount: nutrient.amount * intake.quantity,
        })
      }
    }

    // Merge rows in JS: normalize nutrient names and combine sources.
    const nutrientMap = new Map<string, AggregatedNutrient>()
    const timeOfDayMap = new Map<string, Set<string>>() // timeOfDay -> Set of normalized nutrient names

    for (const row of rows) {
      const normalizedName = normalizeNutrientName(row.nutrientName)
      const amount = Number(row.totalAmount)
      
      // Update global aggregate
      const existing = nutrientMap.get(normalizedName)
      if (existing) {
        existing.totalAmount += amount
        existing.sources.push({ productName: row.productName, amount })
      } else {
        const rdi = getRdiInfo(normalizedName)
        nutrientMap.set(normalizedName, {
          name: normalizedName,
          totalAmount: amount,
          unit: row.unit,
          rdiAmount: rdi?.amount,
          sources: [{ productName: row.productName, amount }],
        })
      }

      // Update time-of-day map
      if (!timeOfDayMap.has(row.timeOfDay)) {
        timeOfDayMap.set(row.timeOfDay, new Set())
      }
      timeOfDayMap.get(row.timeOfDay)!.add(normalizedName)
    }

    // Calculate RDI percentages
    const nutrients: AggregatedNutrient[] = Array.from(nutrientMap.values()).map(n => ({
      ...n,
      rdiPercent: calculateRdiPercent(n.name, n.totalAmount, n.unit) ?? undefined,
    }))

    nutrients.sort((a, b) => a.name.localeCompare(b.name))

    const timeOfDayNutrients = Array.from(timeOfDayMap.entries()).map(([time, names]) => ({
      timeOfDay: time,
      nutrients: Array.from(names),
    }))

    return NextResponse.json({
      date: date || `${startDate} to ${endDate}`,
      userId,
      nutrients,
      intakeCount,
      timeOfDayNutrients,
    })
  } catch (error) {
    console.error('Error aggregating nutrients:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate nutrients' },
      { status: 500 }
    )
  }
}
