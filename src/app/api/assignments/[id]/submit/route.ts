import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/lib/openai-service';

// Helper function to find the best rubric for an assignment
async function findBestRubricForAssignment(assignment: any) {
  try {
    // Get the teacher's rubrics
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

    // Try to parse assignment content to get subject/grade info
    let assignmentSubject = ''
    let assignmentGrade = ''
    
    try {
      const assignmentContent = JSON.parse(assignment.content)
      assignmentSubject = assignmentContent.subject || ''
      assignmentGrade = assignmentContent.grade || ''
    } catch (error) {
      // Assignment content might not be JSON
    }

    // Find the most compatible rubric
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

    // If no compatible rubric found, use the most recent one
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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, attachments = [] } = body;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if assignment exists and student has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        students: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!assignment.students.some(s => s.id === student.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: params.id,
        studentId: student.id
      }
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'Assignment already submitted' }, { status: 400 });
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        content,
        attachments,
        assignmentId: params.id,
        studentId: student.id
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
        assignment: {
          select: {
            title: true,
            dueDate: true,
            description: true,
            content: true
          }
        }
      }
    });

    // Auto-grade using AI
    let updatedSubmission = submission
    try {
      const rubricData = await findBestRubricForAssignment(submission.assignment)
      const grading = await OpenAIService.gradeSubmission({
        assignmentTitle: submission.assignment.title,
        assignmentInstructions: (submission as any).assignment.description || '',
        submissionContent: content,
        rubric: rubricData ? JSON.stringify(rubricData) : undefined,
        maxPoints: 100
      })

      updatedSubmission = await prisma.submission.update({
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
    } catch (e) {
      console.error('AI grading failed:', e)
    }

    // Format response
    const formattedSubmission = {
      id: updatedSubmission.id,
      content: updatedSubmission.content,
      attachments: updatedSubmission.attachments,
      grade: updatedSubmission.grade,
      feedback: updatedSubmission.feedback,
      submittedAt: updatedSubmission.submittedAt,
      gradedAt: updatedSubmission.gradedAt,
      student: {
        id: updatedSubmission.student.id,
        name: `${updatedSubmission.student.user.firstName} ${updatedSubmission.student.user.lastName}`
      },
      assignment: {
        id: updatedSubmission.assignment.id,
        title: updatedSubmission.assignment.title,
        dueDate: updatedSubmission.assignment.dueDate
      }
    };

    return NextResponse.json({
      submission: formattedSubmission,
      message: 'Assignment submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
