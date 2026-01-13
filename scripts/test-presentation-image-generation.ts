#!/usr/bin/env tsx

/**
 * Test script to verify presentation image generation
 */

import { imageGenerationService } from '../src/lib/image-generation'

async function testPresentationImageGeneration() {
  console.log('🖼️ Testing Presentation Image Generation...\n')

  try {
    // Test 1: Basic image generation
    console.log('📝 Test 1: Basic Image Generation')
    const testPrompt = 'Educational illustration showing photosynthesis process in plants, with sunlight, water, and carbon dioxide arrows, suitable for grade 5 students'
    
    console.log('Prompt:', testPrompt)
    console.log('Generating image...')
    
    const result = await imageGenerationService.generateImage({
      prompt: testPrompt,
      style: 'natural',
      size: '1024x1024'
    })

    console.log('✅ Image generated successfully!')
    console.log('URL:', result.url)
    console.log('Provider:', result.provider)
    console.log()

    // Test 2: Educational image generation
    console.log('📚 Test 2: Educational Image Generation')
    const educationalResult = await imageGenerationService.generateEducationalImage(
      'Science',
      'Photosynthesis',
      'Diagram showing how plants convert sunlight into energy',
      'Grade 5',
      { style: 'natural', size: '1024x1024' }
    )

    console.log('✅ Educational image generated!')
    console.log('URL:', educationalResult.url)
    console.log()

    console.log('🎯 Image Generation Status: WORKING ✅')
    console.log()
    console.log('🔧 Next Steps to Fix Presentation Images:')
    console.log('1. ✅ Image generation service is working')
    console.log('2. 🔍 Check if images are being generated during presentation creation')
    console.log('3. 🔍 Verify images are being embedded in PowerPoint slides')
    console.log('4. 🔍 Check if generateImages flag is being passed correctly')

  } catch (error) {
    console.error('❌ Image generation test failed:', error)
    
    console.log('\n🔧 Possible Issues:')
    console.log('• Missing OPENAI_API_KEY in environment variables')
    console.log('• Network connectivity issues')
    console.log('• OpenAI API quota exceeded')
    console.log('• Invalid API key')
  }
}

// Run the test
testPresentationImageGeneration().catch(console.error)