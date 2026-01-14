/**
 * Diagnose AI Tutor Lesson Plan Integration Issue
 * 
 * This script checks:
 * 1. Shared lesson plans for students
 * 2. How the tutor orchestrator retrieves lesson plans
 * 3. Why shared lesson plans aren't being picked up
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  console.log('🔍 DIAGNOSING AI TUTOR LESSON PLAN ISSUE\n')
  console.log('=' .repeat(60))

  try {
    // 1. Check teacher content
    console.log('\n📚 CHECKING TEACHER CONTENT...')
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          email: 'larrymarongo7@gmail.com'
        }
      },
      include: {
        user: true
      }
    })

    if (!teacher) {
      console.log('❌ Teacher not found')
      return
    }

    console.log(`✅ Teacher: ${teacher.user.firstName} ${teacher.user.lastName}`)
    console.log(`   ID: ${teacher.id}`)

    // 2. Check lesson plans
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        sharedWith: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📝 LESSON PLANS: ${lessonPlans.length} total`)
    lessonPlans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.title}`)
      console.log(`   Subject: ${plan.subject}`)
      console.log(`   Grade: ${plan.grade}`)
      console.log(`   Created: ${plan.createdAt.toISOString()}`)
      console.log(`   Shared with: ${plan.sharedWith.length} students`)
      
      plan.sharedWith.forEach(shared => {
        console.log(`      - ${shared.student.user.firstName} ${shared.student.user.lastName} (${shared.isActive ? 'Active' : 'Inactive'})`)
      })
    })

    // 3. Check students
    console.log('\n\n👨‍🎓 CHECKING STUDENTS...')
    const students = await prisma.student.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        user: true,
        class: true,
        sharedLessonPlans: {
          include: {
            lessonPlan: true
          }
        }
      }
    })

    console.log(`Found ${students.length} students`)
    students.forEach(student => {
      console.log(`\n- ${student.user.firstName} ${student.user.lastName}`)
      console.log(`  Class: ${student.class?.name || 'No class'}`)
      console.log(`  Shared lesson plans: ${student.sharedLessonPlans.length}`)
      
      student.sharedLessonPlans.forEach(shared => {
        console.log(`    • ${shared.lessonPlan.title} (${shared.isActive ? 'Active' : 'Inactive'})`)
      })
    })

    // 4. Simulate tutor orchestrator logic
    console.log('\n\n🤖 SIMULATING TUTOR ORCHESTRATOR LOGIC...')
    
    if (students.length > 0) {
      const testStudent = students[0]
      console.log(`\nTesting with: ${testStudent.user.firstName} ${testStudent.user.lastName}`)
      
      // Current logic in orchestrator
      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const todayEnd = new Date(now.setHours(23, 59, 59, 999))
      
      console.log(`\nLooking for lesson plans created TODAY:`)
      console.log(`  Start: ${todayStart.toISOString()}`)
      console.log(`  End: ${todayEnd.toISOString()}`)
      
      const todayLessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          teacherId: teacher.id,
          subject: 'Mathematics', // Example subject
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      })
      
      console.log(`\n${todayLessonPlan ? '✅' : '❌'} Found lesson plan for today: ${todayLessonPlan?.title || 'None'}`)
      
      // Check shared lesson plans (not used in current logic!)
      console.log(`\n⚠️  ISSUE IDENTIFIED:`)
      console.log(`   The orchestrator looks for lesson plans by:`)
      console.log(`   1. Teacher ID`)
      console.log(`   2. Subject`)
      console.log(`   3. Created TODAY`)
      console.log(`\n   But it does NOT check:`)
      console.log(`   - SharedLessonPlan table`)
      console.log(`   - Lesson plans shared with the student`)
      console.log(`   - Lesson plans created on other days`)
      
      // Show what SHOULD be available
      console.log(`\n✅ SHARED LESSON PLANS AVAILABLE:`)
      testStudent.sharedLessonPlans.forEach(shared => {
        console.log(`   - ${shared.lessonPlan.title}`)
        console.log(`     Subject: ${shared.lessonPlan.subject}`)
        console.log(`     Created: ${shared.lessonPlan.createdAt.toISOString()}`)
        console.log(`     Shared: ${shared.sharedAt.toISOString()}`)
      })
    }

    // 5. Recommendations
    console.log('\n\n💡 RECOMMENDATIONS:')
    console.log('=' .repeat(60))
    console.log('\n1. MODIFY ORCHESTRATOR to check SharedLessonPlan table')
    console.log('   - Look for lesson plans shared with the student')
    console.log('   - Don\'t restrict by creation date')
    console.log('   - Prioritize shared lesson plans over date-based lookup')
    
    console.log('\n2. ADD FALLBACK for general questions')
    console.log('   - If no lesson plan found, use general tutoring mode')
    console.log('   - Allow students to ask any questions')
    console.log('   - Still be helpful and educational')
    
    console.log('\n3. STRICT LESSON PLAN MODE when available')
    console.log('   - When lesson plan exists, follow it closely')
    console.log('   - Teach the specific objectives')
    console.log('   - But still allow clarifying questions')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
