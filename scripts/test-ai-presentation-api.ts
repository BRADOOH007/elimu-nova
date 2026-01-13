#!/usr/bin/env tsx

/**
 * Test script to directly test the AI presentation generation API
 */

async function testAIPresentationAPI() {
  console.log('🧪 Testing AI Presentation Generation API...\n')

  try {
    const testData = {
      subject: 'Science',
      grade: 'Grade 5',
      topic: 'Photosynthesis',
      duration: 45,
      slideCount: 6,
      difficulty: 'medium'
    }

    console.log('📝 Test Data:', testData)
    console.log()

    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/ai/generate-simple-presentation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return
    }

    const data = await response.json()
    console.log('\n✅ API Response:')
    console.log('Success:', data.success)
    console.log('Title:', data.presentation?.title)
    console.log('Slide Count:', data.presentation?.slideCount)
    console.log('Slides Length:', data.presentation?.slides?.length)

    if (data.presentation?.slides) {
      console.log('\n📋 Generated Slides:')
      data.presentation.slides.forEach((slide: any, index: number) => {
        console.log(`\nSlide ${index + 1}:`)
        console.log('  Title:', slide.title)
        console.log('  Content Points:', slide.content?.length || 0)
        console.log('  Speaker Notes:', slide.speakerNotes ? 'Yes' : 'No')
        console.log('  Image Description:', slide.imageDescription ? 'Yes' : 'No')
      })
    }

    if (data.presentation?.content) {
      console.log('\n📄 Raw AI Content (first 500 chars):')
      console.log(data.presentation.content.substring(0, 500) + '...')
    }

  } catch (error) {
    console.error('❌ Test Error:', error)
  }
}

// Run the test
testAIPresentationAPI().catch(console.error)