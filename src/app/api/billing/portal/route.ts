import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { createCustomerPortalSession } from '@/lib/billing-portal'
import { logger } from '@/lib/logger'

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { returnUrl } = body

  if (!returnUrl) {
    return NextResponse.json(
      { error: 'Missing returnUrl' },
      { status: 400 }
    )
  }

  const portalUrl = await createCustomerPortalSession(
    user.id,
    returnUrl
  )

  return NextResponse.json({ url: portalUrl })
})
