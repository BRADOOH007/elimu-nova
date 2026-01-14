import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching AI teacher insights...')
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      console.log('❌ Unauthorized - not a student')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Session found:', session.user.email)

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        class: true
      }
    })

    if (!student) {
      console.log('❌ Student not found')
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.log('✅ Student found:', student.id)

    // Get the most recent lesson plan from the student's teacher
    const recentLessonPlan = student.teacherId ? await prisma.lessonPlan.findFirst({
      where: {
        teacherId: student.teacherId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        content: true,
        schemeOfWorkId: true,
        createdAt: true
      }
    }) : null

    console.log('📖 Recent lesson plan:', recentLessonPlan?.title || 'None found')

    // Get student's progress on assignments
    const assignments = await prisma.assignment.findMany({
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
      take: 10
    })

    const completedAssignments = assignments.filter(a => 
      a.submissions.some(s => s.status === 'GRADED')
    )

    // Get AI tutor sessions for learning path
    const aiSessions = await prisma.aITutorSession.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        subject: true,
        topic: true,
        createdAt: true
      }
    })

    // Build current lesson from recent lesson plan
    let lessonContent: any = {}
    if (recentLessonPlan?.content) {
      try {
        lessonContent = typeof recentLessonPlan.content === 'string' ? 
          JSON.parse(recentLessonPlan.content) : 
          recentLessonPlan.content
      } catch (e) {
        console.log('Failed to parse lesson content')
      }
    }

    const currentLesson = recentLessonPlan ? {
      title: recentLessonPlan.title,
      subject: recentLessonPlan.subject,
      objectives: lessonContent.objectives || lessonContent.learningObjectives || 
        ["Study the lesson content", "Complete practice exercises", "Ask questions if needed"],
      progress: calculateProgress(assignments, completedAssignments),
      nextSteps: generateNextSteps(assignments, aiSessions)
    } : {
      title: "Getting Started with Learning",
      subject: "General",
      objectives: [
        "Explore your dashboard and available resources",
        "Check your assignments and upcoming lessons",
        "Use the AI tutor for personalized help"
      ],
      progress: 0,
      nextSteps: [
        "Complete your profile setup",
        "Review your first assignment",
        "Ask the AI tutor any questions"
      ]
    }

    // Build learning path from multiple sources
    // 1. Completed topics from graded assignments and AI sessions
    const completedFromAssignments = assignments
      .filter(a => a.submissions.some(s => s.status === 'GRADED'))
      .map(a => a.title)
    
    const completedFromAI = aiSessions
      .filter(s => s.topic)
      .map(s => s.topic as string)
    
    const completedTopics = [...new Set([...completedFromAssignments, ...completedFromAI])]
    
    // 2. Current topic from most recent activity
    const currentTopic = aiSessions[0]?.topic || 
                        recentLessonPlan?.title || 
                        assignments[0]?.title || 
                        "Getting Started"
    
    // 3. Upcoming topics from pending assignments and lesson plans
    const upcomingFromAssignments = assignments
      .filter(a => !a.submissions.some(s => s.status === 'GRADED'))
      .map(a => a.title)
    
    const upcomingTopics = upcomingFromAssignments.length > 0 ? 
      upcomingFromAssignments.slice(0, 3) : 
      ["New topics coming soon", "Check with your teacher", "Explore AI tutor"]

    // Get today's schedule to determine what to teach
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySchedule = student.schoolId ? await prisma.schedule.findMany({
      where: {
        schoolId: student.schoolId,
        startTime: {
          gte: today,
          lt: tomorrow
        },
        type: 'CLASS'
      },
      include: {
        class: true
      },
      orderBy: {
        startTime: 'asc'
      }
    }) : []

    console.log('📅 Today\'s schedule:', todaySchedule.length, 'classes')

    // Get scheme of work for current subject
    const schemeOfWork = recentLessonPlan?.schemeOfWorkId ? 
      await prisma.schemeOfWork.findUnique({
        where: { id: recentLessonPlan.schemeOfWorkId },
        select: {
          title: true,
          subject: true,
          grade: true,
          content: true,
          objectives: true
        }
      }) : null

    console.log('📋 Scheme of work:', schemeOfWork?.title || 'None found')

    // Generate personalized recommendations
    const recommendations = generateRecommendations(student, assignments, aiSessions)

    // Performance analysis
    const performanceAnalysis = analyzePerformance(assignments, aiSessions)

    // Generate AI teaching plan based on schedule and lesson plans
    const aiTeachingPlan = await generateAITeachingPlan(
      recentLessonPlan,
      schemeOfWork,
      todaySchedule,
      assignments,
      student
    )

    console.log('📚 Learning Path Data:')
    console.log('  Completed:', completedTopics.length, 'topics')
    console.log('  Current:', currentTopic)
    console.log('  Upcoming:', upcomingTopics.length, 'topics')

    const insights = {
      currentLesson,
      learningPath: {
        completed: completedTopics.slice(0, 5),
        current: currentTopic,
        upcoming: upcomingTopics.length > 0 ? upcomingTopics : ["New assignments coming soon"]
      },
      personalizedRecommendations: recommendations,
      performanceAnalysis,
      aiTeachingPlan
    }

    console.log('✅ AI insights generated successfully')
    return NextResponse.json(insights)

  } catch (error) {
    console.error('❌ Error fetching AI teacher insights:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch AI insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions
function calculateProgress(assignments: any[], completedAssignments: any[]): number {
  if (assignments.length === 0) return 0
  return Math.round((completedAssignments.length / assignments.length) * 100)
}

function generateNextSteps(assignments: any[], aiSessions: any[]): string[] {
  const steps: string[] = []
  
  const pendingAssignments = assignments.filter(a => 
    !a.submissions.some((s: any) => s.status === 'GRADED')
  )
  
  if (pendingAssignments.length > 0) {
    steps.push(`Complete ${pendingAssignments[0].title}`)
  }
  
  if (aiSessions.length === 0) {
    steps.push("Try the AI tutor for personalized help")
  }
  
  steps.push("Review lesson materials and objectives")
  steps.push("Practice with exercises and examples")
  
  return steps.slice(0, 3)
}

function generateRecommendations(student: any, assignments: any[], aiSessions: any[]) {
  const focusAreas: string[] = []
  const studyMethods: string[] = []
  
  // Analyze subjects from assignments
  const subjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))]
  if (subjects.length > 0) {
    focusAreas.push(...subjects.slice(0, 3))
  } else {
    focusAreas.push("Core subjects", "Foundation concepts", "Practice exercises")
  }
  
  // Study methods based on activity
  if (aiSessions.length > 5) {
    studyMethods.push("Continue using AI tutor - you're doing great!")
  } else {
    studyMethods.push("Try the AI tutor for personalized help")
  }
  
  studyMethods.push("Practice with real examples")
  studyMethods.push("Review lesson materials regularly")
  
  return {
    focusAreas,
    studyMethods,
    timeAllocation: [
      "2 hours daily study time",
      "1 hour for assignments",
      "30 minutes for review"
    ],
    resources: [
      "AI Tutor for instant help",
      "Lesson materials from teacher",
      "Practice exercises and quizzes"
    ]
  }
}

