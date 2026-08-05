import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationGenerator } from '@/lib/notification-generator'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { buildStudentContext, extractAndStoreMemory } from '@/lib/student-memory'

// POST - Create AI tutor session
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { 
    sessionType, 
    subject, 
    topic, 
    question, 
    context 
  } = body

  // Validate required fields
  if (!sessionType || !question) {
    return NextResponse.json({ 
      error: 'Missing required fields: sessionType, question' 
    }, { status: 400 })
  }

  // Get or create student profile
  let student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      school: true,
      class: true,
      teacher: {
        include: {
          user: true
        }
      },
      analytics: true
    }
  })

  if (!student) {
    student = await prisma.student.create({
      data: { userId: user.id },
      include: {
        user: true,
        school: true,
        class: true,
        teacher: { include: { user: true } },
        analytics: true
      }
    })
  }

  // Get recent assignments and study sessions for context
  const recentAssignments = await prisma.assignment.findMany({
    where: {
      students: {
        some: {
          id: student.id
        }
      }
    },
    include: {
      submissions: {
        where: {
          studentId: student.id
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  const recentStudySessions = await prisma.studySession.findMany({
    where: {
      studentId: student.id
    },
    orderBy: {
      startTime: 'desc'
    },
    take: 5
  })

  // Build context for AI
  const aiContext = {
    student: {
      name: `${student.user.firstName} ${student.user.lastName}`,
      grade: (student as any).class?.grade || 'Unknown',
      school: student.school?.name ?? '',
      teacher: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : 'Unknown'
    },
    analytics: student.analytics,
    recentAssignments: recentAssignments.map(assignment => ({
      title: assignment.title,
      subject: (assignment as any).lessonPlan?.subject || 'General',
      dueDate: assignment.dueDate,
      status: assignment.submissions.length > 0 ? 
        assignment.submissions[0].status : 'PENDING',
      grade: assignment.submissions.find(s => s.grade !== null)?.grade || null
    })),
    recentStudySessions: recentStudySessions.map(session => ({
      subject: session.subject,
      topic: session.topic,
      duration: session.duration,
      startTime: session.startTime
    })),
    providedContext: context
  }

  // Personalised profile: grade, frequent subjects, mastery, stored memory
  const personalContext = await buildStudentContext(student.id)

  // Generate AI response using OpenAI AI
  const aiResponse = await generateAIResponse({
    sessionType,
    subject,
    topic,
    question,
    context: aiContext,
    student: student,
    personalContext
  })

  // Create AI tutor session record
  const aiTutorSession = await prisma.aITutorSession.create({
    data: {
      studentId: student.id,
      sessionType,
      subject: subject || null,
      topic: topic || null,
      question,
      response: aiResponse,
      context: JSON.stringify(aiContext)
    }
  })

  // Generate notification for teacher
  await NotificationGenerator.aiTutorHelpRequested(student.id, question, subject || undefined)

  // Fire-and-forget: learn durable facts about this student from the exchange
  extractAndStoreMemory(student.id, {
    userMessage: question,
    aiResponse,
    subject: subject || undefined,
    topic: topic || undefined,
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    session: aiTutorSession,
    response: aiResponse
  }, { status: 201 })
})

// GET - Fetch AI tutor sessions
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const sessionType = searchParams.get('sessionType')

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Build where clause
  const whereClause: any = {
    studentId: student.id
  }

  if (sessionType) {
    whereClause.sessionType = sessionType
  }

  const aiTutorSessions = await prisma.aITutorSession.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })

  return NextResponse.json({
    sessions: aiTutorSessions
  })
})

