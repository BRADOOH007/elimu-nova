import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  const { packageId, successUrl, cancelUrl } = body

  if (!packageId || !successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: 'Missing required fields: packageId, successUrl, cancelUrl' },
      { status: 400 }
    )
  }

  let packageInfo = await prisma.package.findUnique({
    where: { id: packageId }
  })

  if (!packageInfo) {
    const nameMap: Record<string, string> = {
      starter: 'Starter School Plan',
      growth: 'Growth Plan',
      excellence: 'Excellence Plan',
    }
    const planName = nameMap[packageId]
    if (planName) {
      packageInfo = await prisma.package.findFirst({
        where: { name: planName, isActive: true },
      })
    }
  }

  if (!packageInfo) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  let userId: string | undefined
  let schoolId: string | undefined

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { school: true }
    })
    
    if (teacher?.schoolId) {
      schoolId = teacher.schoolId
    } else {
      userId = user.id
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id },
      include: { school: true }
    })
    schoolId = schoolAdmin?.schoolId
  } else {
    userId = user.id
  }

  const checkoutSession = await createCheckoutSession(
    packageId,
    successUrl,
    cancelUrl,
    userId,
    schoolId
  )

  return NextResponse.json({
    checkoutUrl: checkoutSession.url,
    sessionId: checkoutSession.id
  })
})
