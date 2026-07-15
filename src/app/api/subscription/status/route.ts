import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  let session: any = null
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Subscription status: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Subscription status request for user: ${session.user.id} (${session.user.role})`)

    let userId: string | undefined
    let schoolId: string | undefined

    // Determine if this is an independent user or school-based user
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      })
      
      console.log(`Teacher record found:`, teacher ? { id: teacher.id, schoolId: teacher.schoolId } : 'null')
      
      if (teacher?.schoolId) {
        schoolId = teacher.schoolId
      } else {
        userId = session.user.id // Independent teacher
      }
    } else if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: { teacher: true }
      })
      
      console.log(`Student record found:`, student ? { id: student.id, schoolId: student.schoolId, teacherId: student.teacherId } : 'null')
      
      if (student?.schoolId) {
        schoolId = student.schoolId
      } else if (student?.teacher && !student.teacher.schoolId) {
        // Independent student under independent teacher
        userId = student.teacher.userId
      } else {
        userId = session.user.id // Independent student
      }
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findUnique({
        where: { userId: session.user.id }
      })
      schoolId = schoolAdmin?.schoolId
    } else if (session.user.role === 'PARENT' || session.user.role === 'SUPER_ADMIN') {
      // Parents and super admins use their own userId for subscription context
      userId = session.user.id
    }

    console.log(`Subscription context determined: userId=${userId}, schoolId=${schoolId}`)

    if (!userId && !schoolId) {
      console.error('Unable to determine subscription context for user:', {
        userId: session.user.id,
        role: session.user.role,
        email: session.user.email
      })
      return NextResponse.json({ 
        error: 'Unable to determine subscription context',
        debug: {
          userId: session.user.id,
          role: session.user.role
        }
      }, { status: 400 })
    }

    const subscriptionInfo = await getSubscriptionStatus(userId, schoolId)
    console.log(`Subscription info retrieved:`, subscriptionInfo)

    return NextResponse.json({
      subscription: subscriptionInfo,
      context: {
        userId,
        schoolId,
        userRole: session.user.role
      }
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id,
      role: session?.user?.role
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription status',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error'
        } : undefined
      },
      { status: 500 }
    )
  }
}