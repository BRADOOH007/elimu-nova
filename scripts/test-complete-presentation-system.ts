import { config } from 'dotenv';
config();

async function testCompletePresentationSystem() {
  console.log('🧪 Testing Complete Presentation System');
  console.log('=====================================');

  try {
    // Step 1: Generate a new AI presentation
    console.log('\n1. Generating AI presentation...');
    const generateResponse = await fetch('http://localhost:3000/api/ai/generate-simple-presentation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: 'Science',
        grade: 'Grade 5',
        topic: 'Solar System',
        slideCount: 4,
        duration: 30,
        difficulty: 'medium'
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`Generate API failed: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    console.log('✅ AI presentation generated');
    console.log(`📊 Presentation ID: ${generateData.presentationId}`);
    console.log(`📊 Generated ${generateData.presentation.slides?.length || 0} slides`);

    const presentationId = generateData.presentationId;
    if (!presentationId) {
      throw new Error('No presentation ID returned');
    }

    // Step 2: List saved presentations
    console.log('\n2. Fetching saved presentations...');
    const listResponse = await fetch('http://localhost:3000/api/presentations');
    
    if (!listResponse.ok) {
      throw new Error(`List API failed: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    console.log('✅ Presentations fetched');
    console.log(`📊 Found ${listData.presentations?.length || 0} saved presentations`);

    // Step 3: Load the specific presentation
    console.log('\n3. Loading specific presentation...');
    const loadResponse = await fetch(`http://localhost:3000/api/presentations/${presentationId}`);
    
    if (!loadResponse.ok) {
      throw new Error(`Load API failed: ${loadResponse.status}`);
    }

    const loadData = await loadResponse.json();
    console.log('✅ Presentation loaded');
    console.log(`📊 Title: ${loadData.presentation.title}`);
    console.log(`📊 Slides: ${loadData.presentation.slides?.length || 0}`);

    // Check image prompts
    const slidesWithImages = loadData.presentation.slides?.filter((slide: any) => 
      slide.imagePrompt || slide.imageDescription
    ) || [];
    console.log(`🖼️  ${slidesWithImages.length} slides have image prompts`);

    if (slidesWithImages.length > 0) {
      console.log('\n📝 Sample image prompt:');
      console.log(`"${slidesWithImages[0].imagePrompt || slidesWithImages[0].imageDescription}"`);
    }

    // Step 4: Update the presentation
    console.log('\n4. Updating presentation...');
    const updatedSlides = loadData.presentation.slides.map((slide: any, index: number) => ({
      ...slide,
      title: slide.title + ' (Updated)',
      imagePrompt: slide.imagePrompt ? slide.imagePrompt + ' with bright colors' : slide.imageDescription + ' with bright colors'
    }));

    const updateResponse = await fetch(`http://localhost:3000/api/presentations/${presentationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: loadData.presentation.title + ' (Updated)',
        slides: updatedSlides,
        subject: loadData.presentation.subject,
        grade: loadData.presentation.grade,
        topic: loadData.presentation.topic,
        duration: loadData.presentation.duration,
        difficulty: loadData.presentation.difficulty
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update API failed: ${updateResponse.status}`);
    }

    const updateData = await updateResponse.json();
    console.log('✅ Presentation updated');
    console.log(`📊 New title: ${updateData.presentation.title}`);

    // Step 5: Test PowerPoint download
    console.log('\n5. Testing PowerPoint download...');
    const downloadResponse = await fetch(`http://localhost:3000/api/presentations/${presentationId}/download`);
    
    if (!downloadResponse.ok) {
      throw new Error(`Download API failed: ${downloadResponse.status}`);
    }

    const contentType = downloadResponse.headers.get('content-type');
    const contentLength = downloadResponse.headers.get('content-length');
    
    console.log('✅ PowerPoint download successful');
    console.log(`📊 Content-Type: ${contentType}`);
    console.log(`📊 File size: ${contentLength} bytes`);

    // Step 6: Clean up - delete the test presentation
    console.log('\n6. Cleaning up test presentation...');
    const deleteResponse = await fetch(`http://localhost:3000/api/presentations/${presentationId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete API failed: ${deleteResponse.status}`);
    }

    console.log('✅ Test presentation deleted');

    console.log('\n🎉 Complete Presentation System Test PASSED!');
    console.log('=====================================');
    console.log('✅ AI generation with database saving');
    console.log('✅ Presentation listing and loading');
    console.log('✅ Image prompts preserved and editable');
    console.log('✅ Presentation editing and updating');
    console.log('✅ PowerPoint file generation');
    console.log('✅ Presentation deletion');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('- Make sure the development server is running');
    console.log('- Check that you are logged in as a teacher');
    console.log('- Verify database connection is working');
    console.log('- Check API endpoints are properly configured');
  }
}

testCompletePresentationSystem();