/**
 * Test Image Storage Initialization
 * Verify that the storage system can initialize properly
 */

import ImageStorageService from '../src/lib/image-storage-service'

async function testImageStorageInit() {
  console.log('🧪 Testing Image Storage Initialization...\n')

  try {
    // Test 1: Initialize storage
    console.log('1️⃣ Testing storage initialization...')
    await ImageStorageService.initializeStorage()
    console.log('   ✅ Storage initialized successfully')

    // Test 2: Test filename generation
    console.log('\n2️⃣ Testing filename generation...')
    const filename = ImageStorageService.generateFilename(
      'Test Plant Cell Diagram',
      'user123',
      'DIAGRAM'
    )
    console.log(`   ✅ Generated filename: ${filename}`)

    // Test 3: Test image stats (should work even with no images)
    console.log('\n3️⃣ Testing image stats...')
    try {
      const stats = await ImageStorageService.getImageStats('test-user-id')
      console.log(`   ✅ Stats retrieved: ${stats.totalImages} images, ${stats.totalSize} bytes`)
    } catch (error) {
      console.log('   ⚠️ Stats test failed (expected if no user exists):', error)
    }

    console.log('\n🎉 Image storage system is ready!')
    console.log('\n📝 Next steps:')
    console.log('• Try generating an image through the UI')
    console.log('• Check the Gallery tab to see saved images')
    console.log('• Images will be saved to /public/ai-images/')

  } catch (error) {
    console.error('❌ Storage initialization failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('• Check if the database schema is up to date')
    console.log('• Verify the /public/ai-images/ directory exists')
    console.log('• Ensure proper file permissions')
  }
}

// Run the test
testImageStorageInit()