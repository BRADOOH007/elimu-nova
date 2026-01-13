/**
 * Add Missing Columns to Neon Database
 * This will add the visibility column that's missing from ai_generated_content table
 */

import { PrismaClient } from '@prisma/client';

async function addMissingColumns() {
  console.log('🔧 Adding Missing Columns to Neon Database...\n');

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

    // Check if ai_generated_content table exists
    console.log('📋 Checking ai_generated_content table...');
    try {
      const count = await prisma.aIGeneratedContent.count();
      console.log(`✅ ai_generated_content table exists with ${count} records`);
    } catch (error) {
      console.log('❌ ai_generated_content table not found:', error);
      return;
    }

    // Check current columns
    console.log('\n🔍 Checking current table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_generated_content' 
      ORDER BY ordinal_position;
    ` as Array<{column_name: string, data_type: string, is_nullable: string, column_default: string}>;

    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if visibility column exists
    const hasVisibility = columns.some(col => col.column_name === 'visibility');
    const hasPptxUrl = columns.some(col => col.column_name === 'pptxUrl');
    const hasShareToken = columns.some(col => col.column_name === 'shareToken');
    const hasClassId = columns.some(col => col.column_name === 'classId');

    console.log(`\n📊 Missing columns check:`);
    console.log(`   visibility: ${hasVisibility ? '✅ exists' : '❌ missing'}`);
    console.log(`   pptxUrl: ${hasPptxUrl ? '✅ exists' : '❌ missing'}`);
    console.log(`   shareToken: ${hasShareToken ? '✅ exists' : '❌ missing'}`);
    console.log(`   classId: ${hasClassId ? '✅ exists' : '❌ missing'}`);

    // Add missing columns
    if (!hasVisibility) {
      console.log('\n🔧 Adding visibility column...');
      await prisma.$executeRaw`
        ALTER TABLE "ai_generated_content" 
        ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';
      `;
      console.log('✅ Added visibility column');
    }

    if (!hasPptxUrl) {
      console.log('\n🔧 Adding pptxUrl column...');
      await prisma.$executeRaw`
        ALTER TABLE "ai_generated_content" 
        ADD COLUMN "pptxUrl" TEXT;
      `;
      console.log('✅ Added pptxUrl column');
    }

    if (!hasShareToken) {
      console.log('\n🔧 Adding shareToken column...');
      await prisma.$executeRaw`
        ALTER TABLE "ai_generated_content" 
        ADD COLUMN "shareToken" TEXT;
      `;
      console.log('✅ Added shareToken column');
    }

    if (!hasClassId) {
      console.log('\n🔧 Adding classId column...');
      await prisma.$executeRaw`
        ALTER TABLE "ai_generated_content" 
        ADD COLUMN "classId" TEXT;
      `;
      console.log('✅ Added classId column');

      // Add foreign key constraint
      try {
        await prisma.$executeRaw`
          ALTER TABLE "ai_generated_content" 
          ADD CONSTRAINT "ai_generated_content_classId_fkey" 
          FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `;
        console.log('✅ Added classId foreign key constraint');
      } catch (error) {
        console.log('⚠️  Could not add foreign key constraint (classes table might not exist)');
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying updated table structure...');
    const updatedColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_generated_content' 
      ORDER BY ordinal_position;
    ` as Array<{column_name: string, data_type: string, is_nullable: string, column_default: string}>;

    console.log('Updated columns:');
    updatedColumns.forEach(col => {
      const isNew = !columns.some(oldCol => oldCol.column_name === col.column_name);
      const marker = isNew ? '🆕' : '   ';
      console.log(`${marker} ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test the table
    console.log('\n🧪 Testing updated table...');
    try {
      const testCount = await prisma.aIGeneratedContent.count();
      console.log(`✅ Table is working correctly - ${testCount} records`);
    } catch (error) {
      console.log('❌ Table test failed:', error);
    }

    console.log('\n🎉 Database schema update completed successfully!');
    console.log('Your presentation generation should now work without errors.');

  } catch (error) {
    console.error('❌ Schema update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
addMissingColumns().catch(console.error);