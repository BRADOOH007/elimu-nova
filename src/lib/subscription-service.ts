import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface SubscriptionInfo {
  isActive: boolean
  isTrial: boolean
  isExpired: boolean
  daysRemaining: number
  status: string
  packageName?: string
  trialEndsAt?: Date
  endDate?: Date
}

const TRIAL_DAYS = 10

export async function getSubscriptionStatus(userId?: string, schoolId?: string): Promise<SubscriptionInfo> {
  if (!userId && !schoolId) {
    throw new Error('Either userId or schoolId must be provided')
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        ...(userId && { userId }),
        ...(schoolId && { schoolId })
      },
      include: { package: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      return {
        isActive: false,
        isTrial: false,
        isExpired: true,
        daysRemaining: 0,
        status: 'NO_SUBSCRIPTION',
        packageName: 'None'
      }
    }

    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const isExpired = subscription.endDate < now

    const subscriptionStatus = subscription.status as string

    // Auto-update DB status when expiry is detected
    if (isExpired && (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL')) {
      const newStatus = subscriptionStatus === 'TRIAL' ? 'TRIAL_EXPIRED' : 'EXPIRED'
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: newStatus as any },
      }).catch(() => {})
    }

    const isActive = (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL') && !isExpired

    return {
      isActive,
      isTrial: (subscription as any).isTrial || subscriptionStatus === 'TRIAL',
      isExpired,
      daysRemaining,
      status: isExpired ? 'EXPIRED' : subscriptionStatus,
      packageName: subscription.package?.name || 'Unknown Package',
      trialEndsAt: (subscription as any).trialEndsAt || undefined,
      endDate: subscription.endDate
    }
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error)
    return {
      isActive: false,
      isTrial: false,
      isExpired: true,
      daysRemaining: 0,
      status: 'ERROR',
      packageName: 'Error'
    }
  }
}

export async function autoCreateTrial(userId?: string, schoolId?: string): Promise<void> {
  if (!userId && !schoolId) return

  const existing = await prisma.subscription.findFirst({
    where: {
      ...(userId && { userId }),
      ...(schoolId && { schoolId })
    }
  })
  if (existing) return

  let basicPackage = await prisma.package.findFirst({
    where: { name: 'Basic' },
    orderBy: { price: 'asc' }
  })
  if (!basicPackage) {
    basicPackage = await prisma.package.create({
      data: {
        name: 'Basic',
        price: 0,
        duration: 30,
        maxTeachers: 1,
        maxStudents: 30,
        features: ['AI tutoring', 'Progress tracking', 'Basic reports'],
        isActive: true,
      }
    })
  }

  const startDate = new Date()
  const trialEndDate = new Date(startDate.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000))

  await prisma.subscription.create({
    data: {
      userId,
      schoolId,
      packageId: basicPackage.id,
      status: 'TRIAL' as any,
      startDate,
      endDate: trialEndDate,
      trialEndsAt: trialEndDate,
      amount: 0,
      isTrial: true,
      type: 'TRIAL',
      paymentMethod: 'FREE_TRIAL'
    }
  })
}

export async function startFreeTrial(userId?: string, schoolId?: string): Promise<void> {
  if (!userId && !schoolId) {
    throw new Error('Either userId or schoolId must be provided')
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      ...(userId && { userId }),
      ...(schoolId && { schoolId })
    }
  })

  if (existingSubscription) {
    throw new Error('Subscription already exists')
  }

  const basicPackage = await prisma.package.findFirst({
    where: { name: 'Basic' },
    orderBy: { price: 'asc' }
  })

  if (!basicPackage) {
    throw new Error('No basic package found for trial')
  }

  const startDate = new Date()
  const trialEndDate = new Date(startDate.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000))

  await prisma.subscription.create({
    data: {
      userId,
      schoolId,
      packageId: basicPackage.id,
      status: 'TRIAL' as any,
      startDate,
      endDate: trialEndDate,
      trialEndsAt: trialEndDate,
      amount: 0,
      isTrial: true,
      type: 'TRIAL',
      paymentMethod: 'FREE_TRIAL'
    }
  })
}

export async function hasAccess(userId?: string, schoolId?: string): Promise<boolean> {
  const cacheKey = `sub:access:${userId || 'u'}:${schoolId || 's'}`
  try {
    const cached = await cache.get(cacheKey)
    if (cached !== null) return cached === 'true'

    const subscriptionInfo = await getSubscriptionStatus(userId, schoolId)
    const allowed = subscriptionInfo.isActive
    await cache.set(cacheKey, allowed ? 'true' : 'false', 60)
    return allowed
  } catch (error) {
    console.error('Error in hasAccess:', error)
    return false
  }
}

export async function createStripeCustomer(email: string, name: string, userId?: string, schoolId?: string) {
  const { stripe } = await import('@/lib/stripe')

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId: userId || '',
      schoolId: schoolId || '',
      type: userId ? 'independent' : 'school'
    }
  })

  return customer
}

export async function createCheckoutSession(
  packageId: string,
  successUrl: string,
  cancelUrl: string,
  userId?: string,
  schoolId?: string
) {
  const { stripe } = await import('@/lib/stripe')

  const packageInfo = await prisma.package.findUnique({
    where: { id: packageId }
  })

  if (!packageInfo) {
    throw new Error('Package not found')
  }

  const customerEmail = userId ?
    (await prisma.user.findUnique({ where: { id: userId } }))?.email :
    (await prisma.school.findUnique({ where: { id: schoolId! } }))?.email

  if (!customerEmail) {
    throw new Error('Customer email not found')
  }

  const customer = await createStripeCustomer(
    customerEmail,
    userId ? 'Independent User' : 'School',
    userId,
    schoolId
  )

  // Create or update the local subscription record so we can link Stripe to it
  const existingSub = await prisma.subscription.findFirst({
    where: {
      ...(userId && { userId }),
      ...(schoolId && { schoolId }),
      stripeSubscriptionId: null
    },
    orderBy: { createdAt: 'desc' }
  })

  let localSubId: string
  if (existingSub) {
    localSubId = existingSub.id
  } else {
    const startDate = new Date()
    const durationMs = packageInfo.duration * 30 * 24 * 60 * 60 * 1000
    const endDate = new Date(startDate.getTime() + durationMs)
    const created = await prisma.subscription.create({
      data: {
        userId,
        schoolId,
        packageId: packageInfo.id,
        status: 'ACTIVE' as any,
        startDate,
        endDate,
        amount: packageInfo.price,
        isTrial: false,
        type: 'SUBSCRIPTION',
        paymentMethod: 'STRIPE',
      }
    })
    localSubId = created.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: packageInfo.name,
            description: packageInfo.description || undefined,
          },
          unit_amount: Math.round(packageInfo.price * 100),
          recurring: {
            interval: 'month',
            interval_count: Math.ceil(packageInfo.duration / 30),
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      packageId,
      userId: userId || '',
      schoolId: schoolId || '',
      localSubscriptionId: localSubId
    }
  })

  return session
}
