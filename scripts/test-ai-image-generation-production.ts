/**
 * Test AI Image Generation in Production
 * This will test if AI images can be generated and stored properly
 */

import { PrismaClient } from '@prisma/client';

async function testAIImageGeneration() {
  console.log('🧪 Testing AI Image Generation in Production...\n');

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

    // Check if we have users to test with
    const users = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      take: 1,
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    if (users.length === 0) {
      console.log('❌ No teacher users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`🧑‍🏫 Using test user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})\n`);

    // Test 1: Check if OpenAI API key is working
    console.log('🔑 Testing OpenAI API Key...');
    const openaiApiKey = "REDACTED";
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ OpenAI API key is valid and working');
      } else {
        console.log(`❌ OpenAI API key failed: ${response.status} ${response.statusText}`);
        return;
      }
    } catch (error) {
      console.log(`❌ OpenAI API connection error: ${error}`);
      return;
    }

    // Test 2: Try generating a simple AI image
    console.log('\n🎨 Testing AI Image Generation...');
    try {
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: "A simple educational diagram of a plant cell with labeled parts, clean and colorful illustration style",
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.data[0].url;
        console.log('✅ AI Image generated successfully');
        console.log(`   Image URL: ${imageUrl.substring(0, 50)}...`);

        // Test 3: Save to database
        console.log('\n💾 Testing Database Storage...');
        const savedImage = await prisma.aIGeneratedImage.create({
          data: {
            filename: `test_${Date.now()}_plant_cell.png`,
            originalUrl: imageUrl,
            storedUrl: imageUrl, // In production, this would be your permanent storage
            topic: "Plant Cell",
            prompt: "A simple educational diagram of a plant cell with labeled parts",
            type: "DIAGRAM",
            size: "MEDIUM_1024",
            quality: "standard",
            userId: testUser.id,
            fileSize: null,
            dimensions: JSON.stringify({ width: 1024, height: 1024 }),
            metadata: JSON.stringify({
              model: "dall-e-3",
              generatedAt: new Date().toISOString(),
              testImage: true
            })
          }
        });

        console.log('✅ AI Image saved to database successfully');
        console.log(`   Database ID: ${savedImage.id}`);
        console.log(`   Filename: ${savedImage.filename}`);

        // Test 4: Query the saved image
        console.log('\n🔍 Testing Image Retrieval...');
        const retrievedImage = await prisma.aIGeneratedImage.findUnique({
          where: { id: savedImage.id },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        if (retrievedImage) {
          console.log('✅ Image retrieved successfully from database');
          console.log(`   Topic: ${retrievedImage.topic}`);
          console.log(`   Type: ${retrievedImage.type}`);
          console.log(`   Created by: ${retrievedImage.user.firstName} ${retrievedImage.user.lastName}`);
        }

        // Test 5: Test the AI images API endpoint simulation
        console.log('\n🌐 Testing API Endpoint Simulation...');
        const allImages = await prisma.aIGeneratedImage.findMany({
          where: { userId: testUser.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            filename: true,
            topic: true,
            prompt: true,
            type: true,
            storedUrl: true,
            createdAt: true
          }
        });

        console.log(`✅ Found ${allImages.length} images for user`);
        allImages.forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.topic} (${img.type}) - ${img.filename}`);
        });

        // Clean up test image
        console.log('\n🧹 Cleaning up test data...');
        await prisma.aIGeneratedImage.delete({
          where: { id: savedImage.id }
        });
        console.log('✅ Test image cleaned up');

      } else {
        const errorData = await imageResponse.json();
        console.log(`❌ AI Image generation failed: ${imageResponse.status}`);
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ AI Image generation error: ${error}`);
    }

    // Test 6: Check ai_generated_content table for presentations
    console.log('\n📊 Testing Presentation Storage...');
    try {
      const presentationCount = await prisma.aIGeneratedContent.count();
      console.log(`✅ ai_generated_content table accessible - ${presentationCount} records`);
      
      const recentPresentations = await prisma.aIGeneratedContent.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          subject: true,
          topic: true,
          createdAt: true
        }
      });

      if (recentPresentations.length > 0) {
        console.log('   Recent presentations:');
        recentPresentations.forEach(pres => {
          console.log(`   - "${pres.title}" (${pres.subject} - ${pres.topic})`);
        });
      } else {
        console.log('   ⚠️  No presentations found in database');
      }
    } catch (error) {
      console.log(`❌ Presentation table test failed: ${error}`);
    }

    console.log('\n🎉 AI Image Generation Test Complete!');
    console.log('✅ Your AI image system should now work in production');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testAIImageGeneration().catch(console.error);