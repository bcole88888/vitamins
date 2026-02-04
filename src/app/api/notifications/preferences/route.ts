import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'

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
    const { userId, enabled, reminderTime } = await request.json()

    if (!userId) {
      return apiError('userId is required', 400)
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    // Validate reminderTime format if provided
    if (reminderTime && !/^\d{2}:\d{2}$/.test(reminderTime)) {
      return apiError('reminderTime must be in HH:MM format', 400)
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
