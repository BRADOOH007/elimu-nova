import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key === 'sk_test_placeholder') {
      throw new Error('Stripe secret key not configured')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-11-20.acacia' as any,
    })
  }
  return _stripe
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: { package: true },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  let stripeCustomerId: string

  if (user.subscription?.stripeCustomerId) {
    stripeCustomerId = user.subscription.stripeCustomerId
  } else {
    // Create Stripe customer
    const customer = await getStripe().customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id },
    })
    stripeCustomerId = customer.id

    // Update subscription with Stripe customer ID
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: { stripeCustomerId: customer.id },
      })
    }
  }

  return createBillingPortalSession(stripeCustomerId, returnUrl)
}

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) {
    logger.info('Invoice has no subscription', { invoiceId: invoice.id })
    return
  }

  const subscription = await getStripe().subscriptions.retrieve(
    invoice.subscription as string
  )

  const { userId, schoolId } = subscription.metadata

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'ACTIVE',
      endDate: new Date(subscription.current_period_end * 1000),
    },
  })

  logger.info('Subscription activated', {
    subscriptionId: subscription.id,
    userId,
    schoolId,
  })
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) return

  const subscription = await getStripe().subscriptions.retrieve(
    invoice.subscription as string
  )

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'INACTIVE' },
  })

  logger.warn('Subscription payment failed', {
    subscriptionId: subscription.id,
  })
}

export async function handleSubscriptionCancelled(
  subscription: Stripe.Subscription
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELLED' },
  })

  logger.info('Subscription cancelled', { subscriptionId: subscription.id })
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  let status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'TRIAL' = 'ACTIVE'

  switch (subscription.status) {
    case 'canceled':
      status = 'CANCELLED'
      break
    case 'past_due':
    case 'unpaid':
      status = 'INACTIVE'
      break
    case 'trialing':
      status = 'TRIAL'
      break
  }

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      endDate: new Date(subscription.current_period_end * 1000),
    },
  })

  logger.info('Subscription updated', { subscriptionId: subscription.id, status })
}

export async function retryFailedPayment(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
    
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      const invoice = await getStripe().invoices.retrieve(subscription.latest_invoice as string)
      
      if (invoice.payment_intent) {
        await getStripe().paymentIntents.retry(invoice.payment_intent as string)
        logger.info('Payment retry initiated', { subscriptionId })
        return { success: true }
      }
    }
    
    return { success: false, error: 'No retryable payment found' }
  } catch (error) {
    logger.error('Payment retry failed', { error, subscriptionId })
    return { success: false, error: (error as Error).message }
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<void> {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  })
}

export async function createSetupIntent(
  customerId: string
): Promise<string> {
  const setupIntent = await getStripe().setupIntents.create({
    customer: customerId,
    usage: 'off_session',
  })
  return setupIntent.client_secret!
}

export async function listPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await getStripe().paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
  return paymentMethods.data
}

export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await getStripe().paymentMethods.detach(paymentMethodId)
}