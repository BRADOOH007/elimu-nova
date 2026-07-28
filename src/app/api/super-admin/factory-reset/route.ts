import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('super-admin/factory-reset')


export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const body = await req.json()
    const { confirmation } = body
    if (confirmation !== 'FACTORY RESET') {
      return NextResponse.json({ error: 'Must send confirmation: "FACTORY RESET"' }, { status: 400 })
    }

    const results: Record<string, number> = {}

    await prisma.$transaction(async (tx) => {
      results.submissions = (await tx.submission.deleteMany()).count
      results.assignments = (await tx.assignment.deleteMany()).count
      results.lessonPlans = (await tx.lessonPlan.deleteMany()).count
      results.schemesOfWork = (await tx.schemeOfWork.deleteMany()).count
      results.aIGeneratedContent = (await tx.aIGeneratedContent.deleteMany()).count
      results.aIGeneratedImages = (await tx.aIGeneratedImage.deleteMany()).count
      results.curriculumLessons = (await tx.curriculumLesson.deleteMany()).count
      results.resources = (await tx.resource.deleteMany()).count
      results.meetings = (await tx.meeting.deleteMany()).count
      results.messages = (await tx.message.deleteMany()).count
      results.notifications = (await tx.notification.deleteMany()).count
      results.activities = (await tx.activity.deleteMany()).count
      results.searchHistory = (await tx.searchHistory.deleteMany()).count
      results.invoices = (await tx.invoice.deleteMany()).count
      results.subscriptions = (await tx.subscription.deleteMany()).count
      results.courseEnrollments = (await tx.courseEnrollment.deleteMany()).count
      results.teacherCourseAssignments = (await tx.teacherCourseAssignment.deleteMany()).count
      results.courses = (await tx.course.deleteMany()).count
      results.classes = (await tx.class.deleteMany()).count
      results.parentStudents = (await tx.parentStudent.deleteMany()).count
      results.parents = (await tx.parent.deleteMany()).count
      results.students = (await tx.student.deleteMany()).count
      results.teachers = (await tx.teacher.deleteMany()).count
      results.schoolAdmins = (await tx.schoolAdmin.deleteMany()).count
      results.schoolSettings = (await tx.schoolSettings.deleteMany()).count
      results.schools = (await tx.school.deleteMany()).count
      results.sessions = (await tx.session.deleteMany()).count
      results.accounts = (await tx.account.deleteMany()).count

      const nonSuperUserIds = (
        await tx.user.findMany({
          where: { role: { not: 'SUPER_ADMIN' } },
          select: { id: true },
        })
      ).map(u => u.id)

      results.users = nonSuperUserIds.length > 0
        ? (await tx.user.deleteMany({ where: { id: { in: nonSuperUserIds } } })).count
        : 0

      await tx.securityLog.create({
        data: {
          eventType: 'CUSTOM',
          severity: 'CRITICAL',
          description: `Factory reset performed by super admin ${user.id}. Records deleted: ${JSON.stringify(results)}`,
          userId: user.id,
          metadata: JSON.stringify(results),
        },
      })
    })

    logger.warn('Factory reset completed by:', { userId: user.id, results })

    return NextResponse.json({
      success: true,
      message: 'Factory reset complete. All student, teacher, school, and subscription records have been deleted.',
      deleted: results,
    })
  } catch (error) {
    logger.error('Factory reset failed:', error)
    return NextResponse.json({ error: 'Factory reset failed' }, { status: 500 })
  }

})
