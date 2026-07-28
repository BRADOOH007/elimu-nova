import { NextResponse } from 'next/server'
import { startFreeTrial } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIdentifier, rateLimitAuth } from '@/lib/rate-limit'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {
  const rl = await checkRateLimit(`trial:${getClientIdentifier(req)}`, rateLimitAuth)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let userId: string | undefined
  let schoolId: string | undefined

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })
    
    if (teacher?.schoolId) {
      schoolId = teacher.schoolId
    } else {
      userId = user.id
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id }
    })
    schoolId = schoolAdmin?.schoolId
  } else {
    userId = user.id
  }

  if (!userId && !schoolId) {
    return NextResponse.json({ error: 'Unable to determine subscription context' }, { status: 400 })
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: userId ? { userId } : { schoolId }
  })

  if (existingSubscription) {
    return NextResponse.json({ error: 'Subscription already exists' }, { status: 400 })
  }

  await startFreeTrial(userId, schoolId)

  return NextResponse.json({
    success: true,
    message: 'Free trial started successfully',
    trialDays: 10
  })
})
