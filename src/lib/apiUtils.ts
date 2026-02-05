import { NextResponse } from 'next/server'

export function apiError(message: string, status: number) {
  console.error(`API Error: ${message}`)
  return NextResponse.json({ error: message }, { status })
}

// Fetch with an AbortController timeout (default 5 seconds).
// On timeout the fetch is aborted and null is returned instead of throwing.
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Fetch timeout after ${timeoutMs}ms: ${url}`)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Simple in-memory TTL cache for external API responses.
export class TtlCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()
  private readonly ttlMs: number

  constructor(ttlMinutes: number) {
    this.ttlMs = ttlMinutes * 60 * 1000
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}
