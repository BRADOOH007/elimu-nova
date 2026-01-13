#!/usr/bin/env tsx

/**
 * Diagnostic Script: AI Tools Production Issues
 * 
 * This script helps diagnose why AI tools are failing in production:
 * 1. Tests OpenAI API connectivity
 * 2. Validates environment variables
 * 3. Tests diagram generation workflow
 * 4. Checks image storage functionality
 */

import { OpenAIService } from '../src/lib/openai-service'
import EducationalDiagramService from '../src/lib/educational-diagram-service'

async function testEnvironmentVariables() {
  console.log('🔍 Testing Environment Variables...\n')

  const requiredVars = [
    'OPENAI_API_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const optionalVars = [
    'OPENAI_DALLE_API_KEY',
    'STABILITY_API_KEY',
    'STRIPE_SECRET_KEY'
  ]

  console.log('✅ Required Variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ${varName}: ${value.substring(0, 10)}...${value.substring(value.length - 4)} (${value.length} chars)`)
    } else {
      console.log(`   ❌ ${varName}: MISSING`)
    }
  })

  console.log('\n⚠️  Optional Variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ${varName}: ${value.substring(0, 10)}...${value.substring(value.length - 4)} (${value.length} chars)`)
    } else {
      console.log(`   ${varName}: Not set`)
    }
  })

  return requiredVars.every(varName => process.env[varName])
}

async function testOpenAIConnectivity() {
  console.log('\n🤖 Testing OpenAI API Connectivity...\n')

  try {
    // Test text generation
    console.log('Testing text generation...')
    const textResponse = await OpenAIService.generateText([
      {
        role: 'user',
        content: 'Say "Hello from ElimuNova AI!" and nothing else.'
      }
    ])

    console.log(`✅ Text Generation: ${textResponse.substring(0, 50)}...`)

    // Test image generation
    console.log('Testing image generation...')
    const imageResponse = await OpenAIService.generateImage({
      prompt: 'A simple red circle on white background',
      size: '512x512',
      quality: 'standard'
    })

    console.log(`✅ Image Generation: ${imageResponse.url.substring(0, 50)}...`)

    return true

  } catch (error) {
    console.error('❌ OpenAI API Error:', error)
    return false
  }
}

async function testDiagramGeneration() {
  console.log('\n📊 Testing Diagram Generation...\n')

  try {
    const testRequest = {
      topic: 'Human heart',
      grade: 'Grade 7',
      curriculum: 'CBC' as const,
      type: 'biology' as const,
      size: '512x512' as const,
      quality: 'standard' as const
    }

    console.log('Generating test diagram...')
    console.log(`Topic: ${testRequest.topic}`)
    console.log(`Grade: ${testRequest.grade}`)
    console.log(`Curriculum: ${testRequest.curriculum}`)
    console.log(`Type: ${testRequest.type}`)

    const diagram = await EducationalDiagramService.generateDiagram(testRequest)

    console.log('✅ Diagram Generated Successfully:')
    console.log(`   Image URL: ${diagram.image_url.substring(0, 50)}...`)
    console.log(`   Labels: ${diagram.labels.join(', ')}`)
    console.log(`   Dimensions: ${diagram.metadata.dimensions.width}x${diagram.metadata.dimensions.height}`)
    console.log(`   Cost Tier: ${diagram.metadata.cost_tier}`)

    return true

  } catch (error) {
    console.error('❌ Diagram Generation Error:', error)
    if (error instanceof Error) {
      console.error('   Error Message:', error.message)
      console.error('   Error Stack:', error.stack)
    }
    return false
  }
}

async function testImageStorageService() {
  console.log('\n💾 Testing Image Storage Service...\n')

  try {
    // Test if the service can be imported
    const ImageStorageService = await import('../src/lib/image-storage-service')
    console.log('✅ Image Storage Service imported successfully')

    // Test basic functionality (without actually saving)
    console.log('✅ Image Storage Service is available')

    return true

  } catch (error) {
    console.error('❌ Image Storage Service Error:', error)
    return false
  }
}

async function testAPIEndpoint() {
  console.log('\n🔗 Testing AI Diagram API Endpoint Structure...\n')

  try {
    // Test if we can import the API route
    const apiRoute = await import('../src/app/api/ai/diagram/route')
    console.log('✅ AI Diagram API route imported successfully')

    // Check if POST method exists
    if (typeof apiRoute.POST === 'function') {
      console.log('✅ POST method is available')
    } else {
      console.log('❌ POST method is missing')
    }

    return true

  } catch (error) {
    console.error('❌ API Endpoint Error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Diagnosing AI Tools Production Issues\n')
  console.log('=' .repeat(60))

  const results = {
    environmentVariables: false,
    openaiConnectivity: false,
    diagramGeneration: false,
    imageStorageService: false,
    apiEndpoint: false
  }

  // Test 1: Environment Variables
  results.environmentVariables = await testEnvironmentVariables()

  // Test 2: OpenAI Connectivity
  results.openaiConnectivity = await testOpenAIConnectivity()

  // Test 3: Diagram Generation
  results.diagramGeneration = await testDiagramGeneration()

  // Test 4: Image Storage Service
  results.imageStorageService = await testImageStorageService()

  // Test 5: API Endpoint
  results.apiEndpoint = await testAPIEndpoint()

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 DIAGNOSTIC RESULTS')
  console.log('=' .repeat(60))

  console.log(`✅ Environment Variables: ${results.environmentVariables ? 'OK' : 'ISSUES FOUND'}`)
  console.log(`✅ OpenAI Connectivity: ${results.openaiConnectivity ? 'OK' : 'FAILED'}`)
  console.log(`✅ Diagram Generation: ${results.diagramGeneration ? 'OK' : 'FAILED'}`)
  console.log(`✅ Image Storage Service: ${results.imageStorageService ? 'OK' : 'FAILED'}`)
  console.log(`✅ API Endpoint: ${results.apiEndpoint ? 'OK' : 'FAILED'}`)

  const allPassed = Object.values(results).every(result => result)
  
  console.log('\n' + '=' .repeat(60))
  if (allPassed) {
    console.log('🎉 ALL DIAGNOSTICS PASSED!')
    console.log('\n✅ AI TOOLS SHOULD BE WORKING')
    console.log('   If still failing in production, check:')
    console.log('   - Vercel environment variables are set correctly')
    console.log('   - OpenAI API key has sufficient credits')
    console.log('   - Network connectivity from Vercel to OpenAI')
  } else {
    console.log('⚠️  ISSUES FOUND - Check individual results above')
    
    if (!results.environmentVariables) {
      console.log('\n🔧 ENVIRONMENT VARIABLE ISSUES:')
      console.log('   - Ensure all required variables are set in Vercel')
      console.log('   - Check that OPENAI_API_KEY is valid and has credits')
    }
    
    if (!results.openaiConnectivity) {
      console.log('\n🔧 OPENAI CONNECTIVITY ISSUES:')
      console.log('   - Verify API key is correct and active')
      console.log('   - Check OpenAI account has sufficient credits')
      console.log('   - Ensure no rate limiting or quota issues')
    }
    
    if (!results.diagramGeneration) {
      console.log('\n🔧 DIAGRAM GENERATION ISSUES:')
      console.log('   - Check OpenAI service implementation')
      console.log('   - Verify image generation API is working')
      console.log('   - Check text generation for labels')
    }
  }
  console.log('=' .repeat(60))
}

main().catch(console.error)