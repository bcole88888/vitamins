import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
