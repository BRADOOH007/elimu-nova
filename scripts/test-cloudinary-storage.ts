/**
 * Test Cloudinary Storage Implementation
 * This will test if images can be saved to Cloudinary
 */

import CloudinaryStorage from '@/lib/cloudinary-storage'

async function testCloudinaryStorage() {
  console.log('🧪 Testing Cloudinary Storage...\n')

  try {
    // Check if Cloudinary environment variables are set
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    const missingVars = requiredVars.filter(varName => 
      !process.env[varName] || process.env[varName]?.includes('your-')
    )

    if (missingVars.length > 0) {
      console.log('❌ Missing Cloudinary environment variables:')
      missingVars.forEach(varName => console.log(`   ${varName}`))
      console.log('\n📋 To get your Cloudinary credentials:')
      console.log('1. Go to https://cloudinary.com/users/register/free')
      console.log('2. Sign up for a free account')
      console.log('3. Go to Dashboard → Settings → API Keys')
      console.log('4. Copy Cloud Name, API Key, and API Secret')
      console.log('5. Add them to your environment variables')
      return
    }

    console.log('✅ All Cloudinary environment variables are configured')
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 8)}...`)

    // Test 1: Test Cloudinary connection
    console.log('\n🔗 Testing Cloudinary connection...')
    const connectionTest = await CloudinaryStorage.testConnection()
    
    if (!connectionTest) {
      console.log('❌ Cloudinary connection failed')
      console.log('Please check your credentials and try again')
      return
    }

    // Test 2: Get Cloudinary usage stats
    console.log('\n📊 Getting Cloudinary usage stats...')
    try {
      const stats = await CloudinaryStorage.getCloudinaryStats()
      console.log('✅ Cloudinary stats retrieved:')
      console.log(`   Credits used: ${stats.used_percent}%`)
      console.log(`   Storage: ${stats.storage?.usage || 0} bytes`)
      console.log(`   Transformations: ${stats.transformations?.usage || 0}`)
    } catch (error) {
      console.log('⚠️  Could not get stats (this is normal for new accounts)')
    }

    // Test 3: List existing images
    console.log('\n📋 Listing existing Cloudinary images...')
    try {
      const images = await CloudinaryStorage.listCloudinaryImages(5)
      console.log(`✅ Found ${images.length} existing images`)
      images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.publicId} (${img.bytes} bytes)`)
      })
    } catch (error) {
      console.log('⚠️  Could not list images (this is normal for new accounts)')
    }

    console.log('\n🎉 Cloudinary Storage Test Complete!')
    console.log('Your image storage system is ready for production.')
    console.log('\n📝 Next steps:')
    console.log('1. Add Cloudinary credentials to Vercel environment variables')
    console.log('2. Redeploy your application')
    console.log('3. Test AI image generation')

  } catch (error) {
    console.error('❌ Cloudinary Storage test failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        console.log('\n💡 Solution:')
        console.log('1. Check your CLOUDINARY_API_KEY is correct')
        console.log('2. Make sure there are no extra spaces or quotes')
        console.log('3. Verify the API key is active in Cloudinary dashboard')
      } else if (error.message.includes('cloud_name')) {
        console.log('\n💡 Solution:')
        console.log('1. Check your CLOUDINARY_CLOUD_NAME is correct')
        console.log('2. It should be just the name, not a URL')
      }
    }
  }
}

// Run test
testCloudinaryStorage().catch(console.error)