import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('parent/live-metrics')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            submissions: {
              where: { grade: null, status: 'PENDING' },
              select: { id: true }
            },
          }
        }
      }
    })

    const children = parentStudents.map(ps => ps.student)
    const childIds = children.map(c => c.id)

    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [recentAlerts, upcomingEvents] = await Promise.all([
      prisma.notification.count({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, isRead: false }
      }),
      prisma.meeting.count({
        where: {
          attendees: { path: ['$', 'parents'], array_contains: user.id } as any,
          date: { gte: today },
          status: 'SCHEDULED',
        },
      }),
    ])

    return NextResponse.json({
      childrenCount: children.length,
      pendingWork: children.reduce((s, c) => s + c.submissions.length, 0),
      recentAlerts,
      upcomingEvents,
      children: children.map(c => ({
        id: c.id,
        name: `${c.user.firstName} ${c.user.lastName}`,
        pendingWork: c.submissions.length,
      })),
    })
  } catch (error) {
    log.error('Error fetching live metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
