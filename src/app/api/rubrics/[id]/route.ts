import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIContentType } from '@prisma/client';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const rubric = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.RUBRIC
    }
  });

  if (!rubric) {
    return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
  }

  const rubricData = typeof rubric.content === 'string'
    ? JSON.parse(rubric.content)
    : rubric.content;

  return NextResponse.json({
    success: true,
    rubric: {
      ...rubric,
      rubricData
    }
  });
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
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

  const existingRubric = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.RUBRIC
    }
  });

  if (!existingRubric) {
    return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
  }

  const rubricContent = {
    title: title || existingRubric.title,
    description: description || '',
    subject: subject || existingRubric.subject,
    grade: grade || existingRubric.grade,
    totalPoints: totalPoints || 100,
    performanceLevels: performanceLevels || [],
    criteria: criteria || [],
    metadata: { ...(existingRubric.metadata as Record<string, any> || {}), ...metadata }
  };

  const updatedRubric = await prisma.aIGeneratedContent.update({
    where: { id: params.id },
    data: {
      title: title || existingRubric.title,
      content: JSON.stringify(rubricContent),
      subject: subject || existingRubric.subject,
      grade: grade || existingRubric.grade,
      topic: title || existingRubric.topic,
      metadata: {
        totalPoints,
        performanceLevels,
        criteria,
        ...metadata
      }
    }
  });

  return NextResponse.json({
    success: true,
    rubric: updatedRubric
  });
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const existingRubric = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.RUBRIC
    }
  });

  if (!existingRubric) {
    return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
  }

  await prisma.aIGeneratedContent.delete({
    where: { id: params.id }
  });

  return NextResponse.json({
    success: true,
    message: 'Rubric deleted successfully'
  });
})
