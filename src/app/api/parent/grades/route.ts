import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const p = prisma as any

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')

  const parent = await p.parent.findUnique({
    where: { userId: user.id },
    include: { students: { include: { student: true } } },
  })

  if (!parent) {
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
  }

  const studentIds: string[] = parent.students.map((ps: any) => ps.student.id)

  if (studentId && !studentIds.includes(studentId)) {
    return NextResponse.json({ error: 'Student not linked to parent' }, { status: 403 })
  }

  const targetIds = studentId ? [studentId] : studentIds

  const submissions = await p.submission.findMany({
    where: {
      studentId: { in: targetIds },
      grade: { not: null },
    },
    include: {
      assignment: { select: { id: true, title: true, subject: true, createdAt: true } },
    },
    orderBy: { gradedAt: 'desc' },
    take: 100,
  })

  // Fetch student names
  const studentUserMap: Record<string, string> = {}
  for (const sid of targetIds) {
    const student = await p.student.findUnique({
      where: { id: sid },
      include: { user: { select: { firstName: true, lastName: true } } },
    })
    if (student?.user) {
      studentUserMap[sid] = `${student.user.firstName} ${student.user.lastName}`
    }
  }

  // Group by student
  const byStudent: Record<string, any[]> = {}
  for (const sub of submissions) {
    const name = studentUserMap[sub.studentId] || 'Unknown'
    if (!byStudent[name]) byStudent[name] = []
    byStudent[name].push({
      id: sub.id,
      grade: sub.grade,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt,
      isAiGraded: sub.isAiGraded,
      assignment: sub.assignment,
    })
  }

  const summary = Object.entries(byStudent).map(([name, grades]) => ({
    studentName: name,
    totalGrades: grades.length,
    averageGrade: grades.reduce((sum: number, g: any) => sum + (g.grade || 0), 0) / grades.length,
    grades,
  }))

  return NextResponse.json({ students: summary })
})
