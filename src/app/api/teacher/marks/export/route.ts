import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { toCsv, csvResponse } from '@/lib/csv-export'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const assignmentId = searchParams.get('assignmentId')
  const classId = searchParams.get('classId')

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!teacher) {
    return new NextResponse('Teacher not found', { status: 404 })
  }

  const where: any = {
    assignment: { teacherId: teacher.id },
    grade: { not: null },
  }
  if (assignmentId) where.assignmentId = assignmentId
  if (classId) where.student = { classId }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: { include: { user: true, class: true } },
      assignment: { select: { id: true, title: true, subject: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })

  const rows = submissions.map((s) => ({
    studentName: `${s.student.user.firstName} ${s.student.user.lastName}`,
    studentId: s.studentId,
    class: s.student.class?.name ?? '',
    assignment: s.assignment.title,
    subject: s.assignment.subject ?? '',
    score: s.grade,
    feedback: s.feedback ?? '',
    status: s.status,
    submittedAt: s.submittedAt.toISOString(),
  }))

  const columns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'class', label: 'Class' },
    { key: 'assignment', label: 'Assignment' },
    { key: 'subject', label: 'Subject' },
    { key: 'score', label: 'Score' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'status', label: 'Status' },
    { key: 'submittedAt', label: 'Submitted At' },
  ]

  const csv = toCsv(rows, columns)
  const filename = `marks-export-${Date.now()}.csv`
  return csvResponse(csv, filename)
})
