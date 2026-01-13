/**
 * Test Gallery API Endpoint
 * Make actual HTTP requests to test the gallery API
 */

async function testGalleryEndpoint() {
  console.log('🧪 Testing Gallery API Endpoint...\n')

  try {
    // Test 1: Test the images API endpoint
    console.log('1️⃣ Testing /api/ai/images endpoint...')
    
    const response = await fetch('http://localhost:3000/api/ai/images', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ API responded successfully`)
      console.log(`   Images returned: ${data.images?.length || 0}`)
      console.log(`   Total: ${data.total || 0}`)
      console.log(`   Has more: ${data.hasMore || false}`)
      
      if (data.images && data.images.length > 0) {
        console.log(`   First image: ${data.images[0].topic}`)
        console.log(`   Image URL: ${data.images[0].storedUrl}`)
      }
    } else {
      const errorText = await response.text()
      console.log(`   ❌ API error: ${errorText}`)
    }

    // Test 2: Test the stats API endpoint
    console.log('\n2️⃣ Testing /api/ai/images/stats endpoint...')
    
    const statsResponse = await fetch('http://localhost:3000/api/ai/images/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`   Status: ${statsResponse.status} ${statsResponse.statusText}`)
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      console.log(`   ✅ Stats API responded successfully`)
      console.log(`   Total images: ${statsData.totalImages || 0}`)
      console.log(`   Total size: ${statsData.totalSize || 0} bytes`)
      console.log(`   Recent images: ${statsData.recentImages || 0}`)
    } else {
      const errorText = await statsResponse.text()
      console.log(`   ❌ Stats API error: ${errorText}`)
    }

    console.log('\n📝 Note: 401 Unauthorized errors are expected when testing without authentication')

  } catch (error) {
    console.error('❌ Endpoint test failed:', error)
  }
}

// Run the test
testGalleryEndpoint()