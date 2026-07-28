import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIContentType } from '@prisma/client';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  console.log('Rubrics API: GET request received');
  console.log('Rubrics API: User', { userId: user.id });

  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    console.log('Rubrics API: Teacher not found for user', user.id);
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  console.log('Rubrics API: Found teacher', teacher.id);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const subject = searchParams.get('subject');
  const grade = searchParams.get('grade');

  const where: any = {
    teacherId: teacher.id
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (subject && subject !== 'all') {
    where.subject = subject;
  }

  if (grade && grade !== 'all') {
    where.grade = grade;
  }

  console.log('Rubrics API: Query where clause', where);

  console.log('Rubrics API: Executing database query...');
  const rubrics = await prisma.aIGeneratedContent.findMany({
    where: {
      ...where,
      type: AIContentType.RUBRIC
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('Rubrics API: Found rubrics', rubrics.length);

  return NextResponse.json({
    success: true,
    rubrics
  });
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const {
    title,
    description,
    subject,
    grade,
    totalPoints,
    performanceLevels,
    criteria,
    metadata
  } = await req.json();

  if (!title || !subject || !grade || !criteria || criteria.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rubricContent = {
    title,
    description: description || '',
    subject,
    grade,
    totalPoints: totalPoints || 100,
    performanceLevels: performanceLevels || [],
    criteria: criteria || [],
    metadata: metadata || {}
  };

  const rubric = await prisma.aIGeneratedContent.create({
    data: {
      title,
      content: JSON.stringify(rubricContent),
      type: AIContentType.RUBRIC,
      subject,
      grade,
      topic: title,
      metadata: {
        totalPoints,
        performanceLevels,
        criteria,
        ...metadata
      },
      teacherId: teacher.id
    }
  });

  return NextResponse.json({
    success: true,
    rubric
  });
})
