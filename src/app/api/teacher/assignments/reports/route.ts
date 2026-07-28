import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    let where: any = {
      teacherId: teacher.id
    };

    if (assignmentId) {
      where.id = assignmentId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Get assignments with detailed statistics
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        students: {
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
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate detailed statistics
    const reports = assignments.map(assignment => {
      const totalStudents = assignment._count.students;
      const totalSubmissions = assignment._count.submissions;
      const gradedSubmissions = assignment.submissions.filter(s => s.grade !== null).length;
      const pendingSubmissions = totalSubmissions - gradedSubmissions;
      const notSubmitted = totalStudents - totalSubmissions;
      
      const averageGrade = gradedSubmissions > 0 
        ? assignment.submissions
            .filter(s => s.grade !== null)
            .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions
        : 0;

      const gradeDistribution = {
        excellent: assignment.submissions.filter(s => (s.grade || 0) >= 90).length,
        good: assignment.submissions.filter(s => (s.grade || 0) >= 80 && (s.grade || 0) < 90).length,
        satisfactory: assignment.submissions.filter(s => (s.grade || 0) >= 70 && (s.grade || 0) < 80).length,
        needsImprovement: assignment.submissions.filter(s => (s.grade || 0) >= 60 && (s.grade || 0) < 70).length,
        failing: assignment.submissions.filter(s => (s.grade || 0) < 60).length
      };

      // Student performance details
      const studentPerformance = assignment.students.map(student => {
        const submission = assignment.submissions.find(s => s.studentId === student.id);
        return {
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          studentEmail: student.user.email,
          hasSubmitted: !!submission,
          submissionDate: submission?.submittedAt || null,
          grade: submission?.grade || null,
          feedback: submission?.feedback || null,
          gradedAt: submission?.gradedAt || null,
          isOverdue: submission ? false : new Date(assignment.dueDate) < new Date()
        };
      });

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        assignmentDescription: assignment.description,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        stats: {
          totalStudents,
          totalSubmissions,
          gradedSubmissions,
          pendingSubmissions,
          notSubmitted,
          submissionRate: totalStudents > 0 ? (totalSubmissions / totalStudents) * 100 : 0,
          averageGrade: Math.round(averageGrade * 100) / 100,
          gradeDistribution
        },
        studentPerformance,
        submissions: assignment.submissions.map(submission => ({
          submissionId: submission.id,
          studentId: submission.student.id,
          studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
          content: submission.content,
          attachments: submission.attachments,
          grade: submission.grade,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt
        }))
      };
    });

    // Overall statistics
    const overallStats = {
      totalAssignments: assignments.length,
      totalStudents: assignments.reduce((sum, a) => sum + a._count.students, 0),
      totalSubmissions: assignments.reduce((sum, a) => sum + a._count.submissions, 0),
      averageSubmissionRate: assignments.length > 0 
        ? assignments.reduce((sum, a) => sum + (a._count.submissions / a._count.students), 0) / assignments.length * 100
        : 0,
      averageGrade: assignments.length > 0
        ? assignments.reduce((sum, a) => {
            const gradedSubs = a.submissions.filter(s => s.grade !== null);
            const avgGrade = gradedSubs.length > 0 
              ? gradedSubs.reduce((s, sub) => s + (sub.grade || 0), 0) / gradedSubs.length
              : 0;
            return sum + avgGrade;
          }, 0) / assignments.length
        : 0
    };

    return NextResponse.json({
      reports,
      overallStats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating assignment reports:', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
});
