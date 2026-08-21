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

    it('returns NO_SUBSCRIPTION when user has no subscription (trial check moved to autoCreateTrial)', async () => {
      ;(prisma.subscription.findFirst as any).mockResolvedValue(null)

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(false)
      expect(result.isTrial).toBe(false)
      expect(result.isExpired).toBe(true)
      expect(result.status).toBe('NO_SUBSCRIPTION')
      expect(result.daysRemaining).toBe(0)
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

    it('treats freemium subscriptions as always active with unlimited access', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-free',
        endDate: futureDate,
        status: 'ACTIVE',
        isTrial: false,
        isFreemium: true,
        package: { name: 'Free Plan' },
      })

      const result = await getSubscriptionStatus('user-free')

      expect(result.isActive).toBe(true)
      expect(result.isExpired).toBe(false)
      expect(result.status).toBe('FREEMIUM')
      expect(result.daysRemaining).toBe(9999)
      expect(result.packageName).toBe('Free Plan')
    })

    it('treats freemium by type=FREEMIUM as always active', async () => {
      const pastDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-free2',
        endDate: pastDate, // very old end date doesn't matter
        status: 'EXPIRED',
        isTrial: false,
        type: 'FREEMIUM',
        package: { name: 'Free' },
      })

      const result = await getSubscriptionStatus('user-free2')

      expect(result.isActive).toBe(true)
      expect(result.status).toBe('FREEMIUM')
      expect(result.daysRemaining).toBe(9999)
    })

    it('treats recurring Stripe subscriptions as always accessible (webhook-managed, never locked out)', async () => {
      // A recurring Stripe subscription is managed by webhook events (status +
      // endDate refreshed on every invoice). Even if endDate is stale, a
      // Stripe-managed paid subscriber must never be blocked by a local date.
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: pastDate,
        status: 'ACTIVE',
        isTrial: false,
        stripeSubscriptionId: 'sub_stripe_123',
        package: { name: 'Pro' },
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.isExpired).toBe(false)
      expect(result.status).toBe('ACTIVE')
    })

    it('keeps a time-bound ACTIVE subscription active while inside the expiry grace window', async () => {
      // PayPal / M-Pesa / cash plans expire by date, but the 5-day grace
      // absorbs renewal lag — still inside grace means still active.
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: pastDate,
        status: 'ACTIVE',
        isTrial: false,
        package: { name: 'Pro' },
      })

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(true)
      expect(result.isExpired).toBe(false)
      expect(result.status).toBe('ACTIVE')
    })

    it('expires a time-bound ACTIVE subscription once endDate passes beyond grace', async () => {
      // Non-recurring paid plan well past endDate + 5-day grace — genuinely
      // lapsed and must block access (and be flipped to EXPIRED in the DB).
      const pastDate = new Date(Date.now() - (5 + 6) * 24 * 60 * 60 * 1000)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: pastDate,
        status: 'ACTIVE',
        isTrial: false,
        package: { name: 'Pro' },
      })
      ;(prisma.subscription.update as any).mockResolvedValue({})

      const result = await getSubscriptionStatus('user-1')

      expect(result.isActive).toBe(false)
      expect(result.isExpired).toBe(true)
      expect(result.status).toBe('EXPIRED')
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'EXPIRED' },
      })
    })

    it('returns expired status when a TRIAL subscription end date has passed beyond grace', async () => {
      // Trial past its grace period — genuinely expired, should block.
      const pastDate = new Date(Date.now() - (5 + 6) * 24 * 60 * 60 * 1000) // past endDate + grace (5 days)
      ;(prisma.subscription.findFirst as any).mockResolvedValue({
        id: 'sub-1',
        endDate: pastDate,
        status: 'TRIAL',
        isTrial: true,
        package: { name: 'Basic' },
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