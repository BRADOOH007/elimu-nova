// ──────────────────────────────────────────────────────────────
// Distributed rate limiting — backed by Redis (Upstash) with
// in-memory fallback. Used by api-middleware.ts route() wrapper
// and standalone for auth/AI/upload endpoints.
// ──────────────────────────────────────────────────────────────

import { cache } from './redis'
import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  resetInSec: number
}

const DEFAULT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit',
}

// Sliding-window rate limit: incr on every request, expire after window
// On overflow: returns { allowed: false } with Retry-After header value
export async function checkRateLimit(
  key: string,
  config: Partial<typeof DEFAULT_CONFIG> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const fullKey = `${finalConfig.keyPrefix}:${key}`
  const now = Date.now()
  const windowSec = Math.ceil(finalConfig.windowMs / 1000)

  try {
    const current = await cache.get(fullKey)
    const count = current ? parseInt(current as string, 10) : 0

    const makeResult = (allowed: boolean, remaining: number, ttl: number): RateLimitResult => ({
      allowed,
      limit: finalConfig.maxRequests,
      remaining,
      resetTime: now + ttl * 1000,
      resetInSec: ttl,
    })

    if (count >= finalConfig.maxRequests) {
      const ttl = await cache.ttl(fullKey)
      return makeResult(false, 0, ttl > 0 ? ttl : windowSec)
    }

    const newCount = await cache.incr(fullKey)
    if (newCount === 1) {
      await cache.expire(fullKey, windowSec)
    }

    const ttl = await cache.ttl(fullKey)
    return makeResult(true, finalConfig.maxRequests - newCount, ttl > 0 ? ttl : windowSec)
  } catch (error) {
    // Fail open — never block requests due to cache failure
    console.error('Rate limit check failed:', error)
    return {
      allowed: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests - 1,
      resetTime: now + finalConfig.windowMs,
      resetInSec: Math.ceil(finalConfig.windowMs / 1000),
    }
  }
}

// Resolve client IP from headers (works behind Vercel/proxies)
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? (forwarded.split(',')[0] || '').trim() : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

export function getIP(request: NextRequest): string {
  return getClientIdentifier(request)
}

// ── Pre-configured rate limit profiles ───────────────────────────
// Applied by route() wrapper automatically based on endpoint type
// rateLimitAI:   20 req/min  — AI generation (expensive)
// rateLimitAuth: 10 req/15m  — login/register (brute-force protection)
// rateLimitUpload: 10 req/min — file uploads
// rateLimitAPI:  100 req/min — default for all other routes

export const rateLimitAI = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit:ai',
}

export const rateLimitAuth = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: 'ratelimit:auth',
}

export const rateLimitUpload = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit:upload',
}

export const rateLimitAPI = {
  maxRequests: 300,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit:api',
}

export const rateLimitLibrary = {
  maxRequests: 500,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit:lib',
}
