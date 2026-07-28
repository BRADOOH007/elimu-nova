import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const debug: any = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    user: {
      id: user.id,
      role: user.role,
      email: user.email
    }
  }

  try {
    const userCount = await prisma.user.count()
    debug.database = {
      connected: true,
      userCount
    }
  } catch (error) {
    debug.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  let roleRecord = null
  try {
    if (user.role === 'TEACHER') {
      roleRecord = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { school: { select: { name: true } } }
      })
    } else if (user.role === 'STUDENT') {
      roleRecord = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          school: { select: { name: true } },
          teacher: { select: { userId: true, schoolId: true } }
        }
      })
    } else if (user.role === 'SCHOOL_ADMIN') {
      roleRecord = await prisma.schoolAdmin.findUnique({
        where: { userId: user.id },
        include: { school: { select: { name: true } } }
      })
    }

    debug.roleRecord = roleRecord
  } catch (error) {
    debug.roleRecord = {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    let subscriptions: any[] = []

    if (roleRecord) {
      const schoolId = (roleRecord as any).schoolId
      const userId = user.role === 'TEACHER' && !schoolId ? user.id : undefined

      if (schoolId || userId) {
        subscriptions = await prisma.subscription.findMany({
          where: {
            ...(userId && { userId }),
            ...(schoolId && { schoolId })
          },
          include: { package: { select: { name: true, price: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      }
    }

    debug.subscriptions = subscriptions
  } catch (error) {
    debug.subscriptions = {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    const { getSubscriptionStatus } = await import('@/lib/subscription-service')

    let userId: string | undefined
    let schoolId: string | undefined

    if (roleRecord) {
      schoolId = (roleRecord as any).schoolId
      if (!schoolId && user.role === 'TEACHER') {
        userId = user.id
      }
    }

    if (userId || schoolId) {
      const subscriptionStatus = await getSubscriptionStatus(userId, schoolId)
      debug.subscriptionService = {
        success: true,
        result: subscriptionStatus
      }
    } else {
      debug.subscriptionService = {
        success: false,
        reason: 'No userId or schoolId determined'
      }
    }
  } catch (error) {
    debug.subscriptionService = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  }

  return NextResponse.json(debug)
})
