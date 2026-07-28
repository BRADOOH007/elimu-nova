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

  const topic = await prisma.schemeTopic.findFirst({
    where: {
      id: params.topicId,
      schemeOfWorkId: params.id,
      schemeOfWork: {
        teacherId: teacher.id
      }
    }
  });

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  return NextResponse.json(topic);
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, weekNumber, lessonNumber, objectives, activities, resources, assessment, duration } = body;

  const existingTopic = await prisma.schemeTopic.findFirst({
    where: {
      id: params.topicId,
      schemeOfWorkId: params.id,
      schemeOfWork: {
        teacherId: teacher.id
      }
    }
  });

  if (!existingTopic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  const updatedTopic = await prisma.schemeTopic.update({
    where: { id: params.topicId },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(weekNumber && { weekNumber: parseInt(weekNumber) }),
      ...(lessonNumber && { lessonNumber: parseInt(lessonNumber) }),
      ...(objectives && { objectives }),
      ...(activities && { activities }),
      ...(resources && { resources }),
      ...(assessment !== undefined && { assessment }),
      ...(duration && { duration: parseInt(duration) })
    }
  });

  return NextResponse.json(updatedTopic);
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const existingTopic = await prisma.schemeTopic.findFirst({
    where: {
      id: params.topicId,
      schemeOfWorkId: params.id,
      schemeOfWork: {
        teacherId: teacher.id
      }
    }
  });

  if (!existingTopic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  await prisma.schemeTopic.delete({
    where: { id: params.topicId }
  });

  return NextResponse.json({ message: 'Topic deleted successfully' });
})
