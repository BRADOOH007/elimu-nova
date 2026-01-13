import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, rubricId } = await request.json()

    if (!submissionId || !rubricId) {
      return NextResponse.json({ 
        error: 'Missing submissionId or rubricId' 
      }, { status: 400 })
    }

    // Get the submission with assignment details
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

    // Verify teacher owns the assignment
    if (submission.assignment.teacher.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the rubric
    const rubric = await prisma.aIGeneratedContent.findUnique({
      where: { 
        id: rubricId,
        type: 'RUBRIC'
      }
    })

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 })
    }

    // Parse rubric content
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

    // Grade using AI with the rubric
    const grading = await OpenAIService.gradeSubmission({
      assignmentTitle: submission.assignment.title,
      assignmentInstructions: submission.assignment.description || '',
      submissionContent: submission.content,
      rubric: JSON.stringify(rubricData),
      maxPoints: 100
    })

    // Update the submission with the new grade and feedback
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

  } catch (error) {
    console.error('Error grading with rubric:', error)
    return NextResponse.json({ 
      error: 'Failed to grade submission with rubric' 
    }, { status: 500 })
  }
}