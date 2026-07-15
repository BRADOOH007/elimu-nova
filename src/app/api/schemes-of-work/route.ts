import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { logSchemeOfWorkCreated } from '@/lib/activity-logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher information
    const teacher = await withRetry(() => prisma.teacher.findFirst({
      where: { userId: session.user.id }
    }));

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const grade = searchParams.get('grade') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      teacherId: teacher.id
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { grade: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (subject) {
      where.subject = subject;
    }

    if (grade) {
      where.grade = grade;
    }

    // Get schemes of work with pagination
    const [schemesOfWork, total] = await Promise.all([
      prisma.schemeOfWork.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { lessonPlans: true, sharedWith: true }
          }
        }
      }),
      prisma.schemeOfWork.count({ where })
    ]);

    // Parse content for each scheme of work
    const parsedSchemesOfWork = schemesOfWork.map(scheme => ({
      ...scheme,
      content: scheme.content ? JSON.parse(scheme.content) : null
    }));

    return NextResponse.json({
      schemesOfWork: parsedSchemesOfWork,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching schemes of work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schemes of work' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Ensure teacher has a schoolId
    if (!teacher.schoolId) {
      return NextResponse.json({ error: 'Teacher is not associated with a school' }, { status: 400 });
    }

    const body = await req.json();
    const { title, subject, grade, term, content, duration, objectives, topics } = body;

    console.log('Scheme of work data received:', { title, subject, grade, content: typeof content });

    // Validate required fields
    if (!title || !subject || !grade || !content) {
      console.log('Missing required fields:', { title, subject, grade, content });
      return NextResponse.json({ 
        error: 'Missing required fields: title, subject, grade, and content are required' 
      }, { status: 400 });
    }

    // Convert content object to JSON string if it's an object
    const contentString = typeof content === 'object' ? JSON.stringify(content) : content;

    // Create scheme of work
    console.log('Creating scheme of work with data:', {
      title,
      subject,
      grade,
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
      contentLength: contentString.length
    });

    const schemeOfWork = await prisma.schemeOfWork.create({
      data: {
        title,
        subject,
        grade,
        term: term ? term.trim() : '',
        content: contentString,
        duration: duration ? parseInt(duration.toString()) : null,
        objectives: objectives || null,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        isShared: false
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        createdAt: true
      }
    });

    console.log('Scheme of work created successfully:', { id: schemeOfWork.id, title: schemeOfWork.title });

    // Note: Topics creation removed for simplicity - can be added back later if needed

    // Log activity (only if schoolId exists)
    if (teacher.schoolId) {
      try {
        await logSchemeOfWorkCreated(teacher.schoolId, session.user.id, title, subject);
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Continue without logging if there's an error
      }
    }

    return NextResponse.json({
      success: true,
      schemeOfWork,
      message: 'Scheme of work created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating scheme of work:', error);
    return NextResponse.json(
      { error: `Failed to create scheme of work: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
