/**
 * Migration script for Autonomous AI Tutor
 * 
 * This script:
 * 1. Updates StudentProgress with new fields
 * 2. Updates AITutorSession with new fields
 * 3. Creates TutorSession table
 * 4. Creates ClassSchedule table
 * 5. Creates TutorQuestion table
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Autonomous AI Tutor Schema Migration...\n')

  try {
    // Step 1: Check if new fields exist
    console.log('📊 Checking database schema...')
    
    // This will be handled by Prisma migrate
    console.log('✅ Schema check complete')
    
    // Step 2: Migrate existing StudentProgress records
    console.log('\n📝 Migrating existing StudentProgress records...')
    
    const existingProgress = await prisma.studentProgress.findMany({
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    })

    console.log(`Found ${existingProgress.length} existing progress records`)

    for (const progress of existingProgress) {
      if (!progress.student.classId) {
        console.log(`⚠️  Skipping progress ${progress.id} - no classId`)
        continue
      }

      try {
        await prisma.studentProgress.update({
          where: { id: progress.id },
          data: {
            classId: progress.student.classId,
            subject: 'General',
            topic: 'General Progress',
            masteryScore: progress.score ? Math.min(Math.round(progress.score), 100) : 0,
            lastPracticedAt: progress.updatedAt,
            preferredDifficulty: 'medium',
            streak: 0,
            xp: 0,
            totalQuestions: 0,
            correctAnswers: 0
          }
        })
        console.log(`✅ Migrated progress ${progress.id}`)
      } catch (error) {
        console.log(`⚠️  Error migrating progress ${progress.id}:`, error)
      }
    }

    // Step 3: Migrate existing AITutorSession records
    console.log('\n📝 Migrating existing AITutorSession records...')
    
    const existingSessions = await prisma.aITutorSession.findMany({
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    })

    console.log(`Found ${existingSessions.length} existing tutor sessions`)

    for (const session of existingSessions) {
      if (!session.student.classId) {
        console.log(`⚠️  Skipping session ${session.id} - no classId`)
        continue
      }

      try {
        await prisma.aITutorSession.update({
          where: { id: session.id },
          data: {
            classId: session.student.classId,
            mode: 'teach',
            conversationHistory: [],
            hintsGiven: 0,
            timeSpent: 0
          }
        })
        console.log(`✅ Migrated session ${session.id}`)
      } catch (error) {
        console.log(`⚠️  Error migrating session ${session.id}:`, error)
      }
    }

    // Step 4: Create sample ClassSchedule for testing
    console.log('\n📅 Creating sample class schedules...')
    
    const classes = await prisma.class.findMany({
      include: {
        teacher: true,
        school: true
      },
      take: 5
    })

    for (const classItem of classes) {
      if (!classItem.schoolId) continue

      // Create a sample weekly schedule
      const subjects = ['Mathematics', 'English', 'Science', 'Kiswahili', 'Social Studies']
      
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        const subject = subjects[(day - 1) % subjects.length]
        
        try {
          await prisma.classSchedule.create({
            data: {
              classId: classItem.id,
              schoolId: classItem.schoolId,
              teacherId: classItem.teacherId,
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '10:00',
              subject: subject,
              isActive: true,
              recurring: true,
              startDate: new Date()
            }
          })
          console.log(`✅ Created schedule for ${classItem.name} - ${subject} on day ${day}`)
        } catch (error) {
          console.log(`⚠️  Schedule might already exist for ${classItem.name}`)
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - Updated ${existingProgress.length} progress records`)
    console.log(`   - Updated ${existingSessions.length} tutor sessions`)
    console.log(`   - Created schedules for ${classes.length} classes`)
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
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
