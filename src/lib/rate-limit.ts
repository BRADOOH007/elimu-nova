import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

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
}

const DEFAULT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit',
}

export async function checkRateLimit(
  key: string,
  config: Partial<typeof DEFAULT_CONFIG> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const fullKey = `${finalConfig.keyPrefix}:${key}`
  const now = Date.now()
  const windowSec = Math.ceil(finalConfig.windowMs / 1000)

  try {
    const current = await redis.get(fullKey)
    const count = current ? parseInt(current as string, 10) : 0

    if (count >= finalConfig.maxRequests) {
      const ttl = await redis.ttl(fullKey)
      return {
        allowed: false,
        limit: finalConfig.maxRequests,
        remaining: 0,
        resetTime: now + (ttl > 0 ? ttl : windowSec) * 1000,
      }
    }

    const newCount = await redis.incr(fullKey)
    if (newCount === 1) {
      await redis.expire(fullKey, windowSec)
    }

    const ttl = await redis.ttl(fullKey)
    return {
      allowed: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests - newCount,
      resetTime: now + (ttl > 0 ? ttl : windowSec) * 1000,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return {
      allowed: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests - 1,
      resetTime: now + finalConfig.windowMs,
    }
  }
}

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

export function getIP(request: NextRequest): string {
  return getClientIdentifier(request)
}

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
  maxRequests: 100,
  windowMs: 60 * 1000,
  keyPrefix: 'ratelimit:api',
}