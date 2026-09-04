import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { invalidateSubscriptionCache } from '@/lib/subscription-service'
import { createPaidInvoice } from '@/lib/payment-notifications'

/**
 * POST /api/billing/activate
 * Activates a subscription manually (cash/demo activation by a platform admin).
 * Restricted to SUPER_ADMIN — regular users must pay via Stripe/PayPal/M-Pesa
 * so nobody can self-grant a paid subscription.
 */
export const POST = route({ auth: 'SUPER_ADMIN', skipSubscriptionCheck: true }, async (request, { user }) => {
  const { method, amount, currency } = await request.json()
  const userId = user.id

  // Find or create subscription
  const existingSub = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

  let subscription
  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'ACTIVE',
        endDate,
        trialEndsAt: endDate,
        amount: amount || existingSub.amount,
        paymentMethod: method || existingSub.paymentMethod,
        type: 'PAID',
        isTrial: false,
        updatedAt: now,
      },
    })
  } else {
    // Create new subscription
    let pkg = await prisma.package.findFirst({ where: { name: { contains: 'Basic' } } })
    if (!pkg) {
      pkg = await prisma.package.create({
        data: { name: 'Basic Plan', price: 9.99, duration: 30, maxTeachers: 1, maxStudents: 5, features: ['AI Tutor', 'Progress Tracking', 'Curriculum Access'] },
      })
    }
    subscription = await prisma.subscription.create({
      data: {
        userId,
        packageId: pkg.id,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        trialEndsAt: endDate,
        amount: amount || 9.99,
        paymentMethod: method || 'CARD',
        type: 'PAID',
        isTrial: false,
      },
    })
  }

  // Unblock immediately (invalidates the 60s access cache) so the manual
  // activation takes effect on the very next request.
  try {
    await invalidateSubscriptionCache(userId, undefined)
  } catch (e) { console.warn('activate: cache invalidation failed', e) }

  // Record a PAID invoice (correct model) for the audit trail. Uses a distinct
  // receipt so repeated activations don't create duplicates.
  try {
    await createPaidInvoice(subscription.id, amount || subscription.amount, method || 'CARD', `manual-${Date.now()}`)
  } catch (e) {
    console.warn('activate: failed to record invoice:', e)
  }

  return NextResponse.json({ success: true, subscription })
})
