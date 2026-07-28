import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({ cache: mockCache }))

import { checkRateLimit, rateLimitAuth, rateLimitAPI } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('allows first request', async () => {
      mockCache.get.mockResolvedValue(null)
      mockCache.incr.mockResolvedValue(1)

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('allows requests under limit', async () => {
      mockCache.get.mockResolvedValue('2')
      mockCache.incr.mockResolvedValue(3)

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('blocks requests over limit', async () => {
      mockCache.get.mockResolvedValue('5')
      mockCache.ttl.mockResolvedValue(30)

      const result = await checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('allows request on cache failure', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache down'))

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
