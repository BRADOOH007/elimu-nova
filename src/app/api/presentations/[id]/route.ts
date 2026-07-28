import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const presentation = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: 'POWERPOINT'
    }
  })

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  const presentationData = JSON.parse(presentation.content)

  return NextResponse.json({
    success: true,
    presentation: {
      id: presentation.id,
      title: presentation.title,
      subject: presentation.subject,
      grade: presentation.grade,
      topic: presentation.topic,
      ...presentationData,
      isShared: presentation.isShared,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt
    }
  })
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { title, slides, subject, grade, topic, duration, difficulty } = await req.json()

  const existingPresentation = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: 'POWERPOINT'
    }
  })

  if (!existingPresentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  const updatedPresentationData = {
    title,
    subject,
    grade,
    topic,
    duration,
    difficulty,
    slides,
    slideCount: slides.length,
    metadata: {
      generatedAt: JSON.parse(existingPresentation.content).metadata?.generatedAt,
      updatedAt: new Date().toISOString(),
      slideCount: slides.length,
      duration,
      difficulty,
      hasImages: slides.some((slide: any) => slide.imagePrompt || slide.imageDescription)
    }
  }

  const updatedPresentation = await prisma.aIGeneratedContent.update({
    where: { id: params.id },
    data: {
      title,
      content: JSON.stringify(updatedPresentationData),
      subject,
      grade,
      topic,
      metadata: updatedPresentationData.metadata
    }
  })

  return NextResponse.json({
    success: true,
    presentation: {
      id: updatedPresentation.id,
      ...updatedPresentationData,
      isShared: updatedPresentation.isShared,
      createdAt: updatedPresentation.createdAt,
      updatedAt: updatedPresentation.updatedAt
    }
  })
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const presentation = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id,
      type: 'POWERPOINT'
    }
  })

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  await prisma.aIGeneratedContent.delete({
    where: { id: params.id }
  })

  return NextResponse.json({
    success: true,
    message: 'Presentation deleted successfully'
  })
})
