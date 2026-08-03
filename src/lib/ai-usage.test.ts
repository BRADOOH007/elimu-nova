import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCache = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(undefined),
  ttl: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({ cache: mockCache }))

import { checkAIUsageAllowed, recordAIUsage, getAIUsageStats, getUsageLimits } from '@/lib/ai-usage'
import { prisma } from '@/lib/prisma'

describe('ai-usage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-set default return values after clearAllMocks
    mockCache.get.mockResolvedValue(null)
    mockCache.set.mockResolvedValue(undefined)
    mockCache.incr.mockResolvedValue(1)
    mockCache.expire.mockResolvedValue(undefined)
  })

  describe('getUsageLimits', () => {
    it('returns unlimited for SUPER_ADMIN', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'SUPER_ADMIN' })

      const limits = await getUsageLimits('admin-1')

      expect(limits.dailyCalls).toBe(999999)
      expect(limits.monthlyCalls).toBe(999999)
    })

    it('returns default limits when no subscription found', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'TEACHER' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue(null)
      ;(prisma.student.findUnique as any).mockResolvedValue(null)

      const limits = await getUsageLimits('teacher-1')

      expect(limits.dailyCalls).toBe(10)
      expect(limits.monthlyCalls).toBe(200)
    })

    it('returns tier-specific limits for starter package', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'TEACHER' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue({ schoolId: 'school-1' })
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        status: 'ACTIVE',
        package: { name: 'Starter Plan' },
      })

      const limits = await getUsageLimits('teacher-1')

      expect(limits.dailyCalls).toBe(30)
      expect(limits.monthlyCalls).toBe(800)
    })

    it('returns default for unknown package', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'TEACHER' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue({ schoolId: 'school-1' })
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        status: 'ACTIVE',
        package: { name: 'Mega Ultra Plan' },
      })

      const limits = await getUsageLimits('teacher-1')

      expect(limits.dailyCalls).toBe(10)
    })

    it('returns default when user not found', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue(null)

      const limits = await getUsageLimits('unknown-user')

      expect(limits.dailyCalls).toBe(10)
    })

    it('uses cached limits when available', async () => {
      mockCache.get.mockResolvedValueOnce(JSON.stringify({ dailyCalls: 50, monthlyCalls: 1500, maxTokensPerCall: 3000, maxTokensPerDay: 50000 }))

      const limits = await getUsageLimits('teacher-1')

      expect(limits.dailyCalls).toBe(50)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('checkAIUsageAllowed', () => {
    it('allows when under limits', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'SUPER_ADMIN' })

      const result = await checkAIUsageAllowed('admin-1')

      expect(result.allowed).toBe(true)
    })

    it('blocks when daily limit reached', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'TEACHER' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue({ schoolId: 'school-1' })
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        status: 'ACTIVE',
        package: { name: 'Free Plan' },
      })

      // Free tier: 10 daily. Return 10+ for the daily key.
      mockCache.get.mockImplementation(async (key: string) => {
        if (key.startsWith('ai-limits:')) return null
        if (key.startsWith('ai-usage:')) return '10'
        return null
      })

      const result = await checkAIUsageAllowed('teacher-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Daily AI limit')
    })

    it('blocks when monthly limit reached', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'TEACHER' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue({ schoolId: 'school-1' })
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        status: 'ACTIVE',
        package: { name: 'Free Plan' },
      })

      // Free tier: 10 daily, 200 monthly.
      // Use sequential mockResolvedValueOnce to control each call:
      // 1st call: cache.get('ai-limits:teacher-1') → null (miss)
      // 2nd call: cache.get(dailyKey) → '0' (under daily limit)
      // 3rd call: cache.get(monthlyKey) → '200' (at monthly limit)
      mockCache.get
        .mockResolvedValueOnce(null)   // ai-limits cache miss
        .mockResolvedValueOnce('0')    // daily count
        .mockResolvedValueOnce('200')  // monthly count (at limit)

      const result = await checkAIUsageAllowed('teacher-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Monthly AI limit')
    })

    it('fails open when cache error occurs', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'SUPER_ADMIN' })
      mockCache.get.mockRejectedValue(new Error('Redis down'))

      const result = await checkAIUsageAllowed('admin-1')

      expect(result.allowed).toBe(true)
    })
  })

  describe('recordAIUsage', () => {
    it('increments daily and monthly counters', async () => {
      await recordAIUsage('user-1')

      expect(mockCache.incr).toHaveBeenCalledTimes(2)
      expect(mockCache.expire).toHaveBeenCalled()
    })

    it('records token usage when provided', async () => {
      mockCache.get.mockResolvedValue('100')

      await recordAIUsage('user-1', 50)

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining('ai-tokens:user-1:'),
        '150',
        expect.any(Number)
      )
    })

    it('starts token count from 0 when no previous tokens', async () => {
      await recordAIUsage('user-1', 50)

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining('ai-tokens:user-1:'),
        '50',
        expect.any(Number)
      )
    })
  })

  describe('getAIUsageStats', () => {
    it('returns usage stats', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'SUPER_ADMIN' })

      // Sequential mock for each cache.get call:
      // 1st: ai-limits:admin-1 → cached limits JSON
      // 2nd: dailyKey → '5'
      // 3rd: monthlyKey → '100'
      // 4th: tokenKey → '5000'
      mockCache.get
        .mockResolvedValueOnce(JSON.stringify({ dailyCalls: 999999, monthlyCalls: 999999, maxTokensPerCall: 4000, maxTokensPerDay: 9999999 }))
        .mockResolvedValueOnce('5')
        .mockResolvedValueOnce('100')
        .mockResolvedValueOnce('5000')

      const stats = await getAIUsageStats('admin-1')

      expect(stats.daily).toBe(5)
      expect(stats.monthly).toBe(100)
      expect(stats.tokensThisMonth).toBe(5000)
      expect(stats.dailyLimit).toBe(999999)
    })

    it('returns zeros on cache error', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ role: 'SUPER_ADMIN' })
      mockCache.get.mockRejectedValue(new Error('Redis down'))

      const stats = await getAIUsageStats('admin-1')

      expect(stats.daily).toBe(0)
      expect(stats.monthly).toBe(0)
      expect(stats.tokensThisMonth).toBe(0)
    })
  })
})
