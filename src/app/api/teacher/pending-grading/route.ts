import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/pending-grading')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      select: { id: true, title: true, subject: true },
    })

    const assignmentIds = assignments.map(a => a.id)
    const pending = await prisma.submission.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        grade: null,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    })

    const assignmentMap = new Map(assignments.map(a => [a.id, a]))

    return NextResponse.json({
      pending: pending.map(s => {
        const asn = assignmentMap.get(s.assignmentId)
        return {
          id: s.id,
          studentId: s.studentId,
          studentName: `${s.student.user.firstName} ${s.student.user.lastName}`,
          assignmentId: s.assignmentId,
          assignmentTitle: asn?.title || 'Unknown',
          subject: asn?.subject || '',
          totalMarks: 100,
          submittedAt: s.submittedAt,
        }
      }),
    })
  } catch (error) {
    log.error('Error fetching pending grading:', error)
    return NextResponse.json({ pending: [] })
  }
})