function analyzePerformance(assignments: any[], aiSessions: any[]) {
  const strengths: string[] = []
  const improvements: string[] = []
  
  const completedCount = assignments.filter(a => 
    a.submissions.some((s: any) => s.status === 'GRADED')
  ).length
  
  const totalCount = assignments.length
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  
  if (completionRate > 70) {
    strengths.push("Excellent assignment completion rate")
  } else if (completionRate > 40) {
    strengths.push("Good progress on assignments")
  } else {
    improvements.push("Focus on completing more assignments")
  }
  
  if (aiSessions.length > 10) {
    strengths.push("Active engagement with AI learning tools")
  } else if (aiSessions.length > 0) {
    strengths.push("Using AI tutor for help")
  } else {
    improvements.push("Try using the AI tutor for personalized help")
  }
  
  // Add default items if lists are empty
  if (strengths.length === 0) {
    strengths.push("Ready to learn", "Good attitude", "Eager to improve")
  }
  
  if (improvements.length === 0) {
    improvements.push("Consistent practice", "Regular study schedule", "Active participation")
  }
  
  return {
    strengths,
    improvements,
    trends: completionRate > 50 ? "Positive learning trajectory" : "Building momentum",
    predictions: [
      completionRate > 70 ? "Excellent progress expected" : "Good progress with consistent effort",
      "Focus on understanding core concepts",
      "Regular practice will improve results"
    ]
  }
}

