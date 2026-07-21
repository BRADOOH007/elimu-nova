import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, successUrl, cancelUrl } = body

    if (!packageId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: packageId, successUrl, cancelUrl' },
        { status: 400 }
      )
    }

    // Get package details - try by ID first, then by name
    let packageInfo = await prisma.package.findUnique({
      where: { id: packageId }
    })

    if (!packageInfo) {
      // Try matching by name (supporting hardcoded plan IDs)
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

    // Determine subscription context
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { school: true }
      })
      
      if (teacher?.schoolId) {
        schoolId = teacher.schoolId
      } else {
        userId = session.user.id // Independent teacher
      }
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findUnique({
        where: { userId: session.user.id },
        include: { school: true }
      })
      schoolId = schoolAdmin?.schoolId
    } else {
      userId = session.user.id // Independent user
    }

    // Create checkout session using the subscription service
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
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}