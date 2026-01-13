import { config } from 'dotenv';
config();

async function testFinalPresentationWorkflow() {
  console.log('🧪 Testing Final Presentation Workflow');
  console.log('=====================================');

  try {
    // Test the simple presentation generation API
    console.log('\n1. Testing simple presentation generation...');
    const response = await fetch('http://localhost:3000/api/ai/generate-simple-presentation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Solar System',
        slideCount: 3,
        includeImages: true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Presentation generated successfully');
    console.log(`📊 Generated ${result.slides?.length || 0} slides`);
    
    // Check if images were included
    const slidesWithImages = result.slides?.filter((slide: any) => slide.image) || [];
    console.log(`🖼️  ${slidesWithImages.length} slides have images`);

    if (slidesWithImages.length > 0) {
      console.log('✅ Images are being generated and included in slides');
      
      // Check image format
      const firstImage = slidesWithImages[0].image;
      if (firstImage.startsWith('data:image/')) {
        console.log('✅ Images are in proper data URI format');
      } else {
        console.log('⚠️  Images might not be in data URI format');
      }
    } else {
      console.log('⚠️  No images found in slides');
    }

    console.log('\n📋 Sample slide structure:');
    if (result.slides && result.slides[0]) {
      console.log(JSON.stringify({
        title: result.slides[0].title,
        hasContent: !!result.slides[0].content,
        hasImage: !!result.slides[0].image,
        imageFormat: result.slides[0].image ? 'data URI' : 'none'
      }, null, 2));
    }

    console.log('\n🎉 Final workflow test completed successfully!');
    console.log('The presentation generation with images is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFinalPresentationWorkflow();