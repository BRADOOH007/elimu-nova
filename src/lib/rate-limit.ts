/**
 * Rate limiting for ElimuNova API routes.
 * Uses Redis sliding window counter.
 * Falls back gracefully when Redis is unavailable.
 *
 * Limits per role (per minute):
 *   AI chat/tutor   → 20 requests  (prevents runaway costs)
 *   General API     → 120 requests (2 req/sec — generous for normal use)
 *   Auth endpoints  → 10 requests  (brute-force protection)
 */

import { cache } from '@/lib/redis'
import { NextRequest } from 'next/server'

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetInSec: number
}

export async function rateLimit(
  identifier: string,    // e.g. userId or IP
  action: string,        // e.g. 'ai_chat', 'api', 'auth'
  limit   = 120,
  windowSec = 60,
): Promise<RateLimitResult> {
  const key = `rl:${action}:${identifier}:${Math.floor(Date.now() / (windowSec * 1000))}`

  try {
    const count     = await cache.incr(key)
    const resetInSec = windowSec - (Math.floor(Date.now() / 1000) % windowSec)

    // Set TTL on first request in the window
    if (count === 1) await cache.expire(key, windowSec + 5)

    return {
      allowed:    count <= limit,
      remaining:  Math.max(0, limit - count),
      resetInSec,
    }
  } catch {
    // Redis unavailable — allow the request (fail open, not closed)
    return { allowed: true, remaining: limit, resetInSec: windowSec }
  }
}

/* ── Convenience wrappers ── */

export async function rateLimitAI(userId: string): Promise<RateLimitResult> {
  return rateLimit(userId, 'ai_chat', 20, 60)
}

export async function rateLimitAPI(userId: string): Promise<RateLimitResult> {
  return rateLimit(userId, 'api', 120, 60)
}

export async function rateLimitAuth(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, 'auth', 10, 60)
}

/* ── Extract IP from Next.js request ── */
export function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}
