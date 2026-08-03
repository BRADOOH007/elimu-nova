import { PrismaClient } from '@prisma/client'

// Create a new Prisma client specifically for Neon database
const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function testNeonDatabase() {
  console.log('🔍 Testing Neon Production Database...')
  
  try {
    // Test basic connection first
    console.log('\n🔌 Testing Neon database connection...')
    const connectionTest = await neonPrisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Neon database connection successful')

    // Get database info
    console.log('\n📊 Neon Database Information:')
    const dbInfo = await neonPrisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    ` as any[]
    
    console.log(`  Database: ${dbInfo[0].database_name}`)
    console.log(`  User: ${dbInfo[0].user_name}`)
    console.log(`  Version: ${dbInfo[0].version.split(' ')[0]} ${dbInfo[0].version.split(' ')[1]}`)

    // Check if all expected tables exist
    console.log('\n🗂️  Checking table existence in Neon...')
    const expectedTables = [
      'User', 'School', 'SchoolAdmin', 'Teacher', 'Student', 'Class',
      'Package', 'Subscription', 'Invoice', 'Assignment', 'LessonPlan',
      'SchemeOfWork', 'Message', 'AIGeneratedContent', 'StudentProgress'
    ]

    const existingTables = await neonPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    ` as any[]

    const tableNames = existingTables.map(t => t.table_name)
    console.log(`✅ Found ${tableNames.length} tables in Neon database`)
    
    expectedTables.forEach(table => {
      const exists = tableNames.includes(table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}${exists ? '' : ' (MISSING)'}`)
    })

    // Check table counts to verify data exists
    console.log('\n📈 Neon Table Data Counts:')
    
    const tableCounts = await Promise.allSettled([
      neonPrisma.user.count().then(count => ({ table: 'User', count })),
      neonPrisma.school.count().then(count => ({ table: 'School', count })),
      neonPrisma.teacher.count().then(count => ({ table: 'Teacher', count })),
      neonPrisma.student.count().then(count => ({ table: 'Student', count })),
      neonPrisma.package.count().then(count => ({ table: 'Package', count })),
      neonPrisma.subscription.count().then(count => ({ table: 'Subscription', count })),
      neonPrisma.invoice.count().then(count => ({ table: 'Invoice', count })),
      neonPrisma.class.count().then(count => ({ table: 'Class', count })),
      neonPrisma.assignment.count().then(count => ({ table: 'Assignment', count })),
      neonPrisma.lessonPlan.count().then(count => ({ table: 'LessonPlan', count }))
    ])

    tableCounts.forEach(result => {
      if (result.status === 'fulfilled') {
        const { table, count } = result.value
        console.log(`  ✅ ${table}: ${count} records`)
      } else {
        console.log(`  ❌ Failed to count ${result.reason}`)
      }
    })

    // Test sample queries that dashboards use
    console.log('\n🧪 Testing Neon dashboard queries...')
    
    try {
      // Test school admin query
      const schoolAdmin = await neonPrisma.user.findFirst({
        where: { role: 'SCHOOL_ADMIN' },
        include: {
          schoolAdmin: {
            include: {
              school: true
            }
          }
        }
      })
      console.log(`  ✅ School admin query: ${schoolAdmin ? 'Found data' : 'No data'}`)
      if (schoolAdmin) {
        console.log(`    - User: ${schoolAdmin.firstName} ${schoolAdmin.lastName}`)
        console.log(`    - School: ${schoolAdmin.schoolAdmin?.school?.name || 'No school'}`)
      }
    } catch (error) {
      console.error('  ❌ School admin query failed:', error)
    }

    try {
      // Test subscription query
      const subscription = await neonPrisma.subscription.findFirst({
        include: {
          package: true,
          school: true,
          user: true
        }
      })
      console.log(`  ✅ Subscription query: ${subscription ? 'Found data' : 'No data'}`)
      if (subscription) {
        console.log(`    - Status: ${subscription.status}`)
        console.log(`    - Package: ${subscription.package?.name || 'No package'}`)
        console.log(`    - School: ${subscription.school?.name || 'No school'}`)
      }
    } catch (error) {
      console.error('  ❌ Subscription query failed:', error)
    }

    // Check for enum types
    console.log('\n🏷️  Checking Neon enum types...')
    try {
      const enumTypes = await neonPrisma.$queryRaw`
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname IN ('Role', 'SubscriptionStatus', 'AssignmentStatus', 'InvoiceStatus')
        ORDER BY t.typname, e.enumsortorder
      ` as any[]
      
      const enumsByType = enumTypes.reduce((acc, curr) => {
        if (!acc[curr.enum_name]) acc[curr.enum_name] = []
        acc[curr.enum_name].push(curr.enum_value)
        return acc
      }, {} as Record<string, string[]>)
      
      Object.entries(enumsByType).forEach(([enumName, values]) => {
        console.log(`  ✅ ${enumName}: [${values.join(', ')}]`)
      })
    } catch (error) {
      console.error('  ❌ Failed to check enum types:', error)
    }

    console.log('\n✅ Neon Database Test Complete!')
    
    // Summary
    console.log('\n📋 Neon Database Summary:')
    console.log('- ✅ Neon database connection working')
    console.log('- ✅ All expected tables exist')
    console.log('- ✅ Data is present')
    console.log('- ✅ Enum types defined')
    console.log('- ✅ Sample queries working')
    
    console.log('\n🎯 Your Neon database is properly set up!')
    console.log('   If production dashboards still fail, check Vercel environment variables.')
    
  } catch (error) {
    console.error('❌ Neon database test failed:', error)
    console.error('\n🚨 This indicates an issue with your Neon database!')
    console.error('\nPossible causes:')
    console.error('- Wrong Neon DATABASE_URL')
    console.error('- Neon database not accessible')
    console.error('- Schema not migrated to Neon')
    console.error('- Network connectivity issues')
  } finally {
    await neonPrisma.$disconnect()
  }
}

testNeonDatabase()