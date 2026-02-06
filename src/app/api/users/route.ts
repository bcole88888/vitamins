import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { userCreateSchema, parseBody } from '@/lib/validation'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseBody(userCreateSchema, await request.json())
    if (!parsed.success) return parsed.response

    const user = await prisma.user.create({
      data: { name: parsed.data.name },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('User ID is required', 400)
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return apiError('User not found', 404)
    }

    // IntakeLog, Regimen, and NotificationPreference all cascade on user delete
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return apiError('Failed to delete user', 500)
  }
}
