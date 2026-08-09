import { NextResponse } from 'next/server'
import { getSubscriptionStatus } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const CHILD_TRIAL_DAYS = 14

export const GET = route({}, async (req, { user }) => {
  console.log(`Subscription status request for user: ${user.id} (${user.role})`)

  let userId: string | undefined
  let schoolId: string | undefined

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })
    
    console.log(`Teacher record found:`, teacher ? { id: teacher.id, schoolId: teacher.schoolId } : 'null')
    
    if (teacher?.schoolId) {
      schoolId = teacher.schoolId
    } else {
      userId = user.id
    }
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        teacher: true,
        parents: {
          include: {
            parent: {
              include: { students: { select: { student: { select: { schoolId: true } } } } }
            }
          }
        }
      }
    })
    
    console.log(`Student record found:`, student ? { id: student.id, schoolId: student.schoolId, teacherId: student.teacherId } : 'null')
    
    if (student?.schoolId) {
      schoolId = student.schoolId
    } else if (student?.teacher && !student.teacher.schoolId) {
      userId = student.teacher.userId
    } else if (student?.parents && student.parents.length > 0) {
      // Home-schooled / parent-enrolled child: inherit the linked parent's
      // subscription. Resolve the parent's effective context the same way the
      // PARENT branch does — school-managed parents inherit school access,
      // otherwise their own subscription (parent_single / parent_family).
      const link = student.parents[0]
      const parent = link.parent
      const linkedSchoolId = parent.students.find(s => s.student.schoolId)?.student.schoolId
      if (linkedSchoolId) {
        schoolId = linkedSchoolId
      } else if ((await getSubscriptionStatus(parent.userId)).isActive) {
        userId = parent.userId
      } else {
        // Independent parent without an active plan: the child gets a 14-day
        // trial measured from the enrollment date. Once it lapses, access
        // stops until the parent subscribes.
        const trialEndsAt = new Date(link.createdAt.getTime() + CHILD_TRIAL_DAYS * 24 * 60 * 60 * 1000)
        const now = new Date()
        const isExpired = trialEndsAt < now
        const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        return NextResponse.json({
          subscription: {
            isActive: !isExpired,
            isTrial: true,
            isExpired,
            daysRemaining,
            status: isExpired ? 'TRIAL_EXPIRED' : 'TRIAL',
            packageName: 'Child Trial',
            trialEndsAt,
            endDate: trialEndsAt
          },
          context: {
            userId: user.id,
            schoolId: undefined,
            userRole: user.role
          }
        })
      }
    } else {
      userId = user.id
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id }
    })
    schoolId = schoolAdmin?.schoolId
  } else if (user.role === 'SUPER_ADMIN') {
    // Super admins always have access; return an active subscription
    return NextResponse.json({
      subscription: {
        isActive: true,
        isTrial: false,
        isExpired: false,
        daysRemaining: 9999,
        status: 'ACTIVE',
        packageName: 'Super Admin'
      },
      context: {
        userId: user.id,
        userRole: user.role
      }
    })
  } else if (user.role === 'PARENT') {
    const parentWithStudents = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { students: { include: { student: { select: { schoolId: true } } } } }
    })
    const linkedSchoolId = parentWithStudents?.students.find(s => s.student.schoolId)?.student.schoolId
    if (linkedSchoolId) {
      schoolId = linkedSchoolId
    } else {
      userId = user.id
    }
  }

  // Fallback for any unhandled role — subscribe as individual user
  if (!userId && !schoolId) {
    userId = user.id
  }

  console.log(`Subscription context determined: userId=${userId}, schoolId=${schoolId}`)

  const subscriptionInfo = await getSubscriptionStatus(userId, schoolId)
  console.log(`Subscription info retrieved:`, subscriptionInfo)

  return NextResponse.json({
    subscription: subscriptionInfo,
    context: {
      userId,
      schoolId,
      userRole: user.role
    }
  })
})
