import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { resolveSubscription } from '@/lib/payment-notifications'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  // School admins subscribe at the school level — resolve by school first,
  // fall back to the user's own subscription for independent admins.
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true },
  })

  const subscription = await resolveSubscription(schoolAdmin?.schoolId, user.id)

  if (!subscription) {
    return NextResponse.json({ invoices: [] })
  }

  const invoices = await prisma.invoice.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ invoices })
})
