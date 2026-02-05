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

    // SQL-level aggregation: SUM(nutrient.amount * intake.quantity)
    // grouped by nutrient name, unit, and product name (for source tracking).
    // This avoids fetching full product/nutrient objects into memory.
    const params: (string | Date)[] = [dateGte, dateLte]
    let userClause = ''
    if (userId) {
      userClause = 'AND i.userId = ?'
      params.push(userId)
    }

    const rows = await prisma.$queryRawUnsafe<RawRow[]>(
      `SELECT n.name AS nutrientName, n.unit, p.name AS productName,
              SUM(n.amount * i.quantity) AS totalAmount
       FROM IntakeLog i
       JOIN Nutrient n ON n.productId = i.productId
       JOIN Product  p ON p.id = i.productId
       WHERE i.date >= ? AND i.date <= ? ${userClause}
       GROUP BY n.name, n.unit, p.name`,
      ...params
    )

    // Count distinct intake records for the response
    const countRows = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
      `SELECT COUNT(*) AS cnt FROM IntakeLog i
       WHERE i.date >= ? AND i.date <= ? ${userClause}`,
      ...params
    )
    const intakeCount = Number(countRows[0]?.cnt ?? 0)

    // Merge rows in JS: normalize nutrient names and combine sources.
    // The dataset is already pre-aggregated per (nutrient, product) so this
    // loop is proportional to distinct nutrients * distinct products, not
    // to the total number of intake records.
    const nutrientMap = new Map<string, AggregatedNutrient>()

    for (const row of rows) {
      const normalizedName = normalizeNutrientName(row.nutrientName)
      const amount = Number(row.totalAmount)
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
    }

    // Calculate RDI percentages
    const nutrients: AggregatedNutrient[] = Array.from(nutrientMap.values()).map(n => ({
      ...n,
      rdiPercent: calculateRdiPercent(n.name, n.totalAmount, n.unit) ?? undefined,
    }))

    nutrients.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      date: date || `${startDate} to ${endDate}`,
      userId,
      nutrients,
      intakeCount,
    })
  } catch (error) {
    console.error('Error aggregating nutrients:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate nutrients' },
      { status: 500 }
    )
  }
}
