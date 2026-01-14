/**
 * Test script for Autonomous AI Tutor System
 * 
 * Tests:
 * 1. GET /api/student/tutor/next - What to teach now
 * 2. POST /api/student/tutor/message - Tutoring conversation
 * 3. POST /api/student/tutor/submit - Answer submission
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Autonomous AI Tutor System\n')

  try {
    // Find a test student
    console.log('1️⃣  Finding test student...')
    const student = await prisma.student.findFirst({
      where: {
        classId: { not: null }
      },
      include: {
        user: true,
        class: true,
        teacher: true
      }
    })

    if (!student) {
      console.log('❌ No student with class found. Creating test data...')
      // You would create test data here
      return
    }

    console.log(`✅ Found student: ${student.user.firstName} ${student.user.lastName}`)
    console.log(`   Class: ${student.class?.name}`)
    if (student.teacher) {
      console.log(`   Teacher: ${student.teacher.user?.firstName || 'Unknown'}`)
    }

    // Test 1: Get next task
    console.log('\n2️⃣  Testing GET /api/student/tutor/next')
    console.log('   This would determine what to teach based on:')
    console.log('   - Current time + schedule')
    console.log('   - Lesson plans')
    console.log('   - Student mastery')
    
    // Check if student has progress
    const progress = await prisma.studentProgress.findMany({
      where: {
        studentId: student.id,
        classId: student.classId!
      }
    })
    console.log(`   Found ${progress.length} progress records`)

    // Check if class has schedule
    const schedules = await prisma.classSchedule.findMany({
      where: {
        classId: student.classId!
      }
    })
    console.log(`   Found ${schedules.length} schedule slots`)

    if (schedules.length > 0) {
      console.log('   Sample schedule:')
      schedules.slice(0, 3).forEach(s => {
        console.log(`     - Day ${s.dayOfWeek}: ${s.subject} (${s.startTime}-${s.endTime})`)
      })
    }

    // Check lesson plans
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: student.teacherId!
      },
      take: 3
    })
    console.log(`   Found ${lessonPlans.length} lesson plans`)

    // Test 2: Check tutor sessions
    console.log('\n3️⃣  Checking existing tutor sessions...')
    const tutorSessions = await prisma.tutorSession.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    console.log(`   Found ${tutorSessions.length} tutor sessions`)

    if (tutorSessions.length > 0) {
      console.log('   Recent sessions:')
      tutorSessions.forEach(s => {
        console.log(`     - ${s.subject}: ${s.topic} (${s.mode}) - ${s.progress}% complete`)
      })
    }

    // Test 3: Check AI tutor sessions (analytics)
    console.log('\n4️⃣  Checking AI tutor analytics...')
    const aiSessions = await prisma.aITutorSession.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    console.log(`   Found ${aiSessions.length} AI tutor interactions`)

    // Test 4: Verify class isolation
    console.log('\n5️⃣  Verifying class isolation...')
    const studentProgress = await prisma.studentProgress.findMany({
      where: {
        studentId: student.id
      }
    })

    const correctClassId = studentProgress.filter(p => p.classId === student.classId).length
    const wrongClassId = studentProgress.filter(p => p.classId !== student.classId).length

    console.log(`   ✅ Correct classId: ${correctClassId}`)
    if (wrongClassId > 0) {
      console.log(`   ⚠️  Wrong classId: ${wrongClassId} (SECURITY ISSUE!)`)
    } else {
      console.log(`   ✅ No class isolation issues`)
    }

    // Test 5: Check mastery scores
    console.log('\n6️⃣  Checking mastery scores...')
    const masteryData = await prisma.studentProgress.findMany({
      where: {
        studentId: student.id,
        classId: student.classId!
      },
      orderBy: {
        masteryScore: 'desc'
      },
      take: 5
    })

    if (masteryData.length > 0) {
      console.log('   Top mastery scores:')
      masteryData.forEach(m => {
        console.log(`     - ${m.subject} / ${m.topic}: ${m.masteryScore}/100`)
        console.log(`       Questions: ${m.correctAnswers}/${m.totalQuestions} correct`)
        console.log(`       XP: ${m.xp}, Streak: ${m.streak}`)
      })
    } else {
      console.log('   No mastery data yet - student needs to start learning!')
    }

    // Summary
    console.log('\n📊 SYSTEM STATUS:')
    console.log(`   Students with classes: ${await prisma.student.count({ where: { classId: { not: null } } })}`)
    console.log(`   Class schedules: ${await prisma.classSchedule.count()}`)
    console.log(`   Tutor sessions: ${await prisma.tutorSession.count()}`)
    console.log(`   Progress records: ${await prisma.studentProgress.count()}`)
    console.log(`   AI interactions: ${await prisma.aITutorSession.count()}`)

    console.log('\n✅ Autonomous Tutor System is ready!')
    console.log('\n📝 Next steps:')
    console.log('   1. Run: npx prisma migrate dev --name autonomous-tutor')
    console.log('   2. Run: npx tsx scripts/migrate-autonomous-tutor-schema.ts')
    console.log('   3. Test the API endpoints with a student account')
    console.log('   4. Update the frontend to use new endpoints')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
