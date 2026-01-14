import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    console.log('🎓 Starting AI lesson:', params.lessonId)
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.log('✅ Student found:', student.id)

    let lessonPlan = null
    let learningSession = null

    // Handle 'current' lesson ID - get the most recent lesson plan
    if (params.lessonId === 'current') {
      if (!student.teacherId) {
        return NextResponse.json({ 
          error: 'No teacher assigned',
          message: 'You need a teacher to access lesson plans. Try the AI Tutor for independent learning!'
        }, { status: 404 })
      }

      lessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          teacherId: student.teacherId
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          schemeOfWork: true
        }
      })

      if (!lessonPlan) {
        return NextResponse.json({ 
          error: 'No lesson plan available',
          message: 'Your teacher hasn\'t created any lesson plans yet. Try the AI Tutor for personalized learning!'
        }, { status: 404 })
      }
    } else {
      // Get specific lesson plan by ID
      lessonPlan = await prisma.lessonPlan.findUnique({
        where: { id: params.lessonId },
        include: {
          schemeOfWork: true
        }
      })

      if (!lessonPlan) {
        return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
      }
    }

    console.log('📚 Lesson plan:', lessonPlan.title)

    // Check if there's an existing active learning session for this lesson
    // We'll use AITutorSession with sessionType='lesson' to track progress
    learningSession = await prisma.aITutorSession.findFirst({
      where: {
        studentId: student.id,
        sessionType: 'lesson',
        topic: lessonPlan.title,
        subject: lessonPlan.subject
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let progress = 0
    let sessionContext: any = {}

    if (learningSession?.context) {
      try {
        sessionContext = JSON.parse(learningSession.context)
        progress = sessionContext.progress || 0
        console.log('✅ Resuming existing session, progress:', progress)
      } catch (e) {
        console.log('Failed to parse session context')
      }
    }

    // If no session or completed, create a new one
    if (!learningSession || sessionContext.completed) {
      sessionContext = {
        lessonPlanId: lessonPlan.id,
        progress: 0,
        completed: false,
        startedAt: new Date().toISOString(),
        sectionsCompleted: []
      }

      learningSession = await prisma.aITutorSession.create({
        data: {
          studentId: student.id,
          sessionType: 'lesson',
          subject: lessonPlan.subject,
          topic: lessonPlan.title,
          question: `Starting lesson: ${lessonPlan.title}`,
          response: `Welcome! Let's begin learning about ${lessonPlan.title}.`,
          context: JSON.stringify(sessionContext)
        }
      })
      console.log('✅ Created new learning session:', learningSession.id)
      progress = 0
    }

    // Parse lesson content
    let lessonContent: any = {}
    try {
      lessonContent = typeof lessonPlan.content === 'string' ? 
        JSON.parse(lessonPlan.content) : 
        lessonPlan.content
    } catch (e) {
      console.log('Failed to parse lesson content')
    }

    // Parse scheme of work content if available
    let schemeContent: any = {}
    if (lessonPlan.schemeOfWork?.content) {
      try {
        schemeContent = typeof lessonPlan.schemeOfWork.content === 'string' ? 
          JSON.parse(lessonPlan.schemeOfWork.content) : 
          lessonPlan.schemeOfWork.content
      } catch (e) {
        console.log('Failed to parse scheme content')
      }
    }

    // Prepare lesson data for AI teaching
    const lesson = {
      id: lessonPlan.id,
      sessionId: learningSession.id,
      title: lessonPlan.title,
      subject: lessonPlan.subject,
      grade: lessonPlan.grade,
      progress: progress,
      
      // Lesson structure
      objectives: lessonContent.objectives || lessonContent.learningObjectives || [
        `Understand ${lessonPlan.title}`,
        `Apply concepts in practice`,
        `Master the fundamentals`
      ],
      
      introduction: lessonContent.introduction || lessonContent.starter || 
        `Welcome to ${lessonPlan.title}! In this lesson, we'll explore key concepts in ${lessonPlan.subject}.`,
      
      mainContent: lessonContent.mainContent || lessonContent.content || lessonContent.activities || 
        `This lesson covers important topics in ${lessonPlan.subject}. Let's learn together!`,
      
      examples: lessonContent.examples || lessonContent.demonstrations || [],
      
      activities: lessonContent.activities || lessonContent.tasks || [],
      
      assessment: lessonContent.assessment || lessonContent.evaluation || 
        `Let's check your understanding with some questions.`,
      
      resources: lessonContent.resources || lessonContent.materials || [],
      
      // Scheme of work context
      schemeContext: {
        unit: lessonPlan.schemeOfWork?.title || null,
        unitObjectives: schemeContent.objectives || [],
        prerequisites: schemeContent.prerequisites || [],
        nextTopics: schemeContent.nextTopics || []
      },
      
      // Teaching instructions for AI
      teachingInstructions: {
        approach: lessonContent.teachingApproach || 'interactive',
        pace: lessonContent.pace || 'moderate',
        difficulty: lessonContent.difficulty || lessonPlan.grade,
        focusAreas: lessonContent.focusAreas || [],
        commonMistakes: lessonContent.commonMistakes || [],
        tips: lessonContent.teachingTips || []
      },
      
      // Progress tracking
      sections: [
        { name: 'Introduction', completed: progress >= 25 },
        { name: 'Main Content', completed: progress >= 50 },
        { name: 'Practice', completed: progress >= 75 },
        { name: 'Assessment', completed: progress >= 100 }
      ],
      
      // Teacher info
      teacher: student.teacher ? {
        name: `${student.teacher.user.firstName} ${student.teacher.user.lastName}`,
        email: student.teacher.user.email
      } : {
        name: 'AI Teacher',
        email: 'ai@elimunova.com'
      }
    }

    console.log('✅ Lesson prepared for AI teaching')

    return NextResponse.json({
      success: true,
      lesson,
      message: progress > 0 ? 
        `Resuming from ${progress}% complete` : 
        'Starting new lesson'
    })

  } catch (error) {
    console.error('❌ Error starting AI lesson:', error)
    return NextResponse.json({ 
      error: 'Failed to start lesson',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT endpoint to update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const body = await request.json()
    const { sessionId, progress, completed, sectionsCompleted, notes } = body

    // Get existing session
    const existingSession = await prisma.aITutorSession.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Parse existing context
    let context: any = {}
    try {
      context = JSON.parse(existingSession.context || '{}')
    } catch (e) {
      console.log('Failed to parse existing context')
    }

    // Update context with new progress
    context = {
      ...context,
      progress: progress !== undefined ? progress : context.progress,
      completed: completed !== undefined ? completed : context.completed,
      sectionsCompleted: sectionsCompleted || context.sectionsCompleted || [],
      lastUpdated: new Date().toISOString(),
      notes: notes || context.notes
    }

    // Update session
    const updatedSession = await prisma.aITutorSession.update({
      where: { id: sessionId },
      data: {
        context: JSON.stringify(context),
        response: `Progress updated: ${progress}% complete`
      }
    })

    console.log('✅ Updated learning session:', sessionId, 'Progress:', progress)

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        progress: context.progress,
        completed: context.completed
      }
    })

  } catch (error) {
    console.error('❌ Error updating lesson progress:', error)
    return NextResponse.json({ 
      error: 'Failed to update progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
