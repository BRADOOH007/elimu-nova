import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/gradebook')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const [classes, assignments] = await Promise.all([
      prisma.class.findMany({
        where: { teacherId: teacher.id },
        select: { id: true, name: true, grade: true, subject: true, _count: { select: { students: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        include: {
          submissions: {
            include: {
              student: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { student: { user: { firstName: 'asc' } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const allSubmissions = assignments.flatMap(a => a.submissions)
    const graded = allSubmissions.filter(s => s.grade !== null)
    const avgGrade = graded.length > 0 ? graded.reduce((s, sub) => s + (sub.grade || 0), 0) / graded.length : 0

    // Grade distribution buckets
    const dist = { '0-19': 0, '20-39': 0, '40-59': 0, '60-79': 0, '80-100': 0 }
    for (const s of graded) {
      const g = s.grade || 0
      if (g >= 80) dist['80-100']++
      else if (g >= 60) dist['60-79']++
      else if (g >= 40) dist['40-59']++
      else if (g >= 20) dist['20-39']++
      else dist['0-19']++
    }

    return NextResponse.json({
      classes: classes.map(c => ({ ...c, studentCount: c._count.students })),
      assignments,
      stats: {
        totalAssignments: assignments.length,
        totalSubmissions: allSubmissions.length,
        gradedSubmissions: graded.length,
        pendingGrading: allSubmissions.length - graded.length,
        averageGrade: Math.round(avgGrade * 100) / 100,
        gradeDistribution: Object.entries(dist).map(([range, count]) => ({ range, count })),
      },
    })
  } catch (error) {
    log.error('Error fetching gradebook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'TEACHER' }, async () => {
  // Grading is fully automatic. Teachers cannot enter or change grades.
  return NextResponse.json(
    { error: 'Grading is automatic. Teachers cannot enter grades.', code: 'GRADING_AUTOMATIC' },
    { status: 400 }
  )
})
