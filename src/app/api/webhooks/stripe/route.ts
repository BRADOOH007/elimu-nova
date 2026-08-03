import { NextResponse } from 'next/server'
import { getStripeAsync, getWebhookSecret } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { route } from '@/lib/api-middleware'
import { invalidateCacheForStripeSubscription } from '@/lib/subscription-service'
import { handlePaymentSuccess, handlePaymentFailure } from '@/lib/payment-notifications'

export const POST = route({ auth: 'none' }, async (req) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  let stripe: Stripe

  try {
    stripe            = await getStripeAsync()
    const webhookSec  = await getWebhookSecret()
    event             = stripe.webhooks.constructEvent(body, signature, webhookSec)
  } catch (err) {
    logger.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const localSubId = session.metadata?.localSubscriptionId
      const stripeSubId = session.subscription as string | undefined

      if (!localSubId) {
        logger.warn('checkout.session.completed — no localSubscriptionId in metadata')
        break
      }

      const updateData: any = { status: 'ACTIVE' }
      if (stripeSubId) updateData.stripeSubscriptionId = stripeSubId

      if (stripeSubId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any
          if (stripeSub.current_period_end) {
            updateData.endDate = new Date(stripeSub.current_period_end * 1000)
          }
        } catch (err) {
          logger.warn('Could not retrieve Stripe subscription for endDate', err instanceof Error ? { error: err.message } : {})
        }
      }

      await prisma.subscription.update({
        where: { id: localSubId },
        data: updateData,
      })

      // Renewal just happened — invalidate the access cache so the subscriber
      // is immediately unblocked (not stuck behind the 60s TTL).
      try {
        const sub = await prisma.subscription.findUnique({
          where: { id: localSubId },
          select: { userId: true, schoolId: true },
        })
        await invalidateCacheForStripeSubscription(stripeSubId || '')
        if (sub?.schoolId) {
          const { invalidateSubscriptionCache } = await import('@/lib/subscription-service')
          await invalidateSubscriptionCache(sub.userId || undefined, sub.schoolId)
        }
      } catch (err) { logger.warn('Cache invalidation after checkout failed', err instanceof Error ? { error: err.message } : {}) }

      logger.info('Checkout completed — subscription activated', {
        localSubId,
        stripeSubId,
      })

      // Create a local PAID invoice + notify + email, so Stripe payments are
      // recorded in the same way as M-Pesa ones.
      try {
        const amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : undefined
        await handlePaymentSuccess({
          subscriptionId: localSubId,
          amount,
          method: 'STRIPE',
          receipt: session.id,
          notes: `STRIPE_SESSION:${session.id}`,
        })
      } catch (err) {
        logger.warn('Failed to record payment/invoice after checkout', err instanceof Error ? { error: err.message } : {})
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (!invoice.subscription) {
        logger.info('No subscription associated with this invoice')
        break
      }

      // Resolve the local subscription directly from the Stripe subscription id
      // (no live Stripe API call needed — resilient when keys are missing).
      const localSubs = await prisma.subscription.findMany({
        where: { stripeSubscriptionId: invoice.subscription },
      })

      for (const localSub of localSubs) {
        await prisma.subscription.update({
          where: { id: localSub.id },
          data: { status: 'ACTIVE' },
        })

        const amount = typeof invoice.amount_paid === 'number' ? invoice.amount_paid / 100 : undefined
        try {
          await handlePaymentSuccess({
            subscriptionId: localSub.id,
            amount,
            method: 'STRIPE',
            receipt: `in_${invoice.id}`,
            notes: `STRIPE_INVOICE:${invoice.id}`,
          })
        } catch (err) {
          logger.warn('Failed to record payment/invoice after invoice.payment_succeeded', err instanceof Error ? { error: err.message } : {})
        }
      }

      // Renewal / successful payment — invalidate access cache immediately.
      try { await invalidateCacheForStripeSubscription(invoice.subscription) } catch (err) { logger.warn('Cache invalidation failed', err instanceof Error ? { error: err.message } : {}) }

      logger.info('Payment succeeded for subscription', { subscriptionId: invoice.subscription })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (!invoice.subscription) {
        logger.info('No subscription associated with this invoice')
        break
      }

      const localSubs = await prisma.subscription.findMany({
        where: { stripeSubscriptionId: invoice.subscription },
      })

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: invoice.subscription
        },
        data: {
          status: 'INACTIVE'
        }
      })

      for (const localSub of localSubs) {
        try {
          await handlePaymentFailure({
            subscriptionId: localSub.id,
            method: 'STRIPE',
            reason: invoice.hosted_invoice_url || 'Card payment failed',
          })
        } catch (err) {
          logger.warn('Failed to send payment-failure notification', err instanceof Error ? { error: err.message } : {})
        }
      }

      logger.info('Payment failed for subscription', { subscriptionId: invoice.subscription })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id
        },
        data: {
          status: 'CANCELLED'
        }
      })

      logger.info('Subscription cancelled', { subscriptionId: subscription.id })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      let status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' = 'ACTIVE'

      if (subscription.status === 'canceled') {
        status = 'CANCELLED'
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        status = 'INACTIVE'
      }

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id
        },
        data: {
          status
        }
      })

      // Status changed (renewal/cancel/past_due) — invalidate access cache.
      try { await invalidateCacheForStripeSubscription(subscription.id) } catch (err) { logger.warn('Cache invalidation failed', err instanceof Error ? { error: err.message } : {}) }

      logger.info('Subscription updated', { subscriptionId: subscription.id, status })
      break
    }

    default:
      logger.warn('Unhandled event type', { eventType: event.type })
  }

  return NextResponse.json({ received: true })
})
