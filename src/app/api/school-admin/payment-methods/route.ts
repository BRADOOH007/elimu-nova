import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

  if (!schoolAdmin?.schoolId) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  // Payment preference is stored per school (SchoolSettings).
  const preference = await prisma.schoolSettings.findUnique({
    where: { schoolId_key: { schoolId: schoolAdmin.schoolId, key: 'payment_preference' } },
  })

  // The school's current subscription payment method (last payment used).
  const subscription = await prisma.subscription.findFirst({
    where: { schoolId: schoolAdmin.schoolId },
    orderBy: { createdAt: 'desc' },
    select: { paymentMethod: true, status: true, amount: true },
  })

  // What the platform actually supports (configured by the super admin).
  const [stripeKey, publishableKey, mpesaKey, mpesaEnv] = await Promise.all([
    prisma.systemSettings.findUnique({ where: { key: 'stripe_secret_key' } }),
    prisma.systemSettings.findUnique({ where: { key: 'stripe_publishable_key' } }),
    prisma.systemSettings.findUnique({ where: { key: 'mpesa_consumer_key' } }),
    prisma.systemSettings.findUnique({ where: { key: 'mpesa_environment' } }),
  ])

  const stripeConfigured = !!(stripeKey?.value || process.env.STRIPE_SECRET_KEY)
  const mpesaConfigured = !!(mpesaKey?.value || process.env.MPESA_CONSUMER_KEY)

  return NextResponse.json({
    success: true,
    paymentMethods: [
      {
        id: 'stripe',
        type: 'card',
        brand: 'Stripe',
        last4: '—',
        isPrimary: (preference?.value || 'STRIPE') === 'STRIPE',
        available: stripeConfigured,
        configured: stripeConfigured,
        createdAt: stripeKey?.createdAt?.toISOString() || null,
      },
      {
        id: 'mpesa',
        type: 'mobile_money',
        brand: 'M-Pesa',
        last4: mpesaEnv?.value || 'sandbox',
        isPrimary: (preference?.value || '') === 'MPESA',
        available: mpesaConfigured,
        configured: mpesaConfigured,
        createdAt: mpesaKey?.createdAt?.toISOString() || null,
      },
    ],
    preference: preference?.value || 'STRIPE',
    subscription: subscription
      ? {
          paymentMethod: subscription.paymentMethod,
          status: subscription.status,
          amount: subscription.amount,
        }
      : null,
  })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { action, paymentMethodId, preference } = body
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

  if (!schoolAdmin?.schoolId) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  switch (action) {
    case 'set_preference': {
      const method = String(preference || '').toUpperCase()
      if (!['STRIPE', 'MPESA', 'MANUAL'].includes(method)) {
        return NextResponse.json({ error: 'Invalid payment preference' }, { status: 400 })
      }
      await prisma.schoolSettings.upsert({
        where: { schoolId_key: { schoolId: schoolAdmin.schoolId, key: 'payment_preference' } },
        update: { value: method, updatedBy: user.id },
        create: {
          schoolId: schoolAdmin.schoolId,
          key: 'payment_preference',
          value: method,
          type: 'string',
          category: 'billing',
          description: 'Preferred payment method for this school',
          updatedBy: user.id,
        },
      })
      return NextResponse.json({ success: true, message: 'Payment preference updated' })
    }

    case 'delete':
    case 'set_primary':
      if (!paymentMethodId) {
        return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
      }
      // Platform-level providers can't be deleted by a school — only the
      // preference can change. Treat this as a preference change.
      const method = String(paymentMethodId).toUpperCase()
      if (['STRIPE', 'MPESA'].includes(method)) {
        await prisma.schoolSettings.upsert({
          where: { schoolId_key: { schoolId: schoolAdmin.schoolId, key: 'payment_preference' } },
          update: { value: method, updatedBy: user.id },
          create: {
            schoolId: schoolAdmin.schoolId,
            key: 'payment_preference',
            value: method,
            type: 'string',
            category: 'billing',
            description: 'Preferred payment method for this school',
            updatedBy: user.id,
          },
        })
        return NextResponse.json({ success: true, message: 'Primary payment method updated' })
      }
      return NextResponse.json({ error: 'Unknown payment method' }, { status: 400 })

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
})