async function generateAITeachingPlan(
  lessonPlan: any,
  schemeOfWork: any,
  todaySchedule: any[],
  assignments: any[],
  student: any
) {
  const today: string[] = []
  const thisWeek: string[] = []
  const thisMonth: string[] = []

  // Parse lesson plan content
  let lessonContent: any = {}
  if (lessonPlan?.content) {
    try {
      lessonContent = typeof lessonPlan.content === 'string' ? 
        JSON.parse(lessonPlan.content) : 
        lessonPlan.content
    } catch (e) {
      console.log('Failed to parse lesson content for teaching plan')
    }
  }

  // Parse scheme of work content
  let schemeContent: any = {}
  if (schemeOfWork?.content) {
    try {
      schemeContent = typeof schemeOfWork.content === 'string' ? 
        JSON.parse(schemeOfWork.content) : 
        schemeOfWork.content
    } catch (e) {
      console.log('Failed to parse scheme content')
    }
  }

  // TODAY'S FOCUS - Based on schedule and current lesson
  if (todaySchedule.length > 0) {
    const firstClass = todaySchedule[0]
    today.push(`Attend ${firstClass.title} at ${new Date(firstClass.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`)
  }

  if (lessonPlan) {
    const objectives = lessonContent.objectives || lessonContent.learningObjectives || []
    if (objectives.length > 0) {
      today.push(`Focus on: ${objectives[0]}`)
      if (objectives.length > 1) {
        today.push(`Practice: ${objectives[1]}`)
      }
    } else {
      today.push(`Study ${lessonPlan.subject}: ${lessonPlan.title}`)
    }
  }

  // Add pending assignments for today
  const urgentAssignments = assignments.filter(a => {
    if (a.submissions.some((s: any) => s.status === 'GRADED')) return false
    const dueDate = new Date(a.dueDate)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dueDate <= tomorrow
  })

  if (urgentAssignments.length > 0) {
    today.push(`Complete urgent assignment: ${urgentAssignments[0].title}`)
  }

  // Default today items if empty
  if (today.length === 0) {
    today.push("Review current lesson materials")
    today.push("Complete any pending assignments")
    today.push("Use AI tutor for questions")
  }

  // THIS WEEK - Based on lesson plan and scheme of work
  if (lessonPlan) {
    thisWeek.push(`Master ${lessonPlan.subject}: ${lessonPlan.title}`)
    
    const objectives = lessonContent.objectives || lessonContent.learningObjectives || []
    objectives.slice(0, 2).forEach((obj: string) => {
      thisWeek.push(`Achieve: ${obj}`)
    })
  }

  if (schemeOfWork) {
    const schemeObjectives = schemeContent.objectives || schemeOfWork.objectives || []
    if (schemeObjectives.length > 0) {
      thisWeek.push(`Progress in: ${schemeObjectives[0]}`)
    }
  }

  // Add weekly assignment goals
  const weeklyAssignments = assignments.filter(a => {
    if (a.submissions.some((s: any) => s.status === 'GRADED')) return false
    const dueDate = new Date(a.dueDate)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return dueDate <= nextWeek
  })

  if (weeklyAssignments.length > 0) {
    thisWeek.push(`Submit ${weeklyAssignments.length} assignment${weeklyAssignments.length > 1 ? 's' : ''} on time`)
  }

  // Default week items if empty
  if (thisWeek.length === 0) {
    thisWeek.push("Master current subject concepts")
    thisWeek.push("Complete all assignments")
    thisWeek.push("Practice regularly with AI tutor")
  }

  // THIS MONTH - Based on scheme of work and long-term goals
  if (schemeOfWork) {
    thisMonth.push(`Complete ${schemeOfWork.subject} unit: ${schemeOfWork.title}`)
    
    const schemeObjectives = schemeContent.objectives || schemeOfWork.objectives || []
    schemeObjectives.slice(0, 2).forEach((obj: string) => {
      thisMonth.push(`Master: ${obj}`)
    })
  }

  if (lessonPlan) {
    thisMonth.push(`Build strong foundation in ${lessonPlan.subject}`)
  }

  // Add monthly performance goals
  const monthlyAssignments = assignments.filter(a => {
    if (a.submissions.some((s: any) => s.status === 'GRADED')) return false
    const dueDate = new Date(a.dueDate)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return dueDate <= nextMonth
  })

  if (monthlyAssignments.length > 0) {
    thisMonth.push(`Complete all ${monthlyAssignments.length} assignments with good grades`)
  }

  thisMonth.push("Develop consistent study habits")
  thisMonth.push("Show measurable improvement in weak areas")

  // Default month items if empty
  if (thisMonth.length === 0) {
    thisMonth.push("Achieve consistent academic progress")
    thisMonth.push("Master core subject concepts")
    thisMonth.push("Build strong study habits")
  }

  return {
    today: today.slice(0, 3),
    thisWeek: thisWeek.slice(0, 3),
    thisMonth: thisMonth.slice(0, 3)
  }
}
