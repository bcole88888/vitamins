import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { utcDayRange } from '@/lib/utils'
import { regimenLogSchema, parseBody } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const parsed = parseBody(regimenLogSchema, await request.json())
    if (!parsed.success) return parsed.response

    const { userId, date, items } = parsed.data

    const { gte: dayStart, lte: dayEnd } = utcDayRange(date)

    const results: { productId: string; logged: boolean; intakeId?: string }[] = []

    for (const item of items) {
      const { productId, checked, quantity } = item

      const existingIntake = await prisma.intakeLog.findFirst({
        where: {
          userId,
          productId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      if (checked && !existingIntake) {
        const intake = await prisma.intakeLog.create({
          data: {
            userId,
            productId,
            quantity,
            date: new Date(date + 'T12:00:00.000Z'),
          },
        })
        results.push({ productId, logged: true, intakeId: intake.id })
      } else if (!checked && existingIntake) {
        await prisma.intakeLog.delete({
          where: { id: existingIntake.id },
        })
        results.push({ productId, logged: false })
      } else {
        results.push({
          productId,
          logged: !!existingIntake,
          intakeId: existingIntake?.id,
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error toggling regimen log:', error)
    return NextResponse.json({ error: 'Failed to toggle regimen log' }, { status: 500 })
  }
}
