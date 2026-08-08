import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (_req, { user }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ slots: [] })

  const slots = await (prisma as any).timetableSlot.findMany({
    where: { schoolId: teacher.schoolId, teacherId: teacher.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ slots })
})
