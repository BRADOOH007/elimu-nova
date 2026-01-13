/**
 * Diagnose Production Error - HTTP 500 Failed to generate image
 */

async function diagnoseProductionError() {
  console.log('🔍 Diagnosing Production Error: HTTP 500 Failed to generate image\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables...');
  const requiredVars = [
    'OPENAI_API_KEY',
    'DATABASE_URL', 
    'NEXTAUTH_SECRET',
    'BLOB_READ_WRITE_TOKEN'
  ];

  const missingVars: string[] = [];
  const presentVars: string[] = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('your-')) {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
    }
  });

  console.log('✅ Present variables:');
  presentVars.forEach(varName => {
    const value = process.env[varName]!;
    const masked = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value.substring(0, 50) + '...';
    console.log(`   ${varName}: ${masked}`);
  });

  if (missingVars.length > 0) {
    console.log('\n❌ Missing variables:');
    missingVars.forEach(varName => console.log(`   ${varName}`));
  }

  // Test OpenAI API
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-')) {
    console.log('\n🤖 Testing OpenAI API Key...');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ OpenAI API key is valid');
      } else {
        console.log(`❌ OpenAI API key failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ OpenAI API connection error: ${error}`);
    }
  }

  // Provide solutions
  console.log('\n💡 Most Likely Cause:');
  if (missingVars.includes('BLOB_READ_WRITE_TOKEN')) {
    console.log('❌ BLOB_READ_WRITE_TOKEN is missing from Vercel environment variables');
    console.log('\n🔧 Solution:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Select your ElimuNova project');
    console.log('3. Go to Settings → Environment Variables');
    console.log('4. Add: BLOB_READ_WRITE_TOKEN (leave value empty - Vercel auto-generates)');
    console.log('5. Select Production, Preview, Development');
    console.log('6. Redeploy your application');
  } else if (missingVars.length > 0) {
    console.log(`❌ Missing ${missingVars.length} environment variables`);
    console.log('\n🔧 Add these to Vercel:');
    missingVars.forEach(varName => {
      console.log(`   ${varName}`);
    });
  } else {
    console.log('✅ All environment variables are present locally');
    console.log('❌ But they might not be set in Vercel production');
    console.log('\n🔧 Solution:');
    console.log('1. Verify all variables are set in Vercel Dashboard');
    console.log('2. Redeploy with fresh build cache');
  }

  console.log('\n📊 Status Summary:');
  console.log(`Present: ${presentVars.length}/${requiredVars.length} variables`);
  console.log(`Missing: ${missingVars.length} variables`);
}

diagnoseProductionError().catch(console.error);