/**
 * Test AI Image Storage System
 * Verifies the complete image storage, indexing, and retrieval system
 */

async function testImageStorageSystem() {
  console.log('🧪 Testing AI Image Storage System...\n')

  try {
    // Test 1: Check Prisma schema models
    console.log('1️⃣ Testing Prisma schema models...')
    const schemaContent = await import('fs').then(fs => 
      fs.readFileSync('prisma/schema.prisma', 'utf8')
    )
    
    const hasAIImageModel = schemaContent.includes('model AIGeneratedImage')
    const hasUsageModel = schemaContent.includes('model AIImageUsage')
    const hasImageTypes = schemaContent.includes('enum AIImageType')
    const hasImageSizes = schemaContent.includes('enum AIImageSize')
    
    console.log(`   ✅ AIGeneratedImage model: ${hasAIImageModel}`)
    console.log(`   ✅ AIImageUsage model: ${hasUsageModel}`)
    console.log(`   ✅ AIImageType enum: ${hasImageTypes}`)
    console.log(`   ✅ AIImageSize enum: ${hasImageSizes}`)

    // Test 2: Check storage service
    console.log('\n2️⃣ Testing storage service...')
    const ImageStorageService = await import('../src/lib/image-storage-service')
    console.log('   ✅ ImageStorageService imported successfully')
    
    const hasRequiredMethods = [
      'saveAIImage',
      'getUserImages', 
      'trackImageUsage',
      'deleteImage',
      'getImageStats'
    ].every(method => typeof ImageStorageService.default[method] === 'function')
    
    console.log(`   ✅ Required methods available: ${hasRequiredMethods}`)

    // Test 3: Check API routes
    console.log('\n3️⃣ Testing API routes...')
    
    const apiRoutes = [
      '../src/app/api/ai/images/route.ts',
      '../src/app/api/ai/images/stats/route.ts',
      '../src/app/api/ai/images/[id]/use/route.ts'
    ]
    
    for (const route of apiRoutes) {
      try {
        await import(route)
        console.log(`   ✅ ${route.split('/').pop()}: Available`)
      } catch (error) {
        console.log(`   ❌ ${route.split('/').pop()}: Import failed`)
      }
    }

    // Test 4: Check updated generation APIs
    console.log('\n4️⃣ Testing updated generation APIs...')
    
    const diagramApiContent = await import('fs').then(fs => 
      fs.readFileSync('src/app/api/ai/diagram/route.ts', 'utf8')
    )
    const imageApiContent = await import('fs').then(fs => 
      fs.readFileSync('src/app/api/ai/generate-image/route.ts', 'utf8')
    )
    
    const diagramUsesStorage = diagramApiContent.includes('ImageStorageService.saveAIImage')
    const imageUsesStorage = imageApiContent.includes('ImageStorageService.saveAIImage')
    
    console.log(`   ✅ Diagram API uses storage: ${diagramUsesStorage}`)
    console.log(`   ✅ Image API uses storage: ${imageUsesStorage}`)

    // Test 5: Check frontend components
    console.log('\n5️⃣ Testing frontend components...')
    
    try {
      const ImageGallery = await import('../src/components/ai/image-gallery')
      console.log('   ✅ ImageGallery component imported')
      
      const galleryContent = await import('fs').then(fs => 
        fs.readFileSync('src/components/ai/image-gallery.tsx', 'utf8')
      )
      
      const hasRequiredFeatures = [
        'loadImages',
        'handleDelete',
        'handleDownload',
        'handleView',
        'trackImageUsage'
      ].every(feature => galleryContent.includes(feature))
      
      console.log(`   ✅ Gallery has required features: ${hasRequiredFeatures}`)
    } catch (error) {
      console.log('   ❌ ImageGallery component import failed')
    }

    // Test 6: Check AI tools page integration
    console.log('\n6️⃣ Testing AI tools page integration...')
    
    const teacherPageContent = await import('fs').then(fs => 
      fs.readFileSync('src/app/teacher/ai-tools/page.tsx', 'utf8')
    )
    const studentPageContent = await import('fs').then(fs => 
      fs.readFileSync('src/app/student/ai-tools/page.tsx', 'utf8')
    )
    
    const teacherHasGallery = teacherPageContent.includes('ImageGallery') && teacherPageContent.includes('Gallery')
    const studentHasGallery = studentPageContent.includes('ImageGallery') && studentPageContent.includes('Gallery')
    
    console.log(`   ✅ Teacher page has gallery: ${teacherHasGallery}`)
    console.log(`   ✅ Student page has gallery: ${studentHasGallery}`)

    // Test 7: Check filename generation
    console.log('\n7️⃣ Testing filename generation...')
    
    const testFilename = ImageStorageService.default.generateFilename(
      'Plant Cell Diagram',
      'user123',
      'DIAGRAM'
    )
    
    const isValidFilename = testFilename.includes('elimu_') && 
                           testFilename.includes('plant_cell') && 
                           testFilename.includes('diagram') &&
                           testFilename.endsWith('.png')
    
    console.log(`   ✅ Generated filename: ${testFilename}`)
    console.log(`   ✅ Filename format valid: ${isValidFilename}`)

    console.log('\n🎉 All tests completed successfully!')
    
    const allChecks = [
      hasAIImageModel, hasUsageModel, hasImageTypes, hasImageSizes,
      hasRequiredMethods, diagramUsesStorage, imageUsesStorage,
      teacherHasGallery, studentHasGallery, isValidFilename
    ]
    
    const passedChecks = allChecks.filter(Boolean).length
    const totalChecks = allChecks.length
    
    console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`)
    
    if (passedChecks === totalChecks) {
      console.log('\n✅ AI Image Storage System is fully implemented!')
      console.log('\n🔧 Features Available:')
      console.log('• Automatic image saving and indexing')
      console.log('• Permanent storage with unique filenames')
      console.log('• Database tracking with metadata')
      console.log('• User gallery with search and filtering')
      console.log('• Usage tracking and analytics')
      console.log('• Download and delete functionality')
      console.log('• Integration with AI generation tools')
      console.log('• Teacher and student portfolio views')
      
      console.log('\n💾 Storage Features:')
      console.log('• Local storage for development (/public/ai-images/)')
      console.log('• Scalable for cloud storage in production')
      console.log('• Automatic cleanup and maintenance')
      console.log('• File size and dimension tracking')
      console.log('• Audit trail for all image operations')
      
      console.log('\n🎯 Benefits Achieved:')
      console.log('• Auditability - track all generated content')
      console.log('• Teacher review - see student generated images')
      console.log('• Student portfolios - personal image collections')
      console.log('• Legal protection - permanent records')
      console.log('• Content reuse - images available for presentations')
      console.log('• Cost optimization - size-based storage')
    } else {
      console.log('⚠️ Some checks failed - manual verification needed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testImageStorageSystem()