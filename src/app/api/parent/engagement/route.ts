import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('parent/engagement')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } }
    })

    const children = parentStudents.map(ps => ps.student)

    const [meetingsAttended, messagesSent] = await Promise.all([
      prisma.meeting.count({
        where: {
          attendees: { path: ['$', 'parents'], array_contains: user.id } as any,
          date: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      }),
      prisma.message.count({
        where: {
          senderId: user.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ])

    const [recentMeetings, recentMessages] = await Promise.all([
      prisma.meeting.findMany({
        where: { attendees: { path: ['$', 'parents'], array_contains: user.id } as any },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, title: true, date: true, status: true },
      }),
      prisma.message.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, subject: true, createdAt: true, recipientType: true },
      }),
    ])

    return NextResponse.json({
      stats: { meetingsAttended, messagesSent, childrenCount: children.length },
      recentMeetings,
      recentMessages,
      children: children.map(c => ({
        id: c.id,
        name: `${c.user.firstName} ${c.user.lastName}`,
      })),
    })
  } catch (error) {
    log.error('Error fetching engagement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
