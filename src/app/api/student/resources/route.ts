import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

// GET - Fetch student resources
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const subject = searchParams.get('subject')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      teacher: {
        include: {
          user: true
        }
      }
    }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Build where clause
  const whereClause: any = {
    studentId: student.id,
    isPublic: true
  }

  if (type) {
    whereClause.type = type
  }

  if (subject) {
    whereClause.subject = subject
  }

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } }
    ]
  }

  // Fetch resources
  const resources = await prisma.resource.findMany({
    where: whereClause,
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      lessonPlan: {
        select: {
          id: true,
          title: true,
          subject: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })

  // Get total count for pagination
  const totalCount = await prisma.resource.count({
    where: whereClause
  })

  // Get unique subjects and types for filters
  const subjects = await prisma.resource.findMany({
    where: {
      studentId: student.id,
      isPublic: true
    },
    select: {
      subject: true
    },
    distinct: ['subject']
  })

  const types = await prisma.resource.findMany({
    where: {
      studentId: student.id,
      isPublic: true
    },
    select: {
      type: true
    },
    distinct: ['type']
  })

  return NextResponse.json({
    resources,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    },
    filters: {
      subjects: subjects.map(s => s.subject),
      types: types.map(t => t.type)
    }
  })
})

// POST - Create new resource (AI-generated)
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { 
    type, 
    subject, 
    topic, 
    grade, 
    description,
    lessonPlanId 
  } = body

  // Validate required fields
  if (!type || !subject || !topic || !grade) {
    return NextResponse.json({ 
      error: 'Missing required fields: type, subject, topic, grade' 
    }, { status: 400 })
  }

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      teacher: {
        include: {
          user: true,
          schemesOfWork: {
            include: {
              topics: true
            }
          },
          lessonPlans: true
        }
      }
    }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Generate AI resource content
  const aiResource = await (OpenAIService as any).generateAIResource({
    type,
    subject,
    topic,
    grade,
    description: description || '',
    studentName: `${student.user.firstName} ${student.user.lastName}`,
    studentLevel: (student as any).class?.name || 'Grade 8',
    availableMaterials: {
      schemesOfWork: student.teacher?.schemesOfWork?.map((scheme: any) => ({
        title: scheme.title,
        subject: scheme.subject,
        grade: scheme.grade,
        topics: scheme.topics.map((topic: any) => topic.title)
      })) || [],
      lessonPlans: student.teacher?.lessonPlans?.map((plan: any) => ({
        title: plan.title,
        subject: plan.subject,
        grade: plan.grade,
        content: plan.content
      })) || []
    }
  })

  // Create resource in database
  const resource = await prisma.resource.create({
    data: {
      title: aiResource.title,
      content: aiResource.content,
      type: type.toUpperCase(),
      subject,
      grade,
      tags: aiResource.tags || [],
      isPublic: true,
      isAIGenerated: true,
      studentId: student.id,
      teacherId: student.teacherId ?? '',
      lessonPlanId: lessonPlanId || null,
      metadata: {
        difficulty: aiResource.difficulty || 'medium',
        duration: aiResource.duration || '30 minutes',
        learningObjectives: aiResource.learningObjectives || [],
        prerequisites: aiResource.prerequisites || []
      }
    },
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      lessonPlan: {
        select: {
          id: true,
          title: true,
          subject: true
        }
      }
    }
  })

  return NextResponse.json({
    success: true,
    resource
  }, { status: 201 })
})
