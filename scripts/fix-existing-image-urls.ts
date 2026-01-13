/**
 * Fix Existing Image URLs in Database
 * Update storedUrl to use OpenAI URLs directly
 */

import { PrismaClient } from '@prisma/client';

async function fixExistingImageUrls() {
  console.log('🔧 Fixing Existing Image URLs...\n');

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

    // Find all images with local storedUrl paths
    const imagesWithLocalUrls = await prisma.aIGeneratedImage.findMany({
      where: {
        storedUrl: {
          startsWith: '/ai-images/'
        }
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        storedUrl: true,
        topic: true
      }
    });

    console.log(`Found ${imagesWithLocalUrls.length} images with local URLs to fix:\n`);

    for (const image of imagesWithLocalUrls) {
      console.log(`🔧 Fixing image: ${image.filename}`);
      console.log(`   Topic: ${image.topic}`);
      console.log(`   Current storedUrl: ${image.storedUrl}`);
      console.log(`   Original URL: ${image.originalUrl.substring(0, 80)}...`);

      // Test if the original URL is still accessible
      try {
        const response = await fetch(image.originalUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ Original URL is still accessible`);
          
          // Update the storedUrl to use the original OpenAI URL
          await prisma.aIGeneratedImage.update({
            where: { id: image.id },
            data: {
              storedUrl: image.originalUrl
            }
          });
          
          console.log(`   ✅ Updated storedUrl to use OpenAI URL`);
        } else {
          console.log(`   ❌ Original URL is no longer accessible (${response.status})`);
          console.log(`   ⚠️  This image will need to be regenerated`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking original URL: ${error}`);
      }
      
      console.log('');
    }

    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    const updatedImages = await prisma.aIGeneratedImage.findMany({
      select: {
        id: true,
        filename: true,
        storedUrl: true,
        topic: true
      }
    });

    console.log(`\n📊 Updated image URLs:`);
    updatedImages.forEach(img => {
      const urlType = img.storedUrl.startsWith('http') ? 'OpenAI URL' : 'Local Path';
      console.log(`   - ${img.topic}: ${urlType}`);
    });

    console.log('\n🎉 Image URL fix completed!');
    console.log('Images should now display properly in the gallery.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
fixExistingImageUrls().catch(console.error);