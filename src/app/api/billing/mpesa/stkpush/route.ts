import { NextResponse } from 'next/server'
import { stkPush } from '@/lib/daraja'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('billing-mpesa-stkpush')

export const POST = route({ auth: 'SUPER_ADMIN' }, async (request) => {
  const body = await request.json()
  const { phone, amount, schoolId, subscriptionId, accountRef } = body

  if (!phone || !amount) {
    return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 })
  }

  // Normalize phone: remove leading 0 or +254, ensure 254 format
  let normalizedPhone = phone.replace(/[^0-9]/g, '')
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.slice(1)
  } else if (normalizedPhone.startsWith('254') && normalizedPhone.length === 12) {
    // already correct
  } else if (normalizedPhone.startsWith('7') || normalizedPhone.startsWith('1')) {
    normalizedPhone = '254' + normalizedPhone
  }

  if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('254')) {
    return NextResponse.json({ error: 'Invalid phone number. Use 07XX, 2547XX, or +2547XX format.' }, { status: 400 })
  }

  const ref = accountRef || (schoolId ? `SCH-${schoolId.slice(-8)}` : `SUB-${(subscriptionId || '').slice(-8) || 'PAY'}`)

  const result = await stkPush(normalizedPhone, amount, ref, 'Subscription Payment')

  // Store the pending transaction
  if (subscriptionId || schoolId) {
    await (prisma as any).subscription.update({
      where: subscriptionId ? { id: subscriptionId } : { id: schoolId },
      data: { transactionId: result.CheckoutRequestID, notes: `MPESA_STK:${result.CheckoutRequestID}` },
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    message: 'STK Push sent. Check your phone to complete payment.',
    checkoutRequestId: result.CheckoutRequestID,
    merchantRequestId: result.MerchantRequestID,
  })
})
