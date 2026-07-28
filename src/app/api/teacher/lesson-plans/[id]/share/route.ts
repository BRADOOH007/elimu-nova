import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get lesson plan and verify ownership
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { 
        id: id,
        teacherId: teacher.id
      }
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan not found or access denied' }, { status: 404 });
    }

    // Toggle sharing status
    const updatedLessonPlan = await prisma.lessonPlan.update({
      where: { id: id },
      data: { isShared: !lessonPlan.isShared },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        isShared: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      lessonPlan: updatedLessonPlan,
      message: updatedLessonPlan.isShared 
        ? 'Lesson plan shared with students successfully' 
        : 'Lesson plan unshared from students'
    });

  } catch (error) {
    console.error('Error sharing lesson plan:', error);
    return NextResponse.json({ 
      error: 'Failed to share lesson plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});
