import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { submissionId, rubricId } = await req.json()

  if (!submissionId || !rubricId) {
    return NextResponse.json({
      error: 'Missing submissionId or rubricId'
    }, { status: 400 })
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          teacher: {
            include: { user: true }
          }
        }
      },
      student: {
        include: { user: true }
      }
    }
  })

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (submission.assignment.teacher.user.email !== user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const rubric = await prisma.aIGeneratedContent.findUnique({
    where: {
      id: rubricId,
      type: 'RUBRIC'
    }
  })

  if (!rubric) {
    return NextResponse.json({ error: 'Rubric not found' }, { status: 404 })
  }

  let rubricData
  try {
    rubricData = typeof rubric.content === 'string'
      ? JSON.parse(rubric.content)
      : rubric.content
  } catch (error) {
    console.error('Error parsing rubric content:', error)
    return NextResponse.json({
      error: 'Invalid rubric format'
    }, { status: 400 })
  }

  const grading = await OpenAIService.gradeSubmission({
    assignmentTitle: submission.assignment.title,
    assignmentInstructions: submission.assignment.description || '',
    submissionContent: submission.content,
    rubric: JSON.stringify(rubricData),
    maxPoints: 100
  })

  const updatedSubmission = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      grade: grading.grade,
      feedback: grading.feedback,
      gradedAt: new Date()
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } }
        }
      },
      assignment: { select: { title: true, dueDate: true } }
    }
  })

  return NextResponse.json({
    success: true,
    submission: {
      id: updatedSubmission.id,
      grade: updatedSubmission.grade,
      feedback: updatedSubmission.feedback,
      gradedAt: updatedSubmission.gradedAt,
      student: {
        name: `${updatedSubmission.student.user.firstName} ${updatedSubmission.student.user.lastName}`
      }
    },
    rubricUsed: {
      id: rubric.id,
      title: rubric.title,
      subject: rubric.subject,
      grade: rubric.grade
    }
  })
})
