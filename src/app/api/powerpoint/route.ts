import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const subject = searchParams.get('subject')
  const grade = searchParams.get('grade')

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: { user: true }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const whereClause: any = {
    teacherId: teacher.id,
    type: 'POWERPOINT'
  }

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { grade: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (subject) {
    whereClause.subject = subject
  }

  if (grade) {
    whereClause.grade = grade
  }

  const powerpoints = await prisma.aIGeneratedContent.findMany({
    where: whereClause,
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          sharedWithStudents: true,
          sharedWithClasses: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const transformedPowerpoints = powerpoints.map((ppt: any) => ({
    id: ppt.id,
    title: ppt.title,
    subject: ppt.subject,
    grade: ppt.grade,
    topic: ppt.topic,
    content: typeof ppt.content === 'string' ? JSON.parse(ppt.content) : ppt.content,
    metadata: ppt.metadata,
    isShared: ppt.isShared,
    createdAt: ppt.createdAt.toISOString(),
    updatedAt: ppt.updatedAt.toISOString(),
    teacher: {
      id: ppt.teacher.id,
      user: {
        firstName: ppt.teacher.user.firstName,
        lastName: ppt.teacher.user.lastName
      }
    }
  }))

  return NextResponse.json({
    powerpoints: transformedPowerpoints,
    total: transformedPowerpoints.length
  })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
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
  } = await req.json()

  if (!title || !subject || !grade || !topic) {
    return NextResponse.json(
      { error: 'Title, subject, grade, and topic are required' },
      { status: 400 }
    )
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const contentData = {
    slides: slides || [],
    duration: duration || 45,
    slideCount: slideCount || slides?.length || 0,
    metadata: {
      objectives: metadata?.objectives || [],
      difficulty: metadata?.difficulty || 'medium',
      format: metadata?.format || 'standard',
      generatedAt: metadata?.generatedAt || new Date().toISOString(),
      ...metadata
    }
  }

  const powerpoint = await prisma.aIGeneratedContent.create({
    data: {
      title,
      content: JSON.stringify(contentData),
      type: 'POWERPOINT',
      subject,
      grade,
      topic,
      metadata: {
        description,
        duration,
        slideCount: contentData.slideCount,
        createdBy: 'ai-content-hub',
        ...metadata
      },
      teacherId: teacher.id,
      isShared: false
    },
    include: {
      teacher: {
        include: {
          user: true
        }
      }
    }
  })

  const response = {
    id: powerpoint.id,
    title: powerpoint.title,
    subject: powerpoint.subject,
    grade: powerpoint.grade,
    topic: powerpoint.topic,
    content: contentData,
    metadata: powerpoint.metadata,
    isShared: powerpoint.isShared,
    createdAt: powerpoint.createdAt.toISOString(),
    updatedAt: powerpoint.updatedAt.toISOString(),
    teacher: {
      id: powerpoint.teacher.id,
      user: {
        firstName: powerpoint.teacher.user.firstName,
        lastName: powerpoint.teacher.user.lastName
      }
    }
  }

  return NextResponse.json({
    powerpoint: response,
    message: 'PowerPoint saved successfully'
  })
})
