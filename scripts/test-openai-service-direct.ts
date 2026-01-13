import { config } from 'dotenv';
config();

async function testOpenAIServiceDirect() {
  console.log('🧪 Testing OpenAI Service Directly');
  console.log('==================================');

  try {
    // Test 1: Check environment variable
    console.log('\n1. Checking environment variables...');
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`✅ OPENAI_API_KEY: ${apiKey ? 'Set' : 'Missing'}`);
    
    if (!apiKey) {
      console.log('❌ OpenAI API key is missing');
      return;
    }

    // Test 2: Import and test OpenAI service
    console.log('\n2. Testing OpenAI service import...');
    
    try {
      const { OpenAIService } = await import('../src/lib/openai-service');
      console.log('✅ OpenAI service imported successfully');

      // Test 3: Simple text generation
      console.log('\n3. Testing simple text generation...');
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful educational assistant.'
        },
        {
          role: 'user' as const,
          content: 'Write a simple lesson objective for teaching addition to grade 2 students.'
        }
      ];

      const result = await OpenAIService.generateText(messages, {
        maxTokens: 100,
        temperature: 0.7
      });

      console.log('✅ Text generation successful');
      console.log(`📊 Generated text length: ${result.length} characters`);
      console.log(`📝 Sample: ${result.substring(0, 100)}...`);

    } catch (importError) {
      console.log('❌ OpenAI service import failed:', importError);
      return;
    }

    // Test 4: Test lesson plan generation directly
    console.log('\n4. Testing lesson plan generation logic...');
    
    const lessonPlanMessages = [
      {
        role: 'system' as const,
        content: 'You are an expert educational consultant specializing in creating detailed, practical lesson plans.'
      },
      {
        role: 'user' as const,
        content: `Create a simple lesson plan for:
Subject: Mathematics
Grade: Grade 3
Topic: Basic Addition
Duration: 30 minutes

Include:
1. Learning objectives
2. Materials needed
3. Main activities
4. Assessment`
      }
    ];

    const { OpenAIService } = await import('../src/lib/openai-service');
    const lessonPlan = await OpenAIService.generateText(lessonPlanMessages, {
      maxTokens: 500,
      temperature: 0.7
    });

    console.log('✅ Lesson plan generation successful');
    console.log(`📊 Generated lesson plan length: ${lessonPlan.length} characters`);
    
    // Check for key elements
    const hasObjectives = lessonPlan.toLowerCase().includes('objective');
    const hasMaterials = lessonPlan.toLowerCase().includes('material');
    const hasActivities = lessonPlan.toLowerCase().includes('activit');
    
    console.log(`📋 Content check:`);
    console.log(`   - Contains objectives: ${hasObjectives ? '✅' : '❌'}`);
    console.log(`   - Contains materials: ${hasMaterials ? '✅' : '❌'}`);
    console.log(`   - Contains activities: ${hasActivities ? '✅' : '❌'}`);

    console.log('\n📝 Generated lesson plan preview:');
    console.log(lessonPlan.substring(0, 300) + '...');

    console.log('\n🎉 OpenAI Service Direct Test Results:');
    console.log('=====================================');
    console.log('✅ Environment variables configured');
    console.log('✅ OpenAI service imports correctly');
    console.log('✅ Text generation working');
    console.log('✅ Lesson plan generation working');
    console.log('\n📝 The OpenAI service is working correctly!');
    console.log('The issue might be with authentication or API routing.');

  } catch (error) {
    console.error('❌ Direct test failed:', error);
    
    if (error instanceof Error) {
      console.log(`\n🔍 Error details: ${error.message}`);
      
      if (error.message.includes('API key')) {
        console.log('- Check your OpenAI API key is valid');
        console.log('- Verify the API key has sufficient credits');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('- Check your internet connection');
        console.log('- Verify OpenAI API is accessible');
      }
    }
  }
}

testOpenAIServiceDirect();