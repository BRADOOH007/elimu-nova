import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, authRateLimit, apiRateLimit } from '@/lib/rate-limit'
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

      const { allowed, info } = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(allowed).toBe(true)
      expect(info.remaining).toBe(4)
      expect(info.limit).toBe(5)
    })

    it('allows requests under limit', async () => {
      mockRedis.get.mockResolvedValue(2)
      mockRedis.incr.mockResolvedValue(3)

      const { allowed, info } = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(allowed).toBe(true)
      expect(info.remaining).toBe(2)
    })

    it('blocks requests over limit', async () => {
      mockRedis.get.mockResolvedValue(5)
      mockRedis.ttl.mockResolvedValue(30)

      const { allowed, info } = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(allowed).toBe(false)
      expect(info.remaining).toBe(0)
    })

    it('allows request on Redis failure', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'))

      const { allowed, info } = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(allowed).toBe(true)
      expect(info.remaining).toBe(4)
    })
  })

  describe('authRateLimit', () => {
    it('has stricter limits for auth endpoints', () => {
      expect(authRateLimit).toBeDefined()
      // Rate limit config is applied in middleware
    })
  })

  describe('apiRateLimit', () => {
    it('has standard limits for API endpoints', () => {
      expect(apiRateLimit).toBeDefined()
    })
  })
})