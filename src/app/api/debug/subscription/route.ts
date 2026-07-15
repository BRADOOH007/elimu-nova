import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or for super admins
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const debug: any = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
      }
    }

    // Test database connection
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

    // Get user's role-specific record
    let roleRecord = null
    try {
      if (session.user.role === 'TEACHER') {
        roleRecord = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
          include: { school: { select: { name: true } } }
        })
      } else if (session.user.role === 'STUDENT') {
        roleRecord = await prisma.student.findUnique({
          where: { userId: session.user.id },
          include: { 
            school: { select: { name: true } },
            teacher: { select: { userId: true, schoolId: true } }
          }
        })
      } else if (session.user.role === 'SCHOOL_ADMIN') {
        roleRecord = await prisma.schoolAdmin.findUnique({
          where: { userId: session.user.id },
          include: { school: { select: { name: true } } }
        })
      }
      
      debug.roleRecord = roleRecord
    } catch (error) {
      debug.roleRecord = {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Get subscriptions
    try {
      let subscriptions: any[] = []
      
      if (roleRecord) {
        const schoolId = (roleRecord as any).schoolId
        const userId = session.user.role === 'TEACHER' && !schoolId ? session.user.id : undefined
        
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

    // Test the subscription service
    try {
      const { getSubscriptionStatus } = await import('@/lib/subscription-service')
      
      let userId: string | undefined
      let schoolId: string | undefined
      
      if (roleRecord) {
        schoolId = (roleRecord as any).schoolId
        if (!schoolId && session.user.role === 'TEACHER') {
          userId = session.user.id
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
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}