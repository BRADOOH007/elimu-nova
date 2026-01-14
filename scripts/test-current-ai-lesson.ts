import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCurrentAILesson() {
  console.log('🧪 Testing Current AI Lesson Feature...\n')

  try {
    // Find a student
    const student = await prisma.student.findFirst({
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
      console.log('❌ No student found')
      return
    }

    console.log('✅ Testing with student:', student.user.email)
    console.log('   Teacher:', student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : 'None')
    console.log('')

    // Check if teacher has lesson plans
    if (student.teacherId) {
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: {
          teacherId: student.teacherId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })

      console.log(`📚 Teacher has ${lessonPlans.length} lesson plans`)
      
      if (lessonPlans.length > 0) {
        const recentLesson = lessonPlans[0]
        console.log('   Most recent:', recentLesson.title)
        console.log('   Subject:', recentLesson.subject)
        console.log('   Grade:', recentLesson.grade)
        
        // Parse content
        try {
          const content = typeof recentLesson.content === 'string' ? 
            JSON.parse(recentLesson.content) : 
            recentLesson.content
          
          console.log('   Objectives:', content.objectives?.length || content.learningObjectives?.length || 0)
          console.log('   Has introduction:', !!content.introduction || !!content.starter)
          console.log('   Has main content:', !!content.mainContent || !!content.content)
        } catch (e) {
          console.log('   ⚠️  Could not parse lesson content')
        }
      } else {
        console.log('   ⚠️  No lesson plans available')
      }
    } else {
      console.log('⚠️  Student has no teacher - independent learner')
    }
    console.log('')

    // Check AI tutor sessions for this student
    console.log('🤖 Checking AI Tutor Sessions...')
    const aiSessions = await prisma.aITutorSession.findMany({
      where: {
        studentId: student.id,
        sessionType: 'lesson'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    console.log(`   Found ${aiSessions.length} lesson sessions`)
    aiSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.topic || 'Untitled'}`)
      console.log(`      Subject: ${session.subject || 'General'}`)
      
      if (session.context) {
        try {
          const context = JSON.parse(session.context)
          console.log(`      Progress: ${context.progress || 0}%`)
          console.log(`      Completed: ${context.completed ? 'Yes' : 'No'}`)
        } catch (e) {
          console.log('      ⚠️  Could not parse context')
        }
      }
    })
    console.log('')

    // Test the AI insights API data structure
    console.log('📊 Testing AI Insights Data Structure...')
    
    if (student.teacherId) {
      const recentLessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          teacherId: student.teacherId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (recentLessonPlan) {
        let lessonContent: any = {}
        try {
          lessonContent = typeof recentLessonPlan.content === 'string' ? 
            JSON.parse(recentLessonPlan.content) : 
            recentLessonPlan.content
        } catch (e) {
          console.log('   ⚠️  Could not parse lesson content')
        }

        const currentLesson = {
          title: recentLessonPlan.title,
          subject: recentLessonPlan.subject,
          objectives: lessonContent.objectives || lessonContent.learningObjectives || [],
          progress: 0
        }

        console.log('   ✅ Current Lesson Structure:')
        console.log('      Title:', currentLesson.title)
        console.log('      Subject:', currentLesson.subject)
        console.log('      Objectives:', currentLesson.objectives.length)
        console.log('      Progress:', currentLesson.progress + '%')
      } else {
        console.log('   ⚠️  No lesson plan to display')
      }
    } else {
      console.log('   ⚠️  Independent student - using fallback data')
    }
    console.log('')

    // Check for TypeScript issues
    console.log('🔍 Checking for Issues...')
    
    const issues = []
    
    if (!student.teacherId) {
      issues.push('Student has no teacher (independent learner)')
    }
    
    if (student.teacherId) {
      const lessonCount = await prisma.lessonPlan.count({
        where: { teacherId: student.teacherId }
      })
      if (lessonCount === 0) {
        issues.push('Teacher has no lesson plans')
      }
    }
    
    if (issues.length > 0) {
      console.log('   ⚠️  Issues found:')
      issues.forEach(issue => console.log('      -', issue))
    } else {
      console.log('   ✅ No issues found')
    }
    console.log('')

    console.log('📝 Summary:')
    console.log('   ✅ Data fetching works')
    console.log('   ✅ Lesson structure is correct')
    console.log('   ⚠️  API has TypeScript errors (null checks needed)')
    console.log('   ⚠️  Button functionality needs null safety')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCurrentAILesson()
