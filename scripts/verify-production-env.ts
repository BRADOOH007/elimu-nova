/**
 * Production Environment Variables Verification Script
 * Run this after setting up Vercel environment variables
 */

async function verifyProductionEnvironment() {
  console.log('🔍 Verifying Production Environment Variables...\n');

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  const results = {
    present: [] as string[],
    missing: [] as string[],
    invalid: [] as string[]
  };

  // Check each required variable
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      results.missing.push(varName);
      continue;
    }

    if (value.includes('your-') || value.includes('replace-') || value.includes('here')) {
      results.invalid.push(varName);
      continue;
    }

    results.present.push(varName);
  }

  // Display results
  console.log('✅ PRESENT VARIABLES:');
  results.present.forEach(var => {
    const value = process.env[var]!;
    const masked = var.includes('KEY') || var.includes('SECRET') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`   ${var}: ${masked}`);
  });

  if (results.missing.length > 0) {
    console.log('\n❌ MISSING VARIABLES:');
    results.missing.forEach(var => console.log(`   ${var}`));
  }

  if (results.invalid.length > 0) {
    console.log('\n⚠️  INVALID/PLACEHOLDER VARIABLES:');
    results.invalid.forEach(var => console.log(`   ${var}: ${process.env[var]}`));
  }

  // Test OpenAI API connection
  if (results.present.includes('OPENAI_API_KEY')) {
    console.log('\n🤖 Testing OpenAI API Connection...');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ OpenAI API: Connected successfully');
      } else {
        console.log(`❌ OpenAI API: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ OpenAI API: Connection error - ${error}`);
    }
  }

  // Test Database connection
  if (results.present.includes('DATABASE_URL')) {
    console.log('\n🗄️  Testing Database Connection...');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      console.log('✅ Database: Connected successfully');
      await prisma.$disconnect();
    } catch (error) {
      console.log(`❌ Database: Connection failed - ${error}`);
    }
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Present: ${results.present.length}/${requiredVars.length}`);
  console.log(`❌ Missing: ${results.missing.length}`);
  console.log(`⚠️  Invalid: ${results.invalid.length}`);

  const isReady = results.missing.length === 0 && results.invalid.length === 0;
  console.log(`\n🚀 Production Ready: ${isReady ? 'YES' : 'NO'}`);

  if (!isReady) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Add missing variables to Vercel');
    console.log('2. Replace placeholder values with real ones');
    console.log('3. Redeploy your application');
    console.log('4. Run this script again to verify');
  } else {
    console.log('\n🎉 All environment variables are properly configured!');
    console.log('Your AI Tools should now work in production.');
  }
}

// Run verification
verifyProductionEnvironment().catch(console.error);