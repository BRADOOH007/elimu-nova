import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProductionTutorTables() {
  try {
    console.log('🔍 Checking Neon database for tutor tables...\n')

    // Check if AITutorSession table exists
    try {
      const sessionCount = await prisma.aITutorSession.count()
      console.log('✅ AITutorSession table exists')
      console.log(`   Found ${sessionCount} sessions\n`)
    } catch (error: any) {
      console.error('❌ AITutorSession table missing or has errors:')
      console.error(`   ${error.message}\n`)
    }

    // Check if AITutorProgress table exists
    try {
      const progressCount = await prisma.aITutorProgress.count()
      console.log('✅ AITutorProgress table exists')
      console.log(`   Found ${progressCount} progress records\n`)
    } catch (error: any) {
      console.error('❌ AITutorProgress table missing or has errors:')
      console.error(`   ${error.message}\n`)
    }

    // Check if SharedLessonPlan table exists and has required fields
    try {
      const sharedLessons = await prisma.sharedLessonPlan.findMany({
        take: 1,
        select: {
          id: true,
          lessonPlanId: true,
          studentId: true,
          sharedAt: true,
          status: true
        }
      })
      console.log('✅ SharedLessonPlan table exists with required fields')
      console.log(`   Found ${sharedLessons.length > 0 ? 'sample data' : 'no data yet'}\n`)
    } catch (error: any) {
      console.error('❌ SharedLessonPlan table missing or has errors:')
      console.error(`   ${error.message}\n`)
    }

    // Try to query a sample student to see if relationships work
    try {
      const sampleStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        include: {
          tutorSessions: true,
          tutorProgress: true,
          sharedLessonPlans: true
        }
      })

      if (sampleStudent) {
        console.log('✅ Student relationships working:')
        console.log(`   - Tutor sessions: ${sampleStudent.tutorSessions?.length || 0}`)
        console.log(`   - Tutor progress: ${sampleStudent.tutorProgress?.length || 0}`)
        console.log(`   - Shared lessons: ${sampleStudent.sharedLessonPlans?.length || 0}\n`)
      } else {
        console.log('⚠️  No students found in database\n')
      }
    } catch (error: any) {
      console.error('❌ Student relationships have errors:')
      console.error(`   ${error.message}\n`)
    }

    console.log('✅ Database check complete!')

  } catch (error) {
    console.error('❌ Fatal error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionTutorTables()
