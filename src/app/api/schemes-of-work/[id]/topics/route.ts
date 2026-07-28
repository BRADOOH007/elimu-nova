import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const schemeOfWork = await prisma.schemeOfWork.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id
    }
  });

  if (!schemeOfWork) {
    return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 });
  }

  const topics = await prisma.schemeTopic.findMany({
    where: { schemeOfWorkId: params.id },
    orderBy: [
      { weekNumber: 'asc' },
      { lessonNumber: 'asc' }
    ]
  });

  return NextResponse.json({ topics });
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, weekNumber, lessonNumber, objectives, activities, resources, assessment, duration } = body;

  if (!title || !weekNumber || !lessonNumber) {
    return NextResponse.json(
      { error: 'Title, week number, and lesson number are required' },
      { status: 400 }
    );
  }

  const schemeOfWork = await prisma.schemeOfWork.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id
    }
  });

  if (!schemeOfWork) {
    return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 });
  }

  const topic = await prisma.schemeTopic.create({
    data: {
      title,
      description: description || null,
      weekNumber: parseInt(weekNumber),
      lessonNumber: parseInt(lessonNumber),
      objectives: objectives || [],
      activities: activities || [],
      resources: resources || [],
      assessment: assessment || null,
      duration: duration || 40,
      schemeOfWorkId: params.id
    }
  });

  return NextResponse.json(topic, { status: 201 });
})
