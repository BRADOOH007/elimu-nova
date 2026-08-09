import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const { subject, topic, prompt, difficulty, duration, description } = await req.json()

  const finalSubject = (subject || '').trim() || 'General Studies'
  const finalTopic = (topic || prompt || '').trim() || 'General Knowledge'
  const finalDifficulty = (difficulty || '').trim() || 'medium'
  const finalDuration = typeof duration === 'number' && duration > 0 ? duration : 7

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

  // Independent / teacherless students fall back to any available teacher so the
  // assignment (which requires a teacher FK) can still be created.
  let assignmentTeacherId = student.teacherId
  if (!assignmentTeacherId) {
    const fallbackTeacher = await prisma.teacher.findFirst({ select: { id: true } })
    assignmentTeacherId = fallbackTeacher?.id ?? ''
  }

  // Generate AI assignment content
  let aiAssignment: any
  try {
    aiAssignment = await OpenAIService.generateAIAssignment({
      subject: finalSubject,
      topic: finalTopic,
      difficulty: finalDifficulty,
      duration: finalDuration,
      description,
      studentLevel: student.analytics?.averageGrade ? 
        (student.analytics.averageGrade >= 85 ? 'advanced' : 
         student.analytics.averageGrade >= 70 ? 'intermediate' : 'beginner') : 'intermediate',
      learningStyle: 'visual', // Could be determined from analytics
      studentName: `${student.user.firstName} ${student.user.lastName}`
    })
  } catch (e: any) {
    const raw = e?.message || ''
    const friendly = /All AI providers|rate\s*limit|high traffic|busy/i.test(raw)
      ? 'The AI service is busy right now. Please try again in a few minutes.'
      : raw || 'AI generation failed. Please try again.'
    return NextResponse.json({ error: friendly }, { status: 503 })
  }

  const title = aiAssignment?.title || `${finalTopic} - ${finalSubject} Assignment`
  const assignmentDescription = aiAssignment?.description || `Complete this assignment on ${finalTopic} in ${finalSubject}`
  const instructions = aiAssignment?.instructions || `1. Read the topic carefully\n2. Complete all required tasks\n3. Submit your work on time`

  // Create assignment in database
  let assignment: any
  try {
    assignment = await prisma.assignment.create({
    data: {
      title,
      description: assignmentDescription,
      instructions,
      content: aiAssignment?.content || '',
      dueDate: new Date(Date.now() + finalDuration * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      teacherId: assignmentTeacherId,
      aiGradeable: true,
      subject: finalSubject,
      grade: 'Grade 8',
      students: {
        connect: [{ id: student.id }]
      },
      lessonPlan: {
        create: {
          title: `${finalTopic} - AI Generated`,
          subject: finalSubject,
          grade: 'Grade 8',
          teacherId: assignmentTeacherId,
          content: JSON.stringify({ generatedContent: aiAssignment?.content || '' })
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
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not save the generated assignment. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: (assignment as any).instructions,
      dueDate: assignment.dueDate,
      subject: finalSubject,
      topic: finalTopic,
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
