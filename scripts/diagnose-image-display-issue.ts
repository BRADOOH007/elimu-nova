/**
 * Diagnose Image Display Issue in Production
 * Check why images are not showing in the gallery
 */

import { PrismaClient } from '@prisma/client';

async function diagnoseImageDisplayIssue() {
  console.log('🔍 Diagnosing Image Display Issue...\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_4dCrxETYqoX9@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to Neon database\n');

    // Check all AI images in database
    console.log('📋 Checking AI Images in Database...');
    const allImages = await prisma.aIGeneratedImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        storedUrl: true,
        topic: true,
        prompt: true,
        type: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${allImages.length} AI images in database:\n`);

    for (const image of allImages) {
      console.log(`📸 Image: ${image.filename}`);
      console.log(`   Topic: ${image.topic}`);
      console.log(`   Type: ${image.type}`);
      console.log(`   Created: ${image.createdAt.toISOString()}`);
      console.log(`   User: ${image.user.firstName} ${image.user.lastName}`);
      console.log(`   Original URL: ${image.originalUrl.substring(0, 80)}...`);
      console.log(`   Stored URL: ${image.storedUrl.substring(0, 80)}...`);
      
      // Test if the image URL is accessible
      console.log('   🧪 Testing image accessibility...');
      try {
        const response = await fetch(image.originalUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ Image accessible (${response.status})`);
          console.log(`   📏 Content-Length: ${response.headers.get('content-length') || 'Unknown'}`);
          console.log(`   🎨 Content-Type: ${response.headers.get('content-type') || 'Unknown'}`);
        } else {
          console.log(`   ❌ Image not accessible (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Image fetch error: ${error}`);
      }
      console.log('');
    }

    // Test the AI images API endpoint
    console.log('🌐 Testing AI Images API Endpoint...');
    try {
      // Simulate the API call that the frontend makes
      const apiUrl = 'http://localhost:3000/api/ai/images'; // This would be your production URL
      console.log(`Testing API endpoint: ${apiUrl}`);
      
      // Since we can't actually call the API from here, let's check the database query that the API would make
      const apiSimulation = await prisma.aIGeneratedImage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          filename: true,
          storedUrl: true,
          topic: true,
          prompt: true,
          type: true,
          size: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log(`✅ API simulation successful - would return ${apiSimulation.length} images`);
      
      // Check for any images with missing URLs
      const imagesWithMissingUrls = apiSimulation.filter(img => !img.storedUrl || img.storedUrl.trim() === '');
      if (imagesWithMissingUrls.length > 0) {
        console.log(`⚠️  Found ${imagesWithMissingUrls.length} images with missing URLs`);
      }

    } catch (error) {
      console.log(`❌ API simulation failed: ${error}`);
    }

    // Check if OpenAI URLs expire
    console.log('\n⏰ Checking OpenAI URL Expiration...');
    const oldestImage = await prisma.aIGeneratedImage.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (oldestImage) {
      const imageAge = Date.now() - oldestImage.createdAt.getTime();
      const hoursOld = Math.floor(imageAge / (1000 * 60 * 60));
      console.log(`Oldest image is ${hoursOld} hours old`);
      
      if (hoursOld > 1) {
        console.log('⚠️  OpenAI image URLs typically expire after 1-2 hours!');
        console.log('   This is likely why images are not displaying.');
        console.log('   You need to implement permanent image storage.');
      } else {
        console.log('✅ Image is recent, URL should still be valid');
      }
    }

    // Check the image gallery component expectations
    console.log('\n🎨 Image Gallery Component Analysis...');
    console.log('The frontend expects images with these properties:');
    console.log('- id: string');
    console.log('- storedUrl: string (for display)');
    console.log('- topic: string');
    console.log('- prompt: string');
    console.log('- type: string');
    console.log('- createdAt: string');

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. OpenAI image URLs expire after 1-2 hours');
    console.log('2. You need to download and store images permanently');
    console.log('3. Options for permanent storage:');
    console.log('   - Vercel Blob Storage');
    console.log('   - AWS S3');
    console.log('   - Cloudinary');
    console.log('   - Upload to your own server');
    console.log('4. Update storedUrl to point to permanent location');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnosis
diagnoseImageDisplayIssue().catch(console.error);