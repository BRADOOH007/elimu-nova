/**
 * Migrate Missing Tables to Neon Database
 * This will add the AIGeneratedImage and AIImageUsage tables that are missing
 */

import { PrismaClient } from '@prisma/client';

async function migrateMissingTables() {
  console.log('🚀 Migrating Missing Tables to Neon Database...\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_4dCrxETYqoX9@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to Neon database\n');

    // Create AIImageType enum if it doesn't exist
    console.log('📋 Creating AIImageType enum...');
    try {
      await prisma.$executeRaw`
        CREATE TYPE "AIImageType" AS ENUM (
          'GENERAL',
          'DIAGRAM',
          'POSTER',
          'ILLUSTRATION',
          'CHART',
          'MAP',
          'INFOGRAPHIC',
          'CONCEPT_ART',
          'EDUCATIONAL'
        );
      `;
      console.log('✅ AIImageType enum created');
    } catch (error) {
      console.log('⚠️  AIImageType enum already exists or error:', error);
    }

    // Create AIImageSize enum if it doesn't exist
    console.log('📋 Creating AIImageSize enum...');
    try {
      await prisma.$executeRaw`
        CREATE TYPE "AIImageSize" AS ENUM (
          'SMALL_512',
          'MEDIUM_1024',
          'LARGE_1536',
          'PORTRAIT_1024'
        );
      `;
      console.log('✅ AIImageSize enum created');
    } catch (error) {
      console.log('⚠️  AIImageSize enum already exists or error:', error);
    }

    // Create ai_generated_images table
    console.log('📋 Creating ai_generated_images table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE "ai_generated_images" (
          "id" TEXT NOT NULL,
          "filename" TEXT NOT NULL,
          "originalUrl" TEXT NOT NULL,
          "storedUrl" TEXT NOT NULL,
          "topic" TEXT NOT NULL,
          "prompt" TEXT NOT NULL,
          "type" "AIImageType" NOT NULL DEFAULT 'GENERAL',
          "size" "AIImageSize" NOT NULL DEFAULT 'MEDIUM_1024',
          "quality" TEXT NOT NULL DEFAULT 'standard',
          "userId" TEXT NOT NULL,
          "studentId" TEXT,
          "teacherId" TEXT,
          "schoolId" TEXT,
          "classId" TEXT,
          "fileSize" INTEGER,
          "dimensions" TEXT,
          "metadata" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "ai_generated_images_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ ai_generated_images table created');
    } catch (error) {
      console.log('⚠️  ai_generated_images table already exists or error:', error);
    }

    // Create unique constraint on filename
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "ai_generated_images_filename_key" ON "ai_generated_images"("filename");
      `;
      console.log('✅ Unique constraint on filename created');
    } catch (error) {
      console.log('⚠️  Unique constraint already exists or error:', error);
    }

    // Create ai_image_usage table
    console.log('📋 Creating ai_image_usage table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE "ai_image_usage" (
          "id" TEXT NOT NULL,
          "imageId" TEXT NOT NULL,
          "usageType" TEXT NOT NULL,
          "context" TEXT,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "ai_image_usage_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ ai_image_usage table created');
    } catch (error) {
      console.log('⚠️  ai_image_usage table already exists or error:', error);
    }

    // Add foreign key constraints
    console.log('📋 Adding foreign key constraints...');
    
    // ai_generated_images foreign keys
    const foreignKeys = [
      {
        name: 'ai_generated_images_userId_fkey',
        sql: `ALTER TABLE "ai_generated_images" ADD CONSTRAINT "ai_generated_images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_generated_images_studentId_fkey', 
        sql: `ALTER TABLE "ai_generated_images" ADD CONSTRAINT "ai_generated_images_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_generated_images_teacherId_fkey',
        sql: `ALTER TABLE "ai_generated_images" ADD CONSTRAINT "ai_generated_images_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_generated_images_schoolId_fkey',
        sql: `ALTER TABLE "ai_generated_images" ADD CONSTRAINT "ai_generated_images_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_generated_images_classId_fkey',
        sql: `ALTER TABLE "ai_generated_images" ADD CONSTRAINT "ai_generated_images_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_image_usage_imageId_fkey',
        sql: `ALTER TABLE "ai_image_usage" ADD CONSTRAINT "ai_image_usage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ai_generated_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'ai_image_usage_userId_fkey',
        sql: `ALTER TABLE "ai_image_usage" ADD CONSTRAINT "ai_image_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      }
    ];

    for (const fk of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fk.sql);
        console.log(`✅ ${fk.name} constraint added`);
      } catch (error) {
        console.log(`⚠️  ${fk.name} constraint already exists or error:`, error);
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying created tables...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_generated_images', 'ai_image_usage')
      ORDER BY table_name;
    ` as Array<{table_name: string}>;

    console.log('📊 AI Image tables found:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });

    // Test the new tables
    console.log('\n🧪 Testing new tables...');
    
    try {
      // Test AIGeneratedImage count (should work now)
      const imageCount = await prisma.aIGeneratedImage.count();
      console.log(`✅ AIGeneratedImage table accessible - ${imageCount} records`);
    } catch (error) {
      console.log(`❌ AIGeneratedImage table test failed: ${error}`);
    }

    try {
      // Test AIImageUsage count
      const usageCount = await prisma.aIImageUsage.count();
      console.log(`✅ AIImageUsage table accessible - ${usageCount} records`);
    } catch (error) {
      console.log(`❌ AIImageUsage table test failed: ${error}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('Your AI image storage system should now work in production.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateMissingTables().catch(console.error);