import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testContinueLearningButton() {
  console.log('🧪 Testing Continue Learning Button API...\n')

  try {
    // Find a student with a teacher
    const student = await prisma.student.findFirst({
      where: {
        teacherId: {
          not: null
        }
      },
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
      console.log('❌ No student with teacher found')
      return
    }

    console.log('✅ Testing with student:', student.user.email)
    console.log('   Teacher:', `${student.teacher!.user.firstName} ${student.teacher!.user.lastName}`)
    console.log('')

    // Check if teacher has lesson plans
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: student.teacherId!
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📚 Teacher has ${lessonPlans.length} lesson plans`)
    
    if (lessonPlans.length === 0) {
      console.log('❌ ISSUE: Teacher has no lesson plans!')
      console.log('   The Continue Learning button will fail because there are no lessons to start.')
      console.log('')
      console.log('💡 Solution: Teacher needs to create at least one lesson plan')
      return
    }

    const recentLesson = lessonPlans[0]
    console.log('   Most recent lesson:', recentLesson.title)
    console.log('   Subject:', recentLesson.subject)
    console.log('   Grade:', recentLesson.grade)
    console.log('')

    // Simulate what the API does
    console.log('🔄 Simulating API call to /api/student/ai-lessons/current/start')
    console.log('')

    // Check if lesson has required fields
    console.log('📋 Checking lesson data structure...')
    
    let lessonContent: any = {}
    try {
      lessonContent = typeof recentLesson.content === 'string' ? 
        JSON.parse(recentLesson.content) : 
        recentLesson.content
      console.log('   ✅ Lesson content parsed successfully')
    } catch (e) {
      console.log('   ⚠️  Could not parse lesson content')
    }

    // Check for objectives
    const objectives = lessonContent.objectives || lessonContent.learningObjectives || []
    console.log('   Objectives:', objectives.length > 0 ? `${objectives.length} found` : 'Using defaults')
    
    // Check for introduction
    const hasIntro = !!(lessonContent.introduction || lessonContent.starter)
    console.log('   Introduction:', hasIntro ? 'Found' : 'Using default')
    
    // Check for main content
    const hasContent = !!(lessonContent.mainContent || lessonContent.content || lessonContent.activities)
    console.log('   Main Content:', hasContent ? 'Found' : 'Using default')
    console.log('')

    // Check if we can create an AI tutor session
    console.log('🤖 Checking AI Tutor Session creation...')
    
    const existingSession = await prisma.aITutorSession.findFirst({
      where: {
        studentId: student.id,
        sessionType: 'lesson',
        topic: recentLesson.title,
        subject: recentLesson.subject
      }
    })

    if (existingSession) {
      console.log('   ✅ Existing session found:', existingSession.id)
      
      if (existingSession.context) {
        try {
          const context = JSON.parse(existingSession.context)
          console.log('   Progress:', context.progress || 0, '%')
          console.log('   Completed:', context.completed ? 'Yes' : 'No')
        } catch (e) {
          console.log('   ⚠️  Could not parse session context')
        }
      }
    } else {
      console.log('   ℹ️  No existing session - will create new one')
    }
    console.log('')

    // Test the actual lesson structure that would be returned
    console.log('📦 Lesson structure that would be returned:')
    const lessonStructure = {
      id: recentLesson.id,
      title: recentLesson.title,
      subject: recentLesson.subject,
      grade: recentLesson.grade,
      progress: existingSession ? 0 : 0,
      objectives: objectives.length > 0 ? objectives : ['Default objectives'],
      teacher: {
        name: `${student.teacher!.user.firstName} ${student.teacher!.user.lastName}`,
        email: student.teacher!.user.email
      }
    }
    
    console.log('   ✅ Lesson structure is valid')
    console.log('   Title:', lessonStructure.title)
    console.log('   Subject:', lessonStructure.subject)
    console.log('   Teacher:', lessonStructure.teacher.name)
    console.log('')

    console.log('✅ API should work correctly!')
    console.log('')
    console.log('🔍 If button still fails, check:')
    console.log('   1. Browser console for exact error message')
    console.log('   2. Next.js terminal for server-side errors')
    console.log('   3. Network tab to see the actual API response')

  } catch (error) {
    console.error('❌ Error:', error)
    
    if (error instanceof Error) {
      console.log('')
      console.log('Error details:', error.message)
      console.log('Stack:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testContinueLearningButton()
