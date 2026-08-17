import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { getSubscriptionStatus } from '@/lib/subscription-service'

// Returns the senior student's access status (PENDING | FREEMIUM | ACTIVE | LOCKED)
// plus whether their subscription is currently active. Exempt from the middleware
// subscription check so PENDING/LOCKED/expired users still see the right screen.
export const GET = route({ auth: 'SENIOR_STUDENT', skipSubscriptionCheck: true }, async (_req, { user }) => {
  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) {
    senior = await prisma.seniorStudent.create({
      data: { userId: user.id, approvalStatus: 'PENDING' },
    })
  }

  const sub = await getSubscriptionStatus(user.id).catch(() => ({ isActive: false } as any))

  return NextResponse.json({
    approvalStatus: senior.approvalStatus,
    hasActiveAccess: sub.isActive,
    name: user.name,
  })
})
