import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      teacher: {
        include: { user: true }
      }
    }
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (assignment.teacher.user.email !== user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const rubrics = await prisma.aIGeneratedContent.findMany({
    where: {
      teacherId: teacher.id,
      type: 'RUBRIC'
    },
    select: {
      id: true,
      title: true,
      subject: true,
      grade: true,
      topic: true,
      createdAt: true,
      metadata: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  let assignmentSubject = ''
  let assignmentGrade = ''

  try {
    const assignmentContent = JSON.parse(assignment.content)
    assignmentSubject = assignmentContent.subject || ''
    assignmentGrade = assignmentContent.grade || ''
  } catch (error) {
  }

  const compatibleRubrics = rubrics.filter(rubric =>
    (assignmentSubject && rubric.subject.toLowerCase().includes(assignmentSubject.toLowerCase())) ||
    (assignmentGrade && rubric.grade.toLowerCase().includes(assignmentGrade.toLowerCase()))
  )

  const otherRubrics = rubrics.filter(rubric =>
    !compatibleRubrics.find(cr => cr.id === rubric.id)
  )

  return NextResponse.json({
    compatible: compatibleRubrics,
    other: otherRubrics,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      subject: assignmentSubject,
      grade: assignmentGrade
    }
  })
})
