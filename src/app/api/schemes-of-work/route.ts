import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, withRetry } from '@/lib/prisma';
import { logSchemeOfWorkCreated } from '@/lib/activity-logger';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await withRetry(() => prisma.teacher.findFirst({
    where: { userId: user.id }
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
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  if (!teacher.schoolId) {
    return NextResponse.json({ error: 'Teacher is not associated with a school' }, { status: 400 });
  }

  const body = await req.json();
  const { title, subject, grade, term, content, duration, objectives, topics } = body;

  console.log('Scheme of work data received:', { title, subject, grade, content: typeof content });

  if (!title || !subject || !grade || !content) {
    console.log('Missing required fields:', { title, subject, grade, content });
    return NextResponse.json({
      error: 'Missing required fields: title, subject, grade, and content are required'
    }, { status: 400 });
  }

  const contentString = typeof content === 'object' ? JSON.stringify(content) : content;

  console.log('Creating scheme of work with data:', {
    title,
    subject,
    grade,
    teacherId: teacher.id,
    schoolId: teacher.schoolId,
    contentLength: contentString.length
  });

  // ── Dedup: don't save duplicate generations ──
  // If the same teacher already has a scheme of work with the exact same
  // title + subject + grade + content, return the existing one instead of
  // creating a duplicate.
  const contentHash = crypto.createHash('sha256').update(contentString).digest('hex').slice(0, 24);
  const existing = await prisma.schemeOfWork.findFirst({
    where: { teacherId: teacher.id, subject, grade, title },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true },
  });

  if (existing) {
    let existingHash = '';
    try {
      existingHash = crypto.createHash('sha256').update(
        typeof existing.content === 'string' ? existing.content : JSON.stringify(existing.content)
      ).digest('hex').slice(0, 24);
    } catch {
      existingHash = crypto.createHash('sha256').update(String(existing.content)).digest('hex').slice(0, 24);
    }

    if (existingHash === contentHash) {
      return NextResponse.json({
        success: true,
        existing: true,
        schemeOfWork: existing,
        message: 'Scheme of work already exists — no duplicate created'
      });
    }
  }

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

  if (teacher.schoolId) {
    try {
      await logSchemeOfWorkCreated(teacher.schoolId, user.id, title, subject);
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }
  }

  return NextResponse.json({
    success: true,
    schemeOfWork,
    message: 'Scheme of work created successfully'
  }, { status: 201 });
})
