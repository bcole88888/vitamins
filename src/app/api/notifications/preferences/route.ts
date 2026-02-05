import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { notificationPrefSchema, parseBody } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return apiError('userId is required', 400)
    }

    const preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (!preference) {
      // Return default preferences
      return NextResponse.json({
        userId,
        enabled: false,
        reminderTime: '09:00',
      })
    }

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return apiError('Failed to fetch notification preferences', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const parsed = parseBody(notificationPrefSchema, await request.json())
    if (!parsed.success) return parsed.response

    const { userId, enabled, reminderTime } = parsed.data

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    // Upsert notification preference
    const preference = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(reminderTime !== undefined && { reminderTime }),
      },
      create: {
        userId,
        enabled: enabled ?? false,
        reminderTime: reminderTime ?? '09:00',
      },
    })

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return apiError('Failed to update notification preferences', 500)
  }
}
