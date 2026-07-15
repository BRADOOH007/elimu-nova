import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await withRetry(() => prisma.teacher.findUnique({
      where: { userId: session.user.id }
    }));

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
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

  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Lesson plans POST endpoint called');
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, subject, grade, content } = body;

    console.log('Lesson plan data received:', { title, subject, grade, content: typeof content });

    // Validate required fields
    if (!title || !subject || !grade || !content) {
      console.log('Missing required fields:', { title, subject, grade, content });
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

  } catch (error) {
    console.error('Error creating lesson plan:', error);
    return NextResponse.json({ 
      error: 'Failed to create lesson plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}