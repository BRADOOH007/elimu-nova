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

  const powerpoint = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.POWERPOINT
    },
    include: {
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  if (!powerpoint) {
    return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
  }

  let parsedContent;
  try {
    parsedContent = JSON.parse(powerpoint.content);
  } catch (error) {
    console.error('Error parsing PowerPoint content:', error);
    parsedContent = {
      title: powerpoint.title,
      slides: [],
      metadata: {}
    };
  }

  return NextResponse.json({
    success: true,
    powerpoint: {
      id: powerpoint.id,
      title: powerpoint.title,
      subject: powerpoint.subject,
      grade: powerpoint.grade,
      topic: powerpoint.topic,
      content: parsedContent,
      metadata: powerpoint.metadata,
      isShared: powerpoint.isShared,
      createdAt: powerpoint.createdAt,
      updatedAt: powerpoint.updatedAt,
      teacher: powerpoint.teacher
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
    topic,
    duration,
    slideCount,
    slides,
    metadata
  } = await req.json();

  if (!title || !subject || !grade || !topic || !slides || slides.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existingPowerPoint = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.POWERPOINT
    }
  });

  if (!existingPowerPoint) {
    return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
  }

  const powerpointContent = {
    title,
    description: description || '',
    subject,
    grade,
    topic,
    duration: duration || 45,
    slideCount: slideCount || 10,
    slides: slides || [],
    metadata: metadata || {}
  };

  const updatedPowerPoint = await prisma.aIGeneratedContent.update({
    where: { id: params.id },
    data: {
      title,
      content: JSON.stringify(powerpointContent),
      subject,
      grade,
      topic,
      metadata: {
        duration,
        slideCount,
        slides,
        ...metadata,
        updatedAt: new Date().toISOString()
      }
    }
  });

  return NextResponse.json({
    success: true,
    powerpoint: {
      id: updatedPowerPoint.id,
      title: updatedPowerPoint.title,
      subject: updatedPowerPoint.subject,
      grade: updatedPowerPoint.grade,
      topic: updatedPowerPoint.topic,
      content: JSON.parse(updatedPowerPoint.content),
      metadata: updatedPowerPoint.metadata,
      createdAt: updatedPowerPoint.createdAt,
      updatedAt: updatedPowerPoint.updatedAt
    }
  });
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const existingPowerPoint = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: AIContentType.POWERPOINT
    }
  });

  if (!existingPowerPoint) {
    return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
  }

  await prisma.aIGeneratedContent.delete({
    where: { id: params.id }
  });

  return NextResponse.json({
    success: true,
    message: 'PowerPoint deleted successfully'
  });
})