// Helper function to generate AI response
async function generateAIResponse({
  sessionType,
  subject,
  topic,
  question,
  context,
  student,
  personalContext
}: {
  sessionType: string
  subject?: string
  topic?: string
  question: string
  context: any
  student: any
  personalContext?: string
}): Promise<string> {
  try {
    // Get teacher's materials for context
    const teacherMaterials = await prisma.teacher.findUnique({
      where: { id: student.teacherId },
      include: {
        schemesOfWork: {
          include: {
            topics: true
          }
        },
        lessonPlans: true,
        user: true
      }
    })

    // Get shared materials
    const sharedMaterials = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        sharedSchemes: {
          include: {
            schemeOfWork: {
              include: {
                topics: true
              }
            }
          }
        },
        sharedLessonPlans: {
          include: {
            lessonPlan: true
          }
        }
      }
    })

    // Get student's recent performance data
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        studentId: student.id
      },
      include: {
        assignment: {
          include: {
            lessonPlan: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    })

    // Get student's study patterns
    const studyPatterns = await prisma.studySession.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 20
    })

    // Prepare comprehensive context for AI
    const aiContext = {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        grade: student.class?.name || 'Grade 8',
        teacher: teacherMaterials?.user ? `${teacherMaterials.user.firstName} ${teacherMaterials.user.lastName}` : 'ElimuNova AI Teacher',
        subjects: Array.from(new Set([
          ...(teacherMaterials?.schemesOfWork.map(s => s.subject) || []),
          ...(teacherMaterials?.lessonPlans.map(l => l.subject) || []),
          ...(sharedMaterials?.sharedSchemes.map(s => s.schemeOfWork.subject) || []),
          ...(sharedMaterials?.sharedLessonPlans.map(l => l.lessonPlan.subject) || [])
        ]))
      },
      availableMaterials: {
        schemesOfWork: teacherMaterials?.schemesOfWork.map(scheme => ({
          title: scheme.title,
          subject: scheme.subject,
          grade: scheme.grade,
          topics: scheme.topics.map(topic => topic.title)
        })) || [],
        lessonPlans: teacherMaterials?.lessonPlans.map(plan => ({
          title: plan.title,
          subject: plan.subject,
          grade: plan.grade,
          content: plan.content
        })) || [],
        sharedSchemes: sharedMaterials?.sharedSchemes.map(shared => ({
          title: shared.schemeOfWork.title,
          subject: shared.schemeOfWork.subject,
          grade: shared.schemeOfWork.grade,
          topics: shared.schemeOfWork.topics.map(topic => topic.title)
        })) || [],
        sharedLessonPlans: sharedMaterials?.sharedLessonPlans.map(shared => ({
          title: shared.lessonPlan.title,
          subject: shared.lessonPlan.subject,
          grade: shared.lessonPlan.grade,
          content: shared.lessonPlan.content
        })) || []
      },
      studentPerformance: {
        recentSubmissions: recentSubmissions.map(submission => ({
          assignmentTitle: submission.assignment.title,
          subject: submission.assignment.lessonPlan?.subject || 'General',
          grade: submission.grade,
          status: submission.status,
          submittedAt: submission.submittedAt
        })),
        studyPatterns: studyPatterns.map(session => ({
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          startTime: session.startTime
        })),
        analytics: student.analytics
      },
      currentContext: context,
      sessionType,
      subject,
      topic,
      question
    }

    // Use waterfall AI to generate response
    const aiResponse = await OpenAIService.generateText(
      [
        {
          role: 'system',
          content: `You are an AI tutor for ElimuNova helping a Kenyan student named ${aiContext.student.name} in ${aiContext.student.grade}.
Their teacher is ${aiContext.student.teacher}. Available subjects: ${aiContext.student.subjects?.join(', ') || 'General'}.
Be encouraging, clear, and use Kenyan examples. Give step-by-step guidance. Session type: ${sessionType}.${personalContext ? `\n\nABOUT THIS STUDENT (use this to personalise your teaching):\n${personalContext}` : ''}`,
        },
        {
          role: 'user',
          content: `Subject: ${subject || 'General'}\nTopic: ${topic || 'General'}\nQuestion: ${question}`,
        },
      ],
      { maxTokens: 800, temperature: 0.7 }
    )
    return aiResponse

  } catch (error) {
    console.error('Error generating AI response:', error)

    // Fallback response
    const responses = {
      lesson: `Based on your question about ${topic || subject || 'the topic'}, let me help you understand this concept. ${question} is a great question that shows you're thinking critically about the material.`,
      assignment_help: `I can help you with this assignment. Looking at your recent work in ${subject || 'this subject'}, I can see you've been making good progress. Let me break down the key concepts you need to focus on.`,
      progress_review: `Great job on your recent study sessions! I can see you've been working hard on ${subject || 'your studies'}. Your progress shows improvement, and here are some areas where you can continue to excel.`,
      general_help: `I'm here to help you with your studies. Based on your question and your recent activity, I can provide guidance and support to help you succeed.`
    }

    const baseResponse = responses[sessionType as keyof typeof responses] || responses.general_help

    return `${baseResponse}\n\nYour question: "${question}"\n\nI'll provide you with a detailed explanation and some practice exercises to help you master this concept. Remember, learning is a process, and it's okay to ask questions and seek help when you need it.`
  }
}
