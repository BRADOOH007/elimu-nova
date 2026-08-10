import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/billing/activate
 * Activates subscription after successful payment.
 * Called by PaymentModal after payment confirmation.
 */
export const POST = route({ skipSubscriptionCheck: true }, async (request) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { method, amount, currency } = await request.json()
  const userId = session.user.id

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

  // Record payment
  try {
    await (prisma as any).payment.create({
      data: {
        userId,
        amount: amount || 0,
        currency: currency || 'USD',
        method: method || 'CARD',
        status: 'COMPLETED',
        transactionId: `manual_${Date.now()}`,
        notes: `Subscription activated via ${method || 'CARD'}`,
      },
    })
  } catch (e) {
    console.warn('Failed to record payment:', e)
  }

  return NextResponse.json({ success: true, subscription })
})
