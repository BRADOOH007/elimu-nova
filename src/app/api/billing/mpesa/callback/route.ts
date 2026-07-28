import { NextResponse } from 'next/server'
import { parseCallback } from '@/lib/daraja'
import { prisma } from '@/lib/prisma'

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

    if (result.success) {
      // Find subscription by transactionId (CheckoutRequestID)
      const subscription = await (prisma as any).subscription.findFirst({
        where: {
          OR: [
            { transactionId: result.checkoutRequestId },
            { notes: { contains: result.checkoutRequestId } },
          ],
        },
      })

      if (subscription) {
        await (prisma as any).subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            transactionId: result.mpesaReceiptNumber || result.checkoutRequestId,
            paymentMethod: 'MPESA',
            notes: `MPESA:${result.mpesaReceiptNumber}|${result.checkoutRequestId}|${result.phoneNumber}|${result.amount}`,
          },
        })

        // Create invoice
        const lastInvoice = await (prisma as any).invoice.findFirst({
          orderBy: { createdAt: 'desc' },
        })
        let nextNum = 1
        if (lastInvoice?.invoiceNumber) {
          const num = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10)
          if (!isNaN(num)) nextNum = num + 1
        }

        await (prisma as any).invoice.create({
          data: {
            invoiceNumber: `INV-${String(nextNum).padStart(6, '0')}`,
            subscriptionId: subscription.id,
            amount: result.amount || subscription.amount,
            taxAmount: 0,
            totalAmount: result.amount || subscription.amount,
            status: 'PAID',
            dueDate: new Date(),
            paidDate: new Date(),
            notes: `M-Pesa: ${result.mpesaReceiptNumber || 'N/A'}`,
          },
        })

        log.info(`Subscription ${subscription.id} activated via M-Pesa ${result.mpesaReceiptNumber}`)
      } else {
        log.info(`No subscription found for CheckoutRequestID ${result.checkoutRequestId}`)
      }
    }

    // Daraja expects ResultCode 0 to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    log.error('M-Pesa callback error:', error)
    // Always return 0 to Daraja so they don't retry indefinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

})
