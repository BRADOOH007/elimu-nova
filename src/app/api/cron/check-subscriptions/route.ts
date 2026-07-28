import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'none' }, async () => {
  const now = new Date()
  let expired = 0
  let trialled = 0

  // Mark ACTIVE subscriptions past endDate as EXPIRED
  const activeExpired = await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })
  expired = activeExpired.count

  // Mark TRIAL subscriptions past trialEndsAt as TRIAL_EXPIRED
  const trialExpired = await prisma.subscription.updateMany({
    where: {
      isTrial: true,
      status: 'TRIAL',
      trialEndsAt: { lt: now },
    },
    data: { status: 'TRIAL_EXPIRED' },
  })
  trialled = trialExpired.count

  return NextResponse.json({
    ok: true,
    expired,
    trialExpired: trialled,
    message: `${expired} subscriptions expired, ${trialled} trials expired`,
  })
})
