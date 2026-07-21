import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { emailService } from '@/lib/email-service'

interface DunningConfig {
  maxRetries: number
  retryIntervals: number[] // hours between retries
  gracePeriodHours: number
}

const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetries: 4,
  retryIntervals: [1, 6, 24, 72], // hours
  gracePeriodHours: 24,
}

export async function processDunning(): Promise<void> {
  const now = new Date()

  // Find subscriptions in PAST_DUE or UNPAID status
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ['PAST_DUE', 'UNPAID'] } as any,
        stripeSubscriptionId: { not: null },
      },
      include: {
        user: true,
        school: true,
      },
    })

  for (const subscription of subscriptions) {
    await processSubscriptionDunning(subscription)
  }
}

async function processSubscriptionDunning(subscription: any): Promise<void> {
  const config = DEFAULT_DUNNING_CONFIG
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId!
  )

  const paymentFailedAt = subscription.updatedAt
  const hoursSinceFailure = (Date.now() - paymentFailedAt.getTime()) / (1000 * 60 * 60)

  // Check grace period
  if (hoursSinceFailure < config.gracePeriodHours) {
    return
  }

  // Find which retry attempt we're on
  let retryAttempt = 0
  for (let i = 0; i < config.retryIntervals.length; i++) {
    const interval = config.retryIntervals[i]
    if (hoursSinceFailure >= config.gracePeriodHours + interval) {
      retryAttempt = i + 1
    }
  }

  if (retryAttempt > config.maxRetries) {
    // Cancel subscription after max retries
    await cancelSubscription(subscription.id)
    await sendCancellationEmail(subscription)
    return
  }

  // Retry payment
  try {
    const result = await retryFailedPayment(subscription.stripeSubscriptionId!)
    
    if (result.success) {
      // Payment succeeded, update subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      })
      await sendPaymentRecoveryEmail(subscription)
    }
  } catch (error) {
    logger.error('Dunning retry failed', { error, subscriptionId: subscription.id })
  }

  // Send dunning email if this is a retry attempt
  if (retryAttempt > 0) {
    await sendDunningEmail(subscription, retryAttempt)
  }
}

async function retryFailedPayment(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (subscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
      
      // @ts-expect-error - Stripe API types may vary
      if (invoice.payment_intent) {
        // @ts-expect-error - Stripe API types may vary
        await stripe.paymentIntents.retry(invoice.payment_intent as string)
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

async function cancelSubscription(subscriptionId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  })

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED' },
  })

  if (sub?.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
  }
}

async function sendDunningEmail(subscription: any, attempt: number): Promise<void> {
  if (!subscription.user) return

  const attemptLabels = ['first', 'second', 'third', 'final']
  const attemptLabel = attemptLabels[attempt - 1] || 'final'

  await emailService.sendNotificationEmail(
    subscription.user.email,
    subscription.user.firstName,
    `Payment Issue - ${attemptLabel} Attempt`,
    `We were unable to process payment for your ${subscription.package?.name || 'subscription'}. This is our ${attemptLabel} attempt to collect payment. Please update your payment method to avoid service interruption.`,
    '/billing',
    'Update Payment Method'
  )
}

async function sendPaymentRecoveryEmail(subscription: any): Promise<void> {
  if (!subscription.user) return

  await emailService.sendNotificationEmail(
    subscription.user.email,
    subscription.user.firstName,
    'Payment Restored - Subscription Active',
    `Great news! Your payment for ${subscription.package?.name || 'your subscription'} has been successfully processed. Your subscription is now active again.`,
    '/dashboard',
    'View Dashboard'
  )
}

async function sendCancellationEmail(subscription: any): Promise<void> {
  if (!subscription.user) return

  await emailService.sendNotificationEmail(
    subscription.user.email,
    subscription.user.firstName,
    'Subscription Cancelled - Payment Failed',
    `Unfortunately, we were unable to process payment for your ${subscription.package?.name || 'subscription'} after multiple attempts. Your subscription has been cancelled. You can resubscribe at any time from your billing settings.`,
    '/billing',
    'Resubscribe'
  )
}

export async function handleInvoicePaymentFailed(
  invoice: any
): Promise<void> {
  if (!invoice.subscription) return

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { user: true },
  })

  if (!subscription) return

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' } as any,
  })

  // Send first dunning email immediately
  if (subscription.user) {
    await emailService.sendNotificationEmail(
      subscription.user.email,
      subscription.user.firstName,
      'Payment Failed - Action Required',
      `We were unable to process payment for your ${subscription.packageId || 'subscription'}. Please update your payment method to avoid service interruption.`,
      '/billing',
      'Update Payment Method'
    )
  }
}

export async function handleSubscriptionTrialEnding(
  subscriptionId: string
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, package: true },
  })

  if (!subscription || !subscription.user) return

  const daysRemaining = Math.ceil(
    (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining <= 3 && daysRemaining > 0) {
    await emailService.sendTrialEndingEmail(
      subscription.user.email,
      subscription.user.firstName,
      subscription.package?.name || 'subscription',
      daysRemaining,
      subscription.endDate.toLocaleDateString(),
      '/billing'
    )
  }
}