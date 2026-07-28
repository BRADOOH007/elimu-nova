import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  // Get student profile with class information
  const student = await withRetry(() => prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      class: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }));

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const includeCompleted = searchParams.get('includeCompleted') === 'true';

  // Build where clause - show assignments that are either:
  // 1. Directly assigned to the student, OR
  // 2. From shared lesson plans by the student's teacher, OR
  // 3. Assigned to the student's class
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
      },
      ...(student.classId ? [{
        classId: student.classId
      }] : [])
    ]
  };

  // Add status / completion filter — wrap in AND so it doesn't overwrite the OR block
  if (status && status !== 'all') {
    where = { AND: [where, { status: status.toUpperCase() }] };
  } else if (!includeCompleted) {
    where = { AND: [where, { status: { in: ['PENDING', 'SUBMITTED'] } }] };
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
          id: true,
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

    let computedStatus = 'PENDING';
    if (submission) {
      computedStatus = (submission.grade !== null || submission.gradedAt) ? 'GRADED' : 'SUBMITTED';
    } else if (isOverdue) {
      computedStatus = 'OVERDUE';
    }

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      content: assignment.content,
      dueDate: assignment.dueDate,
      status: computedStatus,
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
      submissions: submission ? [{
        id: submission.id,
        content: submission.content,
        attachments: submission.attachments,
        grade: submission.grade,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt
      }] : [],
      isOverdue,
      daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  });

  return NextResponse.json({
    assignments: formattedAssignments,
    total: formattedAssignments.length
  });
})
