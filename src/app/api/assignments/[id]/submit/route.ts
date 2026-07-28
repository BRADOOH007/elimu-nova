import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'
import { NotificationGenerator } from '@/lib/notification-generator'

async function findBestRubricForAssignment(assignment: any) {
  try {
    const rubrics = await prisma.aIGeneratedContent.findMany({
      where: {
        teacherId: assignment.teacherId,
        type: 'RUBRIC'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (rubrics.length === 0) return null

    let assignmentSubject = ''
    let assignmentGrade = ''

    try {
      const assignmentContent = JSON.parse(assignment.content)
      assignmentSubject = assignmentContent.subject || ''
      assignmentGrade = assignmentContent.grade || ''
    } catch (error) {
    }

    const compatibleRubric = rubrics.find(rubric =>
      (assignmentSubject && rubric.subject.toLowerCase().includes(assignmentSubject.toLowerCase())) ||
      (assignmentGrade && rubric.grade.toLowerCase().includes(assignmentGrade.toLowerCase())) ||
      rubric.title.toLowerCase().includes(assignment.title.toLowerCase())
    )

    if (compatibleRubric) {
      try {
        return typeof compatibleRubric.content === 'string'
          ? JSON.parse(compatibleRubric.content)
          : compatibleRubric.content
      } catch (error) {
        console.error('Error parsing rubric content:', error)
        return null
      }
    }

    const latestRubric = rubrics[0]
    if (latestRubric) {
      try {
        return typeof latestRubric.content === 'string'
          ? JSON.parse(latestRubric.content)
          : latestRubric.content
      } catch (error) {
        console.error('Error parsing rubric content:', error)
        return null
      }
    }

    return null
  } catch (error) {
    console.error('Error finding rubric for assignment:', error)
    return null
  }
}

export const POST = route({ auth: 'STUDENT' }, async (req, { user, params }) => {
  const { id } = params
  const body = await req.json()
  const { content, attachments = [], startedAt, timeSpent } = body

  let student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    student = await prisma.student.create({ data: { userId: user.id } })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      students: true
    }
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (!assignment.students.some(s => s.id === student.id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const existingSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId: id,
      studentId: student.id
    }
  })

  if (existingSubmission) {
    return NextResponse.json({ error: 'Assignment already submitted' }, { status: 400 })
  }

  const submission = await prisma.submission.create({
    data: {
      content,
      attachments,
      assignmentId: id,
      studentId: student.id,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      timeSpent: timeSpent ? parseInt(timeSpent) : undefined
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      assignment: true
    }
  })

  let updatedSubmission = submission
  if (assignment.aiGradeable) {
    try {
      const rubricData = await findBestRubricForAssignment(submission.assignment)
      const grading = await OpenAIService.gradeSubmission({
        assignmentTitle: submission.assignment.title,
        assignmentInstructions: submission.assignment.description || '',
        submissionContent: content,
        rubric: rubricData ? JSON.stringify(rubricData) : undefined,
        answerKey: assignment.answerKey || undefined,
        maxPoints: 100
      })

      updatedSubmission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          grade: grading.grade,
          feedback: grading.feedback,
          status: 'GRADED',
          gradedAt: new Date(),
          isAiGraded: true,
          aiGradingMetadata: grading,
          aiConfidence: grading.confidence,
          questionScores: grading.questionScores,
          needsRevision: grading.needsRevision,
          revisionNotes: grading.revisionNotes
        },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          assignment: true
        }
      })
    } catch (e) {
      console.error('AI grading failed:', e)
    }
  }

  try {
    await NotificationGenerator.assignmentCompleted(student.id, assignment.title)
  } catch (_) { /* non-blocking */ }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        message: { contains: assignment.title }
      },
      data: { isRead: true, updatedAt: new Date() }
    })
  } catch (_) { /* non-blocking */ }

  const formattedSubmission = {
    id: updatedSubmission.id,
    content: updatedSubmission.content,
    attachments: updatedSubmission.attachments,
    grade: updatedSubmission.grade,
    feedback: updatedSubmission.feedback,
    submittedAt: updatedSubmission.submittedAt,
    gradedAt: updatedSubmission.gradedAt,
    startedAt: updatedSubmission.startedAt,
    timeSpent: updatedSubmission.timeSpent,
    isAiGraded: updatedSubmission.isAiGraded,
    aiGradingMetadata: updatedSubmission.aiGradingMetadata,
    aiConfidence: updatedSubmission.aiConfidence,
    questionScores: updatedSubmission.questionScores,
    needsRevision: updatedSubmission.needsRevision,
    revisionNotes: updatedSubmission.revisionNotes,
    student: {
      id: updatedSubmission.student.id,
      name: `${updatedSubmission.student.user.firstName} ${updatedSubmission.student.user.lastName}`
    },
    assignment: {
      id: updatedSubmission.assignment.id,
      title: updatedSubmission.assignment.title,
      dueDate: updatedSubmission.assignment.dueDate
    }
  }

  return NextResponse.json({
    submission: formattedSubmission,
    message: 'Assignment submitted successfully'
  })
})
