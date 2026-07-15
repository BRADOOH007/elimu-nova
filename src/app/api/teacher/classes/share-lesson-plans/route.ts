import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, lessonPlanIds } = body;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Check if class exists and belongs to teacher
    const classData = await prisma.class.findUnique({
      where: { 
        id: classId,
        teacherId: teacher.id
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 });
    }

    // Verify lesson plans belong to teacher
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        id: { in: lessonPlanIds },
        teacherId: teacher.id
      }
    });

    if (lessonPlans.length !== lessonPlanIds.length) {
      return NextResponse.json({ error: 'Some lesson plans not found or access denied' }, { status: 400 });
    }

    // Create shared lesson plan records for the class
    const sharedLessonPlans = await Promise.all(
      lessonPlanIds.map((lessonPlanId: string) =>
        (prisma as any).sharedLessonPlan.upsert({
          where: {
            classId_lessonPlanId: {
              classId: classId,
              lessonPlanId: lessonPlanId
            }
          },
          update: {
            isActive: true
          },
          create: {
            classId: classId,
            lessonPlanId: lessonPlanId,
            teacherId: teacher.id,
            isActive: true
          }
        })
      )
    );

    return NextResponse.json({
      message: 'Lesson plans shared successfully',
      sharedCount: sharedLessonPlans.length
    });

  } catch (error) {
    console.error('Error sharing lesson plans:', error);
    return NextResponse.json({ error: 'Failed to share lesson plans' }, { status: 500 });
  }
}
