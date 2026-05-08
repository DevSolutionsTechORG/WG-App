import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 5
const MAX_ENTRIES = 10_000

const hits = new Map<string, number[]>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

function isRateLimited(key: string): { limited: boolean; retryAfter: number } {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0]!
    return { limited: true, retryAfter: Math.ceil((oldest + WINDOW_MS - now) / 1000) }
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  if (hits.size > MAX_ENTRIES) {
    const firstKey = hits.keys().next().value
    if (firstKey !== undefined) hits.delete(firstKey)
  }

  return { limited: false, retryAfter: 0 }
}

export function middleware(req: NextRequest) {
  if (req.method !== 'POST') return NextResponse.next()

  const ip = getClientIp(req)
  const key = `${ip}:${req.nextUrl.pathname}`
  const { limited, retryAfter } = isRateLimited(key)

  if (limited) {
    return new NextResponse(
      JSON.stringify({ message: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/users/login', '/api/users/forgot-password', '/api/users/reset-password'],
}
