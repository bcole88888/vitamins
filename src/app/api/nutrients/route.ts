import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AggregatedNutrient } from '@/types'
import { calculateRdiPercent, getRdiInfo, normalizeNutrientName } from '@/lib/nutrients'

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

    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      where.date = {
        gte: dayStart,
        lte: dayEnd,
      }
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.date = {
        gte: start,
        lte: end,
      }
    }

    // Fetch all intakes with nutrients
    const intakes = await prisma.intakeLog.findMany({
      where,
      include: {
        product: {
          include: {
            nutrients: true,
          },
        },
      },
    })

    // Aggregate nutrients
    const nutrientMap = new Map<string, AggregatedNutrient>()

    for (const intake of intakes) {
      const { product, quantity } = intake

      for (const nutrient of product.nutrients) {
        const normalizedName = normalizeNutrientName(nutrient.name)
        const existing = nutrientMap.get(normalizedName)
        const amount = nutrient.amount * quantity

        if (existing) {
          existing.totalAmount += amount
          existing.sources.push({
            productName: product.name,
            amount,
          })
        } else {
          const rdi = getRdiInfo(normalizedName)
          nutrientMap.set(normalizedName, {
            name: normalizedName,
            totalAmount: amount,
            unit: nutrient.unit,
            rdiAmount: rdi?.amount,
            sources: [
              {
                productName: product.name,
                amount,
              },
            ],
          })
        }
      }
    }

    // Calculate RDI percentages
    const nutrients: AggregatedNutrient[] = Array.from(nutrientMap.values()).map(n => ({
      ...n,
      rdiPercent: calculateRdiPercent(n.name, n.totalAmount, n.unit) ?? undefined,
    }))

    // Sort by name
    nutrients.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      date: date || `${startDate} to ${endDate}`,
      userId,
      nutrients,
      intakeCount: intakes.length,
    })
  } catch (error) {
    console.error('Error aggregating nutrients:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate nutrients' },
      { status: 500 }
    )
  }
}
