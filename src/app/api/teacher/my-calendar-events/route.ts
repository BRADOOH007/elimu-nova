import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (_req, { user }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ events: [] })

  const events = await (prisma as any).academicCalendarEvent.findMany({
    where: {
      schoolId: teacher.schoolId,
      OR: [
        { targetAudience: 'ALL' },
        { targetAudience: 'TEACHERS' },
      ],
    },
    orderBy: { startDate: 'asc' },
    take: 30,
  })

  return NextResponse.json({ events })
})
