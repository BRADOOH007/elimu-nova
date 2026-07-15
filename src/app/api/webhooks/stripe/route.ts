import { NextRequest, NextResponse } from 'next/server'
import { getStripeAsync, getWebhookSecret } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')!

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

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        if (!invoice.subscription) {
          logger.info('No subscription associated with this invoice')
          break
        }
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        
        const { userId, schoolId } = subscription.metadata
        
        // Update subscription status to active
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
        
        // Update subscription status to inactive
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
        
        // Cancel subscription in database
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
  } catch (error) {
    logger.error('Error processing webhook', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}