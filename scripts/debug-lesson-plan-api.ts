import { config } from 'dotenv'
config()

async function testLessonPlanAPI() {
  console.log('🔍 Debugging Lesson Plan API...')
  
  // Test OpenAI service directly first
  try {
    console.log('1. Testing OpenAI service directly...')
    const { OpenAIService } = await import('../src/lib/openai-service')
    
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user' as const,
        content: 'Say hello in one sentence.'
      }
    ]
    
    const result = await OpenAIService.generateText(messages, {
      maxTokens: 50,
      temperature: 0.7
    })
    
    console.log('✅ OpenAI service working:', result.substring(0, 100))
  } catch (error) {
    console.error('❌ OpenAI service error:', error)
    return
  }
  
  // Test the API endpoint
  try {
    console.log('2. Testing lesson plan API endpoint...')
    
    const response = await fetch('http://localhost:3000/api/ai/generate-lesson-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session'
      },
      body: JSON.stringify({
        subject: 'Mathematics',
        grade: 'Grade 8',
        topic: 'Quadratic Equations',
        duration: '45',
        objectives: ['Understand quadratic equations', 'Solve basic quadratic equations']
      })
    })
    
    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', data)
    
    if (response.ok) {
      console.log('✅ API working')
    } else {
      console.log('❌ API failed:', data)
    }
  } catch (error) {
    console.error('❌ API test error:', error)
  }
}

testLessonPlanAPI()