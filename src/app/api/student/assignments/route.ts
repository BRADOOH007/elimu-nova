import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile with class information
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    // Build where clause - show assignments that are either:
    // 1. Directly assigned to the student, OR
    // 2. From shared lesson plans by the student's teacher
    let where: any = {
      OR: [
        {
          students: {
            some: {
              id: student.id
            }
          }
        },
        {
          AND: [
            {
              teacherId: student.teacherId
            },
            {
              lessonPlan: {
                isShared: true
              }
            }
          ]
        }
      ]
    };

    // Add status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Filter out completed assignments if not requested
    if (!includeCompleted) {
      where.status = {
        in: ['PENDING', 'SUBMITTED']
      };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        lessonPlan: {
          select: {
            title: true,
            subject: true,
            grade: true
          }
        },
        submissions: {
          where: {
            studentId: student.id
          },
          select: {
            id: true,
            content: true,
            attachments: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            gradedAt: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Format assignments for response
    const formattedAssignments = assignments.map(assignment => {
      const submission = assignment.submissions[0]; // Student can only have one submission per assignment
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isOverdue = dueDate < now && !submission;
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        content: assignment.content,
        dueDate: assignment.dueDate,
        status: isOverdue ? 'OVERDUE' : assignment.status,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        subject: assignment.lessonPlan?.subject || '',
        teacher: {
          id: assignment.teacher.id,
          firstName: assignment.teacher.user.firstName,
          lastName: assignment.teacher.user.lastName,
          name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
          email: assignment.teacher.user.email
        },
        lessonPlan: assignment.lessonPlan ? {
          id: assignment.lessonPlan.id,
          title: assignment.lessonPlan.title,
          subject: assignment.lessonPlan.subject,
          grade: assignment.lessonPlan.grade
        } : null,
        submission: submission ? {
          id: submission.id,
          content: submission.content,
          attachments: submission.attachments,
          grade: submission.grade,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt
        } : null,
        isOverdue,
        daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    return NextResponse.json({
      assignments: formattedAssignments,
      total: formattedAssignments.length
    });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
