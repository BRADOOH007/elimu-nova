import { NextResponse } from 'next/server'
import { captureOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { handlePaymentSuccess } from '@/lib/payment-notifications'
import { invalidateSubscriptionCache } from '@/lib/subscription-service'

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * PayPal returns the payer to this URL (with `?token=<orderId>`) after they
 * approve the payment. We capture the order, activate the matching PENDING
 * subscription, then redirect to the success / cancel page.
 */
export const GET = route({}, async (req) => {
  const orderId = new URL(req.url).searchParams.get('token')
  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/subscription/cancel`)
  }

  try {
    const capture = await captureOrder(orderId)
    if (capture.status !== 'COMPLETED') {
      return NextResponse.redirect(`${baseUrl}/subscription/cancel`)
    }

    const subscription = await prisma.subscription.findFirst({
      where: { transactionId: orderId },
    })

    if (!subscription) {
      console.warn('[PayPal] No subscription found for order', orderId)
      return NextResponse.redirect(`${baseUrl}/subscription/cancel`)
    }

    await handlePaymentSuccess({
      subscriptionId: subscription.id,
      amount: capture.amount ?? subscription.amount,
      method: 'PayPal',
      receipt: capture.captureId || orderId,
      notes: `paypal_order:${orderId}`,
    })

    try {
      await invalidateSubscriptionCache(subscription.userId || undefined, subscription.schoolId || undefined)
    } catch { /* ignore */ }

    return NextResponse.redirect(`${baseUrl}/subscription/success`)
  } catch (error) {
    console.error('[PayPal] Capture failed:', error)
    return NextResponse.redirect(`${baseUrl}/subscription/cancel`)
  }
})
