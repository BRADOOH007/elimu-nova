import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      class: {
        include: {
          teacher: {
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
      }
    }
  });

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }

  if (!student.class) {
    return NextResponse.json({ 
      lessonPlans: [],
      message: 'No class assigned. Please contact your teacher.'
    });
  }

  // Get lesson plans shared with this student's class
  const lessonPlans = await prisma.lessonPlan.findMany({
    where: {
      teacherId: student.class.teacherId,
      isShared: true
    },
    select: {
      id: true,
      title: true,
      subject: true,
      grade: true,
      content: true,
      createdAt: true,
      teacher: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Parse content for each lesson plan
  const processedLessonPlans = lessonPlans.map(plan => ({
    ...plan,
    content: typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content,
    teacherName: `${plan.teacher.user.firstName} ${plan.teacher.user.lastName}`
  }));

  return NextResponse.json({
    lessonPlans: processedLessonPlans,
    total: processedLessonPlans.length,
    studentClass: {
      name: student.class.name,
      subject: student.class.subject,
      grade: student.class.grade
    }
  });
})
