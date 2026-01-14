import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load production environment variables
dotenv.config({ path: '.env.production' })

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function migrateTutorToProduction() {
  try {
    console.log('🚀 Starting migration to add tutor tables to production...\n')

    // Create AITutorProgress table
    console.log('Creating AITutorProgress table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AITutorProgress" (
        "id" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "lessonPlanId" TEXT NOT NULL,
        "currentStep" INTEGER NOT NULL DEFAULT 0,
        "totalSteps" INTEGER NOT NULL DEFAULT 0,
        "completedSteps" INTEGER NOT NULL DEFAULT 0,
        "currentTopic" TEXT,
        "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "timeSpent" INTEGER NOT NULL DEFAULT 0,
        "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "AITutorProgress_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('✅ AITutorProgress table created\n')

    // Create indexes for AITutorProgress
    console.log('Creating indexes for AITutorProgress...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AITutorProgress_studentId_idx" ON "AITutorProgress"("studentId");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AITutorProgress_lessonPlanId_idx" ON "AITutorProgress"("lessonPlanId");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AITutorProgress_studentId_lessonPlanId_key" ON "AITutorProgress"("studentId", "lessonPlanId");
    `)
    console.log('✅ Indexes created for AITutorProgress\n')

    // Add foreign key constraints for AITutorProgress
    console.log('Adding foreign key constraints for AITutorProgress...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AITutorProgress_studentId_fkey'
        ) THEN
          ALTER TABLE "AITutorProgress" ADD CONSTRAINT "AITutorProgress_studentId_fkey" 
          FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AITutorProgress_lessonPlanId_fkey'
        ) THEN
          ALTER TABLE "AITutorProgress" ADD CONSTRAINT "AITutorProgress_lessonPlanId_fkey" 
          FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)
    console.log('✅ Foreign key constraints added for AITutorProgress\n')

    // Remove status column from SharedLessonPlan if it exists
    console.log('Checking SharedLessonPlan table...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SharedLessonPlan" DROP COLUMN IF EXISTS "status";
    `)
    console.log('✅ SharedLessonPlan table updated\n')

    console.log('✅ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Commit and push these changes to GitHub')
    console.log('2. Vercel will automatically redeploy with the updated database')

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateTutorToProduction()
