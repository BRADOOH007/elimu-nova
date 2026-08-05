import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const { subject, topic, difficulty, duration, description } = await req.json()

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      analytics: true,
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

  // Generate AI assignment content
  const aiAssignment = await (OpenAIService as any).generateAIAssignment({
    subject,
    topic,
    difficulty,
    duration,
    description,
    studentLevel: student.analytics?.averageGrade ? 
      (student.analytics.averageGrade >= 85 ? 'advanced' : 
       student.analytics.averageGrade >= 70 ? 'intermediate' : 'beginner') : 'intermediate',
    learningStyle: 'visual', // Could be determined from analytics
    studentName: `${student.user.firstName} ${student.user.lastName}`
  })

  // Create assignment in database
  const assignment = await prisma.assignment.create({
    data: {
      title: aiAssignment.title,
      description: aiAssignment.description,
      instructions: aiAssignment.instructions,
      dueDate: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      teacherId: student.teacherId ?? '',
      aiGradeable: true,
      students: {
        connect: [{ id: student.id }]
      },
      lessonPlan: {
        create: {
          title: `${topic} - AI Generated`,
          subject,
          grade: 'Grade 8',
          teacherId: student.teacherId ?? '',
          content: JSON.stringify({ generatedContent: aiAssignment.content })
        }
      }
    } as any,
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      lessonPlan: true
    }
  })

  return NextResponse.json({ 
    success: true, 
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: (assignment as any).instructions,
      dueDate: assignment.dueDate,
      subject,
      topic,
      aiGenerated: true
    }
  })
})

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  // Get AI-generated assignments for the student
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      students: {
        some: {
          id: student.id
        }
      },
      lessonPlan: {
        title: {
          contains: 'AI Generated'
        }
      }
    },
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      lessonPlan: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ assignments })
})
