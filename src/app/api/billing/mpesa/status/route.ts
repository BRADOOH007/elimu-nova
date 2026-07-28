import { NextResponse } from 'next/server'
import { queryStatus, parseCallback } from '@/lib/daraja'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('billing/mpesa/status')

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const body = await req.json()
    const { checkoutRequestId } = body

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId required' }, { status: 400 })
    }

    const status = await queryStatus(checkoutRequestId)

    return NextResponse.json({
      success: status.ResponseCode === '0' && status.ResultCode === '0',
      responseCode: status.ResponseCode,
      resultCode: status.ResultCode,
      resultDesc: status.ResultDesc,
      checkoutRequestId: status.CheckoutRequestID,
      merchantRequestId: status.MerchantRequestID,
    })
  } catch (error) {
    log.error('M-Pesa status query error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query transaction status',
    }, { status: 500 })
  }

})
