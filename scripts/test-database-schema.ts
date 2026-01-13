/**
 * Test Database Schema for AI Images
 * Check if the new AI image tables exist in the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseSchema() {
  console.log('🧪 Testing Database Schema for AI Images...\n')

  try {
    // Test 1: Check if AIGeneratedImage table exists
    console.log('1️⃣ Testing AIGeneratedImage table...')
    try {
      const count = await prisma.aIGeneratedImage.count()
      console.log(`   ✅ AIGeneratedImage table exists (${count} records)`)
    } catch (error) {
      console.log('   ❌ AIGeneratedImage table does not exist or has issues')
      console.log('   Error:', error)
    }

    // Test 2: Check if AIImageUsage table exists
    console.log('\n2️⃣ Testing AIImageUsage table...')
    try {
      const count = await prisma.aIImageUsage.count()
      console.log(`   ✅ AIImageUsage table exists (${count} records)`)
    } catch (error) {
      console.log('   ❌ AIImageUsage table does not exist or has issues')
      console.log('   Error:', error)
    }

    // Test 3: Test basic database connection
    console.log('\n3️⃣ Testing basic database connection...')
    try {
      const userCount = await prisma.user.count()
      console.log(`   ✅ Database connection working (${userCount} users)`)
    } catch (error) {
      console.log('   ❌ Database connection failed')
      console.log('   Error:', error)
    }

    console.log('\n📋 Schema Status Check Complete')
    console.log('\n💡 If tables are missing, run:')
    console.log('   npx prisma db push')
    console.log('   or')
    console.log('   npx prisma migrate dev')

  } catch (error) {
    console.error('❌ Schema test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabaseSchema()