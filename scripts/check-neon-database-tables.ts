/**
 * Check Neon Database Tables for AI Image Storage
 * This script will verify if all required tables exist in production
 */

import { PrismaClient } from '@prisma/client';

async function checkNeonDatabaseTables() {
  console.log('🔍 Checking Neon Database Tables...\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_4dCrxETYqoX9@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Neon database successfully\n');

    // Check for AI Image related tables
    console.log('📋 Checking AI Image Storage Tables...\n');

    // Check AIGeneratedImage table (not AIImage)
    try {
      const aiImageCount = await prisma.aIGeneratedImage.count();
      console.log(`✅ AIGeneratedImage table exists - ${aiImageCount} records`);
      
      // Get sample AI images
      const sampleImages = await prisma.aIGeneratedImage.findMany({
        take: 3,
        select: {
          id: true,
          prompt: true,
          storedUrl: true,
          createdAt: true,
          userId: true
        }
      });
      
      if (sampleImages.length > 0) {
        console.log('   Sample AI Images:');
        sampleImages.forEach(img => {
          console.log(`   - ID: ${img.id}, Prompt: "${img.prompt?.substring(0, 50)}...", URL: ${img.storedUrl ? 'Present' : 'Missing'}`);
        });
      } else {
        console.log('   ⚠️  No AI images found in database');
      }
    } catch (error) {
      console.log(`❌ AIGeneratedImage table missing or inaccessible: ${error}`);
    }

    // Check Presentation table
    try {
      const presentationCount = await prisma.presentation.count();
      console.log(`✅ Presentation table exists - ${presentationCount} records`);
    } catch (error) {
      console.log(`❌ Presentation table missing: ${error}`);
    }

    // Check User table
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists - ${userCount} records`);
    } catch (error) {
      console.log(`❌ User table missing: ${error}`);
    }

    // Check School table
    try {
      const schoolCount = await prisma.school.count();
      console.log(`✅ School table exists - ${schoolCount} records`);
    } catch (error) {
      console.log(`❌ School table missing: ${error}`);
    }

    // Check all tables in database
    console.log('\n📊 All Tables in Database:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as Array<{table_name: string}>;

    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check if AIGeneratedImage table has correct structure
    console.log('\n🔍 AIGeneratedImage Table Structure:');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'ai_generated_images' 
        ORDER BY ordinal_position;
      ` as Array<{column_name: string, data_type: string, is_nullable: string}>;

      if (columns.length > 0) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      } else {
        console.log('   ❌ AIGeneratedImage table structure not found');
      }
    } catch (error) {
      console.log(`   ❌ Could not check AIGeneratedImage structure: ${error}`);
    }

    // Test AI image API endpoint simulation
    console.log('\n🧪 Testing AI Image Data Access...');
    try {
      const recentImages = await prisma.aIGeneratedImage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`✅ Successfully queried ${recentImages.length} recent AI images`);
      
      if (recentImages.length > 0) {
        console.log('   Recent images:');
        recentImages.forEach(img => {
          console.log(`   - "${img.prompt?.substring(0, 40)}..." by ${img.user?.firstName || 'Unknown'}`);
        });
      }
    } catch (error) {
      console.log(`❌ Failed to query AI images: ${error}`);
    }

  } catch (error) {
    console.log(`❌ Database connection failed: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkNeonDatabaseTables().catch(console.error);