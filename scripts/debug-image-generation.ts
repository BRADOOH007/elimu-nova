#!/usr/bin/env tsx

/**
 * Debug script to test image generation step by step
 */

import { OpenAIService } from '../src/lib/openai-service'

async function debugImageGeneration() {
  console.log('🔍 Debugging Image Generation Process...\n')

  try {
    // Test 1: Check OpenAI API key
    console.log('1. 📋 Checking OpenAI API Key...')
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.log('❌ OPENAI_API_KEY not found in environment')
      return
    }
    console.log('✅ OpenAI API key found:', apiKey.substring(0, 20) + '...')
    console.log()

    // Test 2: Try generating a simple image
    console.log('2. 🎨 Testing Image Generation...')
    const testPrompt = 'A simple educational diagram showing a plant with roots, stem, and leaves, suitable for elementary students'
    
    console.log('Prompt:', testPrompt)
    console.log('Generating image...')
    
    const result = await OpenAIService.generateImage({
      prompt: testPrompt,
      style: 'natural',
      size: '1024x1024'
    })

    if (result && result.url) {
      console.log('✅ Image generated successfully!')
      console.log('URL:', result.url)
      console.log('Provider:', result.provider)
      
      // Test 3: Try converting to data URI
      console.log()
      console.log('3. 🔄 Testing URL to Data URI conversion...')
      
      const response = await fetch(result.url)
      if (!response.ok) {
        console.log('❌ Failed to fetch image from URL:', response.status)
        return
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUri = `data:image/png;base64,${base64}`
      
      console.log('✅ Successfully converted to data URI')
      console.log('Data URI length:', dataUri.length)
      console.log('Data URI preview:', dataUri.substring(0, 100) + '...')
      
    } else {
      console.log('❌ No image URL returned')
      console.log('Result:', result)
    }

  } catch (error) {
    console.error('❌ Error during image generation test:', error)
    
    if (error instanceof Error) {
      console.log('Error message:', error.message)
      console.log('Error stack:', error.stack)
    }
  }
}

// Run the debug
debugImageGeneration().catch(console.error)