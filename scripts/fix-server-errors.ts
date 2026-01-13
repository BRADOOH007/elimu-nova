#!/usr/bin/env tsx

/**
 * Script to identify and fix server errors after OpenAI migration
 */

console.log('🔧 Fixing Server Errors After OpenAI Migration...\n')

async function checkServerStatus() {
  console.log('1. 🖥️ Checking server status...')
  
  try {
    const response = await fetch('http://localhost:3000')
    if (response.ok) {
      console.log('✅ Server is running and accessible')
      return true
    } else {
      console.log(`❌ Server returned status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Server is not accessible:', error instanceof Error ? error.message : error)
    return false
  }
}

async function testHealthEndpoint() {
  console.log('\n2. 🏥 Testing health endpoint...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Health endpoint working:', data)
      return true
    } else {
      console.log(`❌ Health endpoint failed: ${response.status}`)
      const text = await response.text()
      console.log('   Error details:', text.substring(0, 200) + '...')
      return false
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error instanceof Error ? error.message : error)
    return false
  }
}

async function testDatabaseConnection() {
  console.log('\n3. 🗄️ Testing database connection...')
  
  try {
    const response = await fetch('http://localhost:3000/api/debug/database')
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Database connection working')
      return true
    } else {
      console.log(`❌ Database connection failed: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Database connection error:', error instanceof Error ? error.message : error)
    return false
  }
}

async function testAIEndpoints() {
  console.log('\n4. 🤖 Testing AI endpoints...')
  
  const endpoints = [
    '/api/ai/generate-content',
    '/api/ai/generate-image', 
    '/api/ai/generate-rubric'
  ]
  
  let workingCount = 0
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      if (response.status === 401) {
        console.log(`✅ ${endpoint}: Properly protected (401 Unauthorized)`)
        workingCount++
      } else if (response.status === 400) {
        console.log(`✅ ${endpoint}: Working (400 Bad Request - expected for test data)`)
        workingCount++
      } else if (response.ok) {
        console.log(`✅ ${endpoint}: Working (${response.status})`)
        workingCount++
      } else {
        console.log(`❌ ${endpoint}: Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error -`, error instanceof Error ? error.message : error)
    }
  }
  
  return workingCount === endpoints.length
}

async function checkEnvironmentVariables() {
  console.log('\n5. 🔧 Checking environment variables...')
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'NEXTAUTH_URL',
    'OPENAI_API_KEY'
  ]
  
  let allSet = true
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: Set`)
    } else {
      console.log(`❌ ${varName}: Missing`)
      allSet = false
    }
  }
  
  return allSet
}

async function checkForSyntaxErrors() {
  console.log('\n6. 🔍 Checking for syntax errors...')
  
  // This would be done by TypeScript compilation
  console.log('   Run: npx tsc --noEmit to check for TypeScript errors')
  console.log('   Or check the Next.js dev server console for compilation errors')
  
  return true
}

async function provideFixes() {
  console.log('\n7. 🛠️ Recommended Fixes...')
  
  console.log('📋 Common fixes for server errors:')
  console.log('')
  console.log('1. 🔄 Restart the development server:')
  console.log('   - Stop the server (Ctrl+C)')
  console.log('   - Run: npm run dev')
  console.log('')
  console.log('2. 🗄️ Check database connection:')
  console.log('   - Ensure PostgreSQL is running')
  console.log('   - Verify DATABASE_URL in .env')
  console.log('   - Run: npx prisma db push')
  console.log('')
  console.log('3. 🔧 Fix environment variables:')
  console.log('   - Check .env file exists and has all required variables')
  console.log('   - Restart server after changing .env')
  console.log('')
  console.log('4. 📝 Fix syntax errors:')
  console.log('   - Check browser console for compilation errors')
  console.log('   - Run: npx tsc --noEmit')
  console.log('   - Fix any TypeScript errors')
  console.log('')
  console.log('5. 🤖 Test OpenAI integration:')
  console.log('   - Verify OPENAI_API_KEY is valid')
  console.log('   - Test AI endpoints manually')
  console.log('')
}

async function runDiagnostics() {
  console.log('🚀 Server Error Diagnostics After OpenAI Migration\n')
  
  const serverRunning = await checkServerStatus()
  
  if (!serverRunning) {
    console.log('\n❌ Server is not running. Please start it with: npm run dev')
    return
  }
  
  const healthWorking = await testHealthEndpoint()
  const dbWorking = await testDatabaseConnection()
  const aiWorking = await testAIEndpoints()
  const envWorking = await checkEnvironmentVariables()
  await checkForSyntaxErrors()
  await provideFixes()
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:')
  console.log('=' .repeat(50))
  console.log(`🖥️  Server Status: ${serverRunning ? '✅ Running' : '❌ Down'}`)
  console.log(`🏥 Health Endpoint: ${healthWorking ? '✅ Working' : '❌ Failed'}`)
  console.log(`🗄️  Database: ${dbWorking ? '✅ Connected' : '❌ Failed'}`)
  console.log(`🤖 AI Endpoints: ${aiWorking ? '✅ Working' : '❌ Issues'}`)
  console.log(`🔧 Environment: ${envWorking ? '✅ Complete' : '❌ Missing vars'}`)
  
  if (serverRunning && healthWorking && dbWorking && aiWorking && envWorking) {
    console.log('\n🎉 All systems operational!')
    console.log('   OpenAI migration completed successfully.')
  } else {
    console.log('\n⚠️  Some issues found. Please review the fixes above.')
  }
}

runDiagnostics().catch(console.error)