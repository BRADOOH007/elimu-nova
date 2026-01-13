import { config } from 'dotenv'
config()

async function testOpenAIDirect() {
  console.log('🔍 Testing OpenAI API directly...')
  
  try {
    const { OpenAIService } = await import('../src/lib/openai-service')
    
    // Test basic text generation
    console.log('1. Testing basic text generation...')
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert educational consultant specializing in creating detailed, practical lesson plans.'
      },
      {
        role: 'user' as const,
        content: `Create a detailed lesson plan for:
Subject: Mathematics
Grade: Grade 8
Topic: Quadratic Equations
Duration: 45 minutes
Learning Objectives: Understand quadratic equations, Solve basic quadratic equations

Please create a comprehensive lesson plan that includes:
1. Lesson Information
2. Learning Objectives
3. Materials Needed
4. Lesson Activities (with timing)
5. Assessment Strategies
6. Homework/Extension Activities
7. Teacher Notes`
      }
    ]
    
    const result = await OpenAIService.generateText(messages, {
      maxTokens: 2000,
      temperature: 0.7
    })
    
    console.log('✅ Lesson plan generated successfully!')
    console.log('📊 Content length:', result.length)
    console.log('📝 Sample content preview:')
    console.log(result.substring(0, 500) + '...')
    
    // Test Kiswahili generation
    console.log('\n2. Testing Kiswahili lesson plan generation...')
    const kiswahiliMessages = [
      {
        role: 'system' as const,
        content: 'You are an expert educational consultant specializing in creating detailed, practical lesson plans in Swahili language. CRITICAL: Always respond entirely in Swahili language for Kiswahili subjects.'
      },
      {
        role: 'user' as const,
        content: `IMPORTANT: Generate this lesson plan entirely in Swahili language. All content, instructions, and explanations should be in Swahili.

Create a detailed lesson plan for:
Subject: Kiswahili
Grade: Darasa la 6
Topic: Utungaji wa Mashairi
Duration: 40 minutes
Learning Objectives: Kuelewa jinsi ya kutunga mashairi, Kutumia vina na mizani

Please create a comprehensive lesson plan in Swahili.`
      }
    ]
    
    const kiswahiliResult = await OpenAIService.generateText(kiswahiliMessages, {
      maxTokens: 2000,
      temperature: 0.7
    })
    
    console.log('✅ Kiswahili lesson plan generated successfully!')
    console.log('📊 Content length:', kiswahiliResult.length)
    console.log('🌍 Language check:', kiswahiliResult.includes('Somo') || kiswahiliResult.includes('Darasa') ? '✅ Contains Swahili content' : '⚠️ May not be in Swahili')
    console.log('📝 Kiswahili content preview:')
    console.log(kiswahiliResult.substring(0, 500) + '...')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testOpenAIDirect()