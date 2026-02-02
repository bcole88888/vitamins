import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface LogItem {
  productId: string
  checked: boolean
  quantity: number
}

export async function POST(request: Request) {
  try {
    const { userId, date, items } = await request.json() as {
      userId: string
      date: string
      items: LogItem[]
    }

    if (!userId || !date || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'userId, date, and items array are required' },
        { status: 400 }
      )
    }

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

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
            date: new Date(date),
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
