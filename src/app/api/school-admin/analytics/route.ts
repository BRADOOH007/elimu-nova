import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const schoolId = admin.schoolId

  const [classes, teachers, submissions, students] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId, isActive: true },
      include: { students: true },
    }),
    prisma.teacher.findMany({
      where: { schoolId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        assignments: { select: { id: true } },
        _count: { select: { assignments: true } },
      },
    }),
    prisma.submission.findMany({
      where: { grade: { not: null }, assignment: { schoolId } },
      include: {
        assignment: { select: { title: true, subject: true } },
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { gradedAt: 'desc' }, take: 200,
    }),
    prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true } },
        submissions: { where: { grade: { not: null } } },
        class: { select: { name: true, grade: true } },
      },
    }),
  ])

  // ── Class Performance Ranking ──
  const classPerformance = classes.map(cls => {
    const studentScores: number[] = []
    cls.students.forEach(s => { s.submissions?.forEach((sub: any) => { if (sub.grade != null) studentScores.push(sub.grade) }) })
    const avg = studentScores.length > 0 ? Number((studentScores.reduce((a: number, b: number) => a + b, 0) / studentScores.length).toFixed(1)) : 0
    return { id: cls.id, name: cls.name, grade: cls.grade, studentCount: cls.students.length, avgScore: avg, totalScores: studentScores.length }
  }).sort((a, b) => b.avgScore - a.avgScore)

  // ── Subject Mastery Insights ──
  const subjectMap = new Map<string, { total: number; count: number }>()
  for (const sub of submissions) {
    const subject = sub.assignment?.subject || 'General'
    const entry = subjectMap.get(subject) || { total: 0, count: 0 }
    entry.total += sub.grade ?? 0
    entry.count++
    subjectMap.set(subject, entry)
  }
  const subjectPerformance = Array.from(subjectMap.entries())
    .map(([s, d]) => ({ subject: s, avgScore: Number((d.total / d.count).toFixed(1)), assessmentCount: d.count }))
    .sort((a, b) => b.avgScore - a.avgScore)

  // ── Top Students ──
  const studentPerformance = students.map(s => {
    const scores = s.submissions.map(sub => sub.grade ?? 0).filter(g => g > 0)
    const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0
    return { id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, className: s.class?.name || 'N/A', grade: s.class?.grade || 'N/A', avgScore: avg, assessmentCount: scores.length }
  }).filter(s => s.assessmentCount > 0).sort((a, b) => b.avgScore - a.avgScore)

  // ── Teacher Coverage ──
  const teacherCoverage = teachers.map(t => ({
    id: t.id, name: `${t.user.firstName} ${t.user.lastName}`,
    totalAssignments: t._count.assignments,
    receivedSubmissions: 0, gradedSubmissions: 0, pendingSubmissions: 0,
  }))
  const subCounts = new Map<string, { recv: number; graded: number }>()
  for (const sub of submissions) {
    const entry = subCounts.get(sub.assignment?.subject || '') || { recv: 0, graded: 0 }
    entry.recv++
    if (sub.grade != null) entry.graded++
    subCounts.set(sub.assignment?.subject || '', entry)
  }
  const totalSub = teacherCoverage.reduce((a, t) => a + t.totalAssignments, 0)
  const gradedSub = Array.from(subCounts.values()).reduce((a, v) => a + v.graded, 0)
  const allSub = Array.from(subCounts.values()).reduce((a, v) => a + v.recv, 0)

  return NextResponse.json({
    classPerformance: classPerformance.slice(0, 10),
    subjectPerformance: subjectPerformance.slice(0, 10),
    topStudents: studentPerformance.slice(0, 10),
    lowPerformingSubjects: [...subjectPerformance].reverse().slice(0, 5).filter(s => s.avgScore < 50),
    teacherCoverage: { totalAssignments: totalSub, gradedSubmissions: gradedSub, totalSubmissions: allSub, coveragePercent: totalSub > 0 ? Math.round((gradedSub / allSub) * 100) : 0, teachers: teacherCoverage },
    summary: {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      avgSchoolScore: classPerformance.length > 0 ? Number((classPerformance.reduce((a, c) => a + c.avgScore, 0) / classPerformance.length).toFixed(1)) : 0,
    },
  })
})
