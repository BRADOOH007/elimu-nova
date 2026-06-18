import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause based on user role
    let where: any = {};
    
    if (session.user.role === 'TEACHER') {
      // Get teacher profile
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });
      
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
      }
      
      where.teacherId = teacher.id;
    } else if (session.user.role === 'STUDENT') {
      // Get student profile
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id }
      });
      
      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      
      where.students = {
        some: {
          id: student.id
        }
      };
    }

    // Add status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
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
        class: true,
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        submissions: {
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
            }
          }
        },
        _count: {
          select: {
            submissions: true,
            students: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Format assignments for response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      content: assignment.content,
      dueDate: assignment.dueDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      // Timed exam fields
      isTimed: assignment.isTimed,
      timeLimit: assignment.timeLimit,
      startTime: assignment.startTime,
      // AI grading fields
      rubricId: assignment.rubricId,
      aiGradeable: assignment.aiGradeable,
      answerKey: assignment.answerKey,
      // Metadata
      classId: assignment.classId,
      subject: assignment.subject,
      grade: assignment.grade,
      teacher: {
        id: assignment.teacher.id,
        name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
        email: assignment.teacher.user.email
      },
      lessonPlan: assignment.lessonPlan ? {
        id: assignment.lessonPlan.id,
        title: assignment.lessonPlan.title,
        subject: assignment.lessonPlan.subject,
        grade: assignment.lessonPlan.grade
      } : null,
      class: assignment.class ? {
        id: assignment.class.id,
        name: assignment.class.name
      } : null,
      students: assignment.students.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`
      })),
      submissions: assignment.submissions.map(submission => ({
        id: submission.id,
        content: submission.content,
        attachments: submission.attachments,
        grade: submission.grade,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        // Timed exam
        startedAt: submission.startedAt,
        timeSpent: submission.timeSpent,
        // AI grading
        isAiGraded: submission.isAiGraded,
        aiGradingMetadata: submission.aiGradingMetadata,
        aiConfidence: submission.aiConfidence,
        questionScores: submission.questionScores,
        needsRevision: submission.needsRevision,
        revisionNotes: submission.revisionNotes,
        student: {
          id: submission.student.id,
          name: `${submission.student.user.firstName} ${submission.student.user.lastName}`
        }
      })),
      stats: {
        totalStudents: assignment._count.students,
        totalSubmissions: assignment._count.submissions,
        gradedSubmissions: assignment.submissions.filter(s => s.grade !== null).length,
        pendingSubmissions: assignment.submissions.filter(s => s.grade === null).length
      }
    }));

    return NextResponse.json({
      assignments: formattedAssignments,
      total: formattedAssignments.length
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      content, 
      dueDate, 
      lessonPlanId, 
      studentIds,
      isTimed,
      timeLimit,
      startTime,
      rubricId,
      aiGradeable,
      answerKey,
      classId,
      subject,
      grade
    } = body;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        content,
        dueDate: new Date(dueDate),
        teacherId: teacher.id,
        lessonPlanId: lessonPlanId || null,
        isTimed: isTimed || false,
        timeLimit: timeLimit || null,
        startTime: startTime ? new Date(startTime) : null,
        rubricId: rubricId || null,
        aiGradeable: aiGradeable || false,
        answerKey: answerKey || null,
        classId: classId || null,
        subject: subject || null,
        grade: grade || null,
        students: studentIds ? {
          connect: studentIds.map((id: string) => ({ id }))
        } : undefined
      },
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
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: true,
        _count: {
          select: {
            submissions: true,
            students: true
          }
        }
      }
    });

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      content: assignment.content,
      dueDate: assignment.dueDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      // Timed exam fields
      isTimed: assignment.isTimed,
      timeLimit: assignment.timeLimit,
      startTime: assignment.startTime,
      // AI grading fields
      rubricId: assignment.rubricId,
      aiGradeable: assignment.aiGradeable,
      answerKey: assignment.answerKey,
      // Metadata
      classId: assignment.classId,
      subject: assignment.subject,
      grade: assignment.grade,
      teacher: {
        id: assignment.teacher.id,
        name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
        email: assignment.teacher.user.email
      },
      lessonPlan: assignment.lessonPlan ? {
        id: assignment.lessonPlan.id,
        title: assignment.lessonPlan.title,
        subject: assignment.lessonPlan.subject,
        grade: assignment.lessonPlan.grade
      } : null,
      class: assignment.class ? {
        id: assignment.class.id,
        name: assignment.class.name
      } : null,
      students: assignment.students.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`
      })),
      stats: {
        totalStudents: assignment._count.students,
        totalSubmissions: assignment._count.submissions,
        gradedSubmissions: 0,
        pendingSubmissions: 0
      }
    };

    return NextResponse.json({
      assignment: formattedAssignment,
      message: 'Assignment created successfully'
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
