import { PrismaClient } from '@prisma/client'

const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkNeonTables() {
  console.log('🔍 Checking actual Neon database tables...')
  
  try {
    // Get all tables
    const tables = await neonPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    ` as any[]

    console.log(`\n📋 Found ${tables.length} tables in Neon:`)
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })

    // Check subscription table structure specifically
    console.log('\n🔍 Checking subscription table structure...')
    try {
      const subscriptionColumns = await neonPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      ` as any[]
      
      console.log(`\n📊 Subscription table columns (${subscriptionColumns.length}):`)
      subscriptionColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
      })
    } catch (error) {
      console.error('❌ Failed to check subscription table:', error)
    }

    // Check user table structure
    console.log('\n🔍 Checking user table structure...')
    try {
      const userColumns = await neonPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      ` as any[]
      
      console.log(`\n👤 User table columns (${userColumns.length}):`)
      userColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
      })
    } catch (error) {
      console.error('❌ Failed to check user table:', error)
    }

  } catch (error) {
    console.error('❌ Failed to check Neon tables:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

checkNeonTables()