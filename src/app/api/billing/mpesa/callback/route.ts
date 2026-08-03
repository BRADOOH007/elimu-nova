import { NextResponse } from 'next/server'
import { parseCallback } from '@/lib/daraja'
import { prisma } from '@/lib/prisma'
import { handlePaymentSuccess, handlePaymentFailure } from '@/lib/payment-notifications'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('billing/mpesa/callback')

export const POST = route({ auth: 'none' }, async (req, { user, params }) => {
  try {
    const body = await req.json()
    const result = parseCallback(body)

    if (!result) {
      log.error('M-Pesa callback: invalid payload', JSON.stringify(body))
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' })
    }

    log.info(`M-Pesa callback: ${result.checkoutRequestId} -> ${result.success ? 'SUCCESS' : 'FAILED'} (${result.resultDesc})`)

    // Find subscription by transactionId (CheckoutRequestID)
    const subscription = await (prisma as any).subscription.findFirst({
      where: {
        OR: [
          { transactionId: result.checkoutRequestId },
          { notes: { contains: result.checkoutRequestId } },
        ],
      },
    })

    if (result.success) {
      if (subscription) {
        await handlePaymentSuccess({
          subscriptionId: subscription.id,
          amount: result.amount || subscription.amount,
          method: 'MPESA',
          receipt: result.mpesaReceiptNumber || result.checkoutRequestId,
          notes: `MPESA:${result.mpesaReceiptNumber}|${result.checkoutRequestId}|${result.phoneNumber}|${result.amount}`,
        })
        log.info(`Subscription ${subscription.id} activated via M-Pesa ${result.mpesaReceiptNumber}`)
      } else {
        log.info(`No subscription found for CheckoutRequestID ${result.checkoutRequestId}`)
      }
    } else if (subscription) {
      await handlePaymentFailure({
        subscriptionId: subscription.id,
        method: 'MPESA',
        checkoutRequestId: result.checkoutRequestId,
        reason: result.resultDesc,
      })
      log.info(`M-Pesa payment failed for subscription ${subscription.id}: ${result.resultDesc}`)
    }

    // Daraja expects ResultCode 0 to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    log.error('M-Pesa callback error:', error)
    // Always return 0 to Daraja so they don't retry indefinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

})
