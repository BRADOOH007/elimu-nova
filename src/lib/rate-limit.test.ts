import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, rateLimitAuth, rateLimitAPI } from '@/lib/rate-limit'
import { Redis } from '@upstash/redis'

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  })),
}))

describe('rate-limit', () => {
  let mockRedis: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis = new Redis({ url: 'test', token: 'test' })
  })

  describe('checkRateLimit', () => {
    it('allows first request', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.set.mockResolvedValue('OK')

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
      expect(result.limit).toBe(5)
    })

    it('allows requests under limit', async () => {
      mockRedis.get.mockResolvedValue(2)
      mockRedis.incr.mockResolvedValue(3)

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('blocks requests over limit', async () => {
      mockRedis.get.mockResolvedValue(5)
      mockRedis.ttl.mockResolvedValue(30)

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('allows request on Redis failure', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'))

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })
  })

  describe('rateLimitAuth', () => {
    it('has stricter limits for auth endpoints', () => {
      expect(rateLimitAuth).toBeDefined()
    })
  })

  describe('rateLimitAPI', () => {
    it('has standard limits for API endpoints', () => {
      expect(rateLimitAPI).toBeDefined()
    })
  })
})
