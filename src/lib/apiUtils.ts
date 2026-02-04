import { NextResponse } from 'next/server'

export function apiError(message: string, status: number) {
  console.error(`API Error: ${message}`)
  return NextResponse.json({ error: message }, { status })
}
