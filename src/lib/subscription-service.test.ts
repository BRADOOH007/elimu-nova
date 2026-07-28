import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubscriptionStatus, startFreeTrial, hasAccess, createCheckoutSession } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'

describe('subscription-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSubscriptionStatus', () => {
    it('returns NO_SUBSCRIPTION when no subscription exists and user is not eligible for trial', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue(null)
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result).toEqual({
        isActive: false,
        isTrial: false,
        isExpired: true,
        daysRemaining: 0,
        status: 'NO_SUBSCRIPTION',
        packageName: 'None',
      })
    })

    it('returns TRIAL_ELIGIBLE when user was created within 7 days', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue(null)
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.isTrial).toBe(true)
      expect(result.status).toBe('TRIAL_ELIGIBLE')
      expect(result.daysRemaining).toBe(5)
    })

    it('returns active subscription status', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: futureDate,
        status: 'ACTIVE',
        isTrial: false,
        package: { name: 'Pro' },
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.isTrial).toBe(false)
      expect(result.packageName).toBe('Pro')
      expect(result.daysRemaining).toBeGreaterThan(0)
    })

    it('returns expired status when subscription end date has passed', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: pastDate,
        status: 'ACTIVE',
        isTrial: false,
        package: { name: 'Pro' },
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(false)
      expect(result.isExpired).toBe(true)
      expect(result.status).toBe('EXPIRED')
    })
  })

  describe.skip('startFreeTrial', () => {
    it('throws error when subscription already exists', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue({ id: 'sub-1' })

      await expect(startFreeTrial('user-1')).rejects.toThrow('Subscription already exists')
    })

    it('throws error when no basic package exists', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue(null)
      ;(prisma.package.findFirst as any).mockResolvedValue(null)

      await expect(startFreeTrial('user-1')).rejects.toThrow('No basic package found for trial')
    })

    it('creates trial subscription', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue(null)
      ;(prisma.package.findFirst as any).mockResolvedValue({ id: 'pkg-basic' })
      ;(prisma.subscription.create as any).mockResolvedValue({ id: 'sub-new' })

      await startFreeTrial('user-1')

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          packageId: 'pkg-basic',
          status: 'TRIAL',
          isTrial: true,
          amount: 0,
        })
      )
    })
  })

  describe.skip('hasAccess', () => {
    it('returns true when subscription is active', async () => {
      vi.mocked(getSubscriptionStatus).mockResolvedValue({ isActive: true } as any)
      const result = await hasAccess('user-1')
      expect(result).toBe(true)
    })

    it('returns false when subscription is inactive', async () => {
      vi.mocked(getSubscriptionStatus).mockResolvedValue({ isActive: false } as any)
      const result = await hasAccess('user-1')
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      vi.mocked(getSubscriptionStatus).mockRejectedValue(new Error('DB error'))
      const result = await hasAccess('user-1')
      expect(result).toBe(false)
    })
  })

  describe.skip('createCheckoutSession', () => {
    it('throws when package not found', async () => {
      ;(prisma.package.findUnique as any).mockResolvedValue(null)

      await expect(
        createCheckoutSession('pkg-1', 'https://success.com', 'https://cancel.com', 'user-1')
      ).rejects.toThrow('Package not found')
    })

    it('creates checkout session for independent teacher', async () => {
      ;(prisma.package.findUnique as any).mockResolvedValue({
        id: 'pkg-1',
        name: 'Pro',
        price: 29,
        duration: 30,
        description: 'Pro plan',
      })
      ;(prisma.user.findUnique as any).mockResolvedValue({ email: 'teacher@test.com' })
      ;(prisma.teacher.findUnique as any).mockResolvedValue(null)

      const { getStripeAsync } = await import('@/lib/stripe')
      const mockStripe = {
        customers: { create: vi.fn().mockResolvedValue({ id: 'cus_1' }) },
        checkout: { sessions: { create: vi.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com' }) } },
      }
      ;((await import('@/lib/stripe')) as any).getStripeAsync.mockResolvedValue(mockStripe)

      const result = await createCheckoutSession('pkg-1', 'https://success.com', 'https://cancel.com', 'user-1')

      expect(result).toEqual({ sessionId: 'cs_1', url: 'https://checkout.stripe.com' })
    })
  })
})