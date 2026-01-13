#!/usr/bin/env tsx

/**
 * Script to check for server errors and API issues
 */

console.log('🔍 Checking for server errors and API issues...\n')

async function checkHealthEndpoint() {
  console.log('1. 🏥 Testing health endpoint...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health')
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Health endpoint working:', data)
    } else {
      console.log('   ❌ Health endpoint failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('   ❌ Health endpoint error:', error.message)
  }
}

async function checkDatabaseConnection() {
  console.log('\n2. 🗄️ Testing database connection...')
  
  try {
    const response = await fetch('http://localhost:3000/api/debug/database')
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Database connection working')
      console.log('   📊 Database info:', {
        status: data.status,
        tablesCount: data.tables?.length || 'unknown'
      })
    } else {
      console.log('   ❌ Database connection failed:', response.status, response.statusText)
      const errorData = await response.text()
      console.log('   📝 Error details:', errorData)
    }
  } catch (error) {
    console.log('   ❌ Database connection error:', error.message)
  }
}

async function checkAuthenticationAPI() {
  console.log('\n3. 🔐 Testing authentication APIs...')
  
  // Test signin page
  try {
    const response = await fetch('http://localhost:3000/auth/signin')
    
    if (response.ok) {
      console.log('   ✅ Signin page accessible')
    } else {
      console.log('   ❌ Signin page failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('   ❌ Signin page error:', error.message)
  }
}

async function checkDashboardAPIs() {
  console.log('\n4. 📊 Testing dashboard APIs...')
  
  const dashboardAPIs = [
    '/api/super-admin/dashboard-stats',
    '/api/school-admin/dashboard-stats',
    '/api/teacher/dashboard-stats',
    '/api/student/dashboard-stats'
  ]
  
  for (const api of dashboardAPIs) {
    try {
      const response = await fetch(`http://localhost:3000${api}`)
      
      if (response.status === 401) {
        console.log(`   ⚠️  ${api}: Authentication required (expected)`)
      } else if (response.ok) {
        console.log(`   ✅ ${api}: Working`)
      } else {
        console.log(`   ❌ ${api}: Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`   ❌ ${api}: Error - ${error.message}`)
    }
  }
}

async function checkBillingAPIs() {
  console.log('\n5. 💳 Testing billing APIs...')
  
  const billingAPIs = [
    '/api/billing',
    '/api/subscription/status'
  ]
  
  for (const api of billingAPIs) {
    try {
      const response = await fetch(`http://localhost:3000${api}`)
      
      if (response.status === 401) {
        console.log(`   ⚠️  ${api}: Authentication required (expected)`)
      } else if (response.ok) {
        console.log(`   ✅ ${api}: Working`)
      } else {
        console.log(`   ❌ ${api}: Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`   ❌ ${api}: Error - ${error.message}`)
    }
  }
}

async function checkAIAPIs() {
  console.log('\n6. 🤖 Testing AI APIs...')
  
  const aiAPIs = [
    '/api/ai/generate-content',
    '/api/ai/generate-image',
    '/api/ai/generate-rubric'
  ]
  
  for (const api of aiAPIs) {
    try {
      const response = await fetch(`http://localhost:3000${api}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      if (response.status === 401) {
        console.log(`   ⚠️  ${api}: Authentication required (expected)`)
      } else if (response.status === 400) {
        console.log(`   ⚠️  ${api}: Bad request (expected for test data)`)
      } else if (response.ok) {
        console.log(`   ✅ ${api}: Working`)
      } else {
        console.log(`   ❌ ${api}: Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`   ❌ ${api}: Error - ${error.message}`)
    }
  }
}

async function checkEnvironmentVariables() {
  console.log('\n7. 🌍 Checking environment variables...')
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  const optionalEnvVars = [
    'OPENROUTER_API_KEY',
    'STABILITY_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ]
  
  console.log('   📋 Required variables:')
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`)
    } else {
      console.log(`   ❌ ${envVar}: Missing`)
    }
  }
  
  console.log('   📋 Optional variables:')
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`)
    } else {
      console.log(`   ⚠️  ${envVar}: Not set`)
    }
  }
}

async function checkServerStatus() {
  console.log('\n8. 🖥️ Checking server status...')
  
  try {
    const response = await fetch('http://localhost:3000')
    
    if (response.ok) {
      console.log('   ✅ Server is running and accessible')
      console.log('   🌐 Homepage loads successfully')
    } else {
      console.log('   ❌ Server responded with error:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('   ❌ Server connection failed:', error.message)
    console.log('   💡 Make sure the development server is running: npm run dev')
  }
}

async function runDiagnostics() {
  console.log('🚀 Server Error Diagnostic Check...\n')
  
  await checkServerStatus()
  await checkHealthEndpoint()
  await checkDatabaseConnection()
  await checkAuthenticationAPI()
  await checkDashboardAPIs()
  await checkBillingAPIs()
  await checkAIAPIs()
  await checkEnvironmentVariables()
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:')
  console.log('=' .repeat(60))
  console.log('🔍 Server error check completed')
  console.log('📝 Review the results above for any issues')
  console.log('⚠️  401 errors are expected for protected routes')
  console.log('❌ Any other errors should be investigated')
  
  console.log('\n💡 COMMON ISSUES TO CHECK:')
  console.log('- Ensure development server is running (npm run dev)')
  console.log('- Check database connection and migrations')
  console.log('- Verify environment variables are set')
  console.log('- Check for TypeScript compilation errors')
  console.log('- Review console logs for detailed error messages')
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Fix any ❌ errors found above')
  console.log('2. Check browser console for client-side errors')
  console.log('3. Review server logs for detailed error information')
  console.log('4. Test specific functionality that may be failing')
}

runDiagnostics().catch(console.error)