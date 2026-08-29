import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

// GET /api/parent/digest — weekly summary of each child's learning
export const GET = route({ auth: 'PARENT' }, async (request, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { students: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
    })
    if (!parent) return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 })

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const children = []
    for (const ps of parent.students) {
      const s = ps.student
      const [submissions, reading] = await Promise.all([
        prisma.submission.findMany({
          where: { studentId: s.id, submittedAt: { gte: weekAgo } },
          select: { grade: true, status: true, assignment: { select: { title: true, subject: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
        prisma.readingLog.findMany({
          where: { studentId: s.id, date: { gte: weekAgo.toISOString().split('T')[0] } },
          select: { minutes: true },
        }),
      ])

      const graded = submissions.filter(x => x.grade != null)
      const avg = graded.length ? Math.round(graded.reduce((sum, x) => sum + (x.grade || 0), 0) / graded.length) : null
      const minutes = reading.reduce((sum, r) => sum + r.minutes, 0)

      children.push({
        name: `${s.user.firstName} ${s.user.lastName}`.trim(),
        submissionsCount: submissions.length,
        averageGrade: avg,
        readingMinutes: minutes,
        recent: submissions.slice(0, 3).map(x => ({ title: x.assignment?.title, subject: x.assignment?.subject, grade: x.grade, status: x.status })),
      })
    }

    return NextResponse.json({ weekOf: weekAgo.toISOString().split('T')[0], children })
  } catch (e) {
    console.error('[Parent] digest failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
