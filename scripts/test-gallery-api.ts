/**
 * Test Gallery API
 * Check if the gallery API is working properly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGalleryApi() {
  console.log('🧪 Testing Gallery API...\n')

  try {
    // Test 1: Check database records
    console.log('1️⃣ Testing database records...')
    const images = await prisma.aIGeneratedImage.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })
    
    console.log(`   ✅ Found ${images.length} images in database`)
    images.forEach((img, index) => {
      console.log(`   ${index + 1}. ${img.topic} - ${img.filename}`)
      console.log(`      User: ${img.user.firstName} ${img.user.lastName}`)
      console.log(`      URL: ${img.storedUrl}`)
    })

    // Test 2: Test API endpoint simulation
    console.log('\n2️⃣ Testing API logic...')
    if (images.length > 0) {
      const testUserId = images[0].userId
      console.log(`   Testing with user ID: ${testUserId}`)
      
      const userImages = await prisma.aIGeneratedImage.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          student: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } }
          },
          teacher: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } }
          },
          school: {
            select: { id: true, name: true }
          },
          class: {
            select: { id: true, name: true, subject: true }
          }
        }
      })
      
      console.log(`   ✅ User has ${userImages.length} images`)
      
      // Test the response format
      const formattedImages = userImages.map(img => ({
        ...img,
        dimensions: img.dimensions ? JSON.parse(img.dimensions) : null,
        metadata: img.metadata ? JSON.parse(img.metadata) : null
      }))
      
      console.log('   ✅ Images formatted successfully')
      console.log(`   First image: ${formattedImages[0]?.topic}`)
    }

    console.log('\n🎉 Gallery API test completed!')

  } catch (error) {
    console.error('❌ Gallery API test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testGalleryApi()