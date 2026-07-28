import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'none' }, async () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const parents = await prisma.parent.findMany({
    include: {
      user: { select: { id: true } },
      students: {
        include: {
          student: {
            include: {
              studentProgress: { select: { masteryScore: true, updatedAt: true } },
              user: { select: { firstName: true, lastName: true } },
            }
          }
        }
      }
    }
  })

  let alertsCreated = 0

  for (const parent of parents) {
    for (const ps of parent.students) {
      const progressRecords = ps.student.studentProgress
      for (const progress of progressRecords) {
        if (!progress.masteryScore || !progress.updatedAt) continue

        const dayBefore = new Date(progress.updatedAt.getTime() - 86400000)
        const snapshot = await prisma.studentProgress.findFirst({
          where: {
            studentId: ps.studentId,
            updatedAt: { lte: dayBefore },
          },
          orderBy: { updatedAt: 'desc' },
        })

        const prevScore = snapshot?.masteryScore ?? progress.masteryScore
        const drop = prevScore - progress.masteryScore

        if (drop > 10) {
          const studentName = `${ps.student.user.firstName} ${ps.student.user.lastName}`
          await prisma.notification.create({
            data: {
              title: 'Performance Drop Alert',
              message: `${studentName}'s mastery score dropped from ${prevScore}% to ${progress.masteryScore}% (${drop} point drop).`,
              type: 'warning',
              userId: parent.user.id,
            },
          })
          alertsCreated++
        }
      }
    }
  }

  return NextResponse.json({
    processed: parents.length,
    alertsCreated,
  })
})
