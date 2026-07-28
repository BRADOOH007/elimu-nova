import { NextResponse } from 'next/server'
import { getStripeAsync, getWebhookSecret } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { route } from '@/lib/api-middleware'

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

      logger.info('Checkout completed — subscription activated', {
        localSubId,
        stripeSubId,
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (!invoice.subscription) {
        logger.info('No subscription associated with this invoice')
        break
      }
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id
        },
        data: {
          status: 'ACTIVE'
        }
      })

      logger.info('Payment succeeded for subscription', { subscriptionId: subscription.id })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (!invoice.subscription) {
        logger.info('No subscription associated with this invoice')
        break
      }
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id
        },
        data: {
          status: 'INACTIVE'
        }
      })

      logger.info('Payment failed for subscription', { subscriptionId: subscription.id })
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

      logger.info('Subscription updated', { subscriptionId: subscription.id, status })
      break
    }

    default:
      logger.warn('Unhandled event type', { eventType: event.type })
  }

  return NextResponse.json({ received: true })
})
