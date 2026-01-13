#!/usr/bin/env tsx

/**
 * Simple test to check if OpenAI API key is working
 */

async function testOpenAIKey() {
  console.log('🔑 Testing OpenAI API Key...\n')

  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY is not set')
    return false
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from ElimuNova AI!" and nothing else.'
          }
        ],
        max_tokens: 50
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ OpenAI API is working!')
      console.log(`   Response: ${data.choices[0].message.content}`)
      return true
    } else {
      const error = await response.json()
      console.log('❌ OpenAI API Error:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${JSON.stringify(error, null, 2)}`)
      return false
    }

  } catch (error) {
    console.error('❌ Network Error:', error)
    return false
  }
}

testOpenAIKey().then(success => {
  if (success) {
    console.log('\n🎉 OpenAI API is working correctly!')
  } else {
    console.log('\n⚠️  OpenAI API issues found - check the errors above')
  }
})