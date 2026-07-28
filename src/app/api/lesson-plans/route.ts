import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {

    // Get or create teacher profile
    let teacher = await withRetry(() => prisma.teacher.findUnique({
      where: { userId: user.id }
    }));

    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: user.id } });
    }

    // Get lesson plans for this teacher
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: teacher.id
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      lessonPlans,
      total: lessonPlans.length
    });
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {

    // Get or create teacher profile
    let teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: user.id } });
    }

    const body = await req.json();
    const { title, subject, grade, content } = body;

    // Validate required fields
    if (!title || !subject || !grade || !content) {

      return NextResponse.json({ 
        error: 'Missing required fields: title, subject, grade, and content are required' 
      }, { status: 400 });
    }

    // Convert content object to JSON string if it's an object
    const contentString = typeof content === 'object' ? JSON.stringify(content) : content;

    // Create lesson plan
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        title,
        subject,
        grade,
        content: contentString,
        teacherId: teacher.id
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      lessonPlan,
      message: 'Lesson plan created successfully'
    });
})
