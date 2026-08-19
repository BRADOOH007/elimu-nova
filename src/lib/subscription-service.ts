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

const TRIAL_DAYS = 14
// Grace period after a subscription endDate passes — prevents paid subscribers
// being locked out due to webhook delays, clock skew, or renewal races.
const EXPIRY_GRACE_DAYS = 5

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
      // School-affiliated users with no explicit subscription row:
      // Grant access — the school admin manages the school-level subscription.
      // Only independent users (userId only, no schoolId) need to subscribe themselves.
      if (schoolId && !userId) {
        return {
          isActive: true,
          isTrial: false,
          isExpired: false,
          daysRemaining: 9999,
          status: 'SCHOOL_MANAGED',
          packageName: 'School Plan'
        }
      }
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
    const subscriptionStatus = subscription.status as string

    // Freemium plans never expire — freemium users always have access.
    const isFreemium = (subscription as any).isFreemium === true || (subscription as any).type === 'FREEMIUM'
    if (isFreemium) {
      return {
        isActive: true,
        isTrial: false,
        isExpired: false,
        daysRemaining: 9999,
        status: 'FREEMIUM',
        packageName: subscription.package?.name || 'Free Plan',
        endDate: subscription.endDate
      }
    }

    // ACTIVE = paid and in good standing (Stripe webhooks flip to INACTIVE/
    // CANCELLED on payment failure or cancellation). A paid subscriber is never
    // locked out, even if endDate is momentarily stale — renewals refresh it.
    if (subscriptionStatus === 'ACTIVE') {
      return {
        isActive: true,
        isTrial: false,
        isExpired: false,
        daysRemaining: 9999,
        status: 'ACTIVE',
        packageName: subscription.package?.name || 'Paid Plan',
        endDate: subscription.endDate
      }
    }

    // Everything else is time-bound (TRIAL, or a legacy paid plan with endDate).
    // Apply a grace period so we never lock out a subscriber over webhook/clock skew.
    const graceEnd = new Date(subscription.endDate.getTime() + (EXPIRY_GRACE_DAYS * 24 * 60 * 60 * 1000))
    const isExpired = graceEnd < now
    const daysRemaining = Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Auto-update DB status when expiry is detected (outside grace)
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
    // On error, grant access rather than blocking users — fail open for non-billing errors
    return {
      isActive: true,
      isTrial: false,
      isExpired: false,
      daysRemaining: 9999,
      status: 'UNKNOWN',
      packageName: 'Unknown'
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

interface CheckoutCatalogEntry {
  name: string
  description: string
  price: number
  kesPrice?: number
  maxTeachers: number
  maxStudents: number
  features: string[]
}

const CHECKOUT_PACKAGE_CATALOG: Record<string, CheckoutCatalogEntry> = {
  school_basic: {
    name: 'Basic School Plan',
    description: 'Perfect for small schools getting started with AI.',
    price: 49,
    maxTeachers: 5,
    maxStudents: 100,
    features: ['Core AI Tutoring', 'Class Progress Tracking', 'Standard Analytics', 'Email Support'],
  },
  school_growth: {
    name: 'Growth School Plan',
    description: 'For medium schools scaling AI-powered learning.',
    price: 149,
    maxTeachers: 20,
    maxStudents: 500,
    features: ['Advanced AI Tutoring', 'Personalized Learning Paths', 'Real-Time Analytics', 'Priority Support', 'Custom Curriculum Alignment'],
  },
  school_enterprise: {
    name: 'Enterprise School Plan',
    description: 'For large school networks and districts.',
    price: 0,
    maxTeachers: 9999,
    maxStudents: 99999,
    features: ['Multi-campus Admin Controls', 'Dedicated Database Tenant', 'LMS Integration', 'Dedicated Account Manager'],
  },
  parent_single: {
    name: 'Single Child Plan',
    description: 'A personal AI tutor for one child.',
    price: 20,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['24/7 Personal AI Tutor', 'Instant Homework Explanations', 'Weakness Identification', 'Curriculum Practice'],
  },
  parent_family: {
    name: 'Family Plan',
    description: 'Full AI access for up to 3 children.',
    price: 35,
    maxTeachers: 0,
    maxStudents: 3,
    features: ['Full AI Access for up to 3 Children', 'Unified Parent Dashboard', 'Individual Progress Reports'],
  },
  learner_prek3: {
    name: 'Pre K–3 Plan',
    description: 'Early childhood learning for young learners.',
    price: 100,
    kesPrice: 500,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['Play-based early learning', 'Phonics & number skills', 'AI tutor for little learners', 'Parent progress reports'],
  },
  learner_4_8: {
    name: 'Grade 4–8 Plan',
    description: 'Upper primary & junior secondary.',
    price: 120,
    kesPrice: 800,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['Full CBC curriculum', 'AI-powered personal tutor', 'Homework help 24/7', 'Weakness identification & practice'],
  },
  learner_9_12: {
    name: 'Grade 9–12 Plan',
    description: 'Senior secondary & exam preparation.',
    price: 150,
    kesPrice: 1200,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['KCSE exam preparation', 'Past papers & marking schemes', 'Subject-focused AI tutoring', 'Progress & performance analytics'],
  },
  ged: {
    name: 'Senior GED Plan',
    description: 'Monthly access to the US General Education Diploma (GED) preparation program.',
    price: 100,
    kesPrice: 2000,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['Full GED curriculum', 'Computer & AI literacy courses', 'Live lessons', 'GED certificate'],
  },
  tutoring_3_8: {
    name: 'Tutoring 3–8 Plan',
    description: '1:1 tutoring for grades 3–8.',
    price: 50,
    kesPrice: 600,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['1:1 live tutoring', 'Personalised lesson plan', 'Homework & exam help', 'Flexible scheduling'],
  },
  tutoring_9_12: {
    name: 'Tutoring 9–12 Plan',
    description: '1:1 tutoring for grades 9–12.',
    price: 60,
    kesPrice: 800,
    maxTeachers: 0,
    maxStudents: 1,
    features: ['1:1 live tutoring', 'KCSE exam coaching', 'Past paper walkthroughs', 'Flexible scheduling'],
  },
}

const CHECKOUT_PACKAGE_NAMES: Record<string, string> = {
  starter: 'Starter School Plan',
  growth: 'Growth Plan',
  excellence: 'Excellence Plan',
  school_basic: 'Basic School Plan',
  school_growth: 'Growth School Plan',
  school_enterprise: 'Enterprise School Plan',
  parent_single: 'Single Child Plan',
  parent_family: 'Family Plan',
  learner_prek3: 'Pre K–3 Plan',
  learner_4_8: 'Grade 4–8 Plan',
  learner_9_12: 'Grade 9–12 Plan',
  ged: 'Senior GED Plan',
  tutoring_3_8: 'Tutoring 3–8 Plan',
  tutoring_9_12: 'Tutoring 9–12 Plan',
}

/**
 * Resolve a checkout package by id, falling back to a known plan name or the
 * built-in catalog (find-or-create). Shared by Stripe and PayPal checkout so
 * both processors stay in sync.
 *
 * `currency` picks the stored package price: KES for catalog plans with a
 * `kesPrice`, otherwise the USD price. History rows keep their own `amount` so
 * re-resolution never corrupts past subscription charges.
 */
export async function resolveCheckoutPackage(
  packageId: string,
  currency?: string
): Promise<{ id: string; name: string; price: number; duration: number } | null> {
  let pkg = await prisma.package.findUnique({ where: { id: packageId } })

  if (!pkg) {
    const planName = CHECKOUT_PACKAGE_NAMES[packageId]
    if (planName) {
      pkg = await prisma.package.findFirst({ where: { name: planName, isActive: true } })
    }
  }

  const catalogEntry = CHECKOUT_PACKAGE_CATALOG[packageId]
  if (!pkg && catalogEntry) {
    // Find-or-create a DB package for this catalog plan (e.g. GED/tutoring),
    // priced per the requested currency.
    const useKes = currency?.toLowerCase() === 'kes' && catalogEntry.kesPrice != null
    const desiredPrice = useKes ? catalogEntry.kesPrice! : catalogEntry.price
    const existing = await prisma.package.findFirst({ where: { name: catalogEntry.name, isActive: true } })
    if (existing) {
      pkg = existing.price !== desiredPrice
        ? await prisma.package.update({ where: { id: existing.id }, data: { price: desiredPrice } })
        : existing
    } else {
      pkg = await prisma.package.create({
        data: {
          name: catalogEntry.name,
          description: catalogEntry.description,
          price: desiredPrice,
          maxTeachers: catalogEntry.maxTeachers,
          maxStudents: catalogEntry.maxStudents,
          features: catalogEntry.features,
          duration: 30,
          isActive: true,
        },
      })
    }
  }

  if (!pkg) return null
  return { id: pkg.id, name: pkg.name, price: pkg.price, duration: pkg.duration }
}

export async function hasAccess(userId?: string, schoolId?: string): Promise<boolean> {
  const cacheKey = `sub:access:${userId || 'u'}:${schoolId || 's'}`

  // Cache read must NEVER block the user — if Redis is down, fail open.
  try {
    const cached = await cache.get(cacheKey)
    if (cached !== null) return cached === 'true'
  } catch {
    // Redis unavailable — continue to evaluate subscription directly.
  }

  let allowed = false
  try {
    const subscriptionInfo = await getSubscriptionStatus(userId, schoolId)
    allowed = subscriptionInfo.isActive
  } catch (error) {
    console.error('Error in hasAccess:', error)
    // Fail open: a billing/subscription error should not lock a teacher out.
    allowed = true
  }

  // Cache write must never throw either.
  try {
    await cache.set(cacheKey, allowed ? 'true' : 'false', 60)
  } catch { /* Redis unavailable — ignore */ }

  return allowed
}

/**
 * Invalidate the cached access decision for a user/school.
 * Call after subscription status changes (renewal, payment, cancel) so the
 * new status takes effect immediately instead of after the 60s cache TTL.
 */
export async function invalidateSubscriptionCache(userId?: string, schoolId?: string): Promise<void> {
  if (!userId && !schoolId) return
  try {
    await cache.del(`sub:access:${userId || 'u'}:${schoolId || 's'}`)
  } catch { /* Redis unavailable — ignore */ }
}

/** Invalidate cache for every subscription row matching a Stripe subscription id. */
export async function invalidateCacheForStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  try {
    const subs = await prisma.subscription.findMany({
      where: { stripeSubscriptionId },
      select: { userId: true, schoolId: true },
    })
    for (const s of subs) {
      await invalidateSubscriptionCache(s.userId || undefined, s.schoolId || undefined)
    }
  } catch (e) {
    console.error('Error invalidating subscription cache:', e)
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
  schoolId?: string,
  currency?: string
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

  // Determine currency: explicit param > KES for Kenyan schools > USD default
  const resolvedCurrency = currency || (schoolId ? 'kes' : 'usd')
  const currencyLower = resolvedCurrency.toLowerCase()

  // Convert price to smallest currency unit (cents for USD, cents for KES via Stripe)
  // Stripe expects amount in smallest currency unit: USD=cents, KES=cents
  const unitAmount = Math.round(packageInfo.price * 100)

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currencyLower,
          product_data: {
            name: packageInfo.name,
            description: packageInfo.description || undefined,
          },
          unit_amount: unitAmount,
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
      localSubscriptionId: localSubId,
      currency: currencyLower,
    }
  })

  return session
}
