import { config } from 'dotenv';
config();

async function testPresentationSaving() {
  console.log('🧪 Testing Presentation Saving');
  console.log('==============================');

  try {
    // Test 1: Check if we can connect to the database
    console.log('\n1. Testing database connection...');
    
    const { prisma } = await import('@/lib/prisma');
    
    // Try to query the database
    const userCount = await prisma.user.count();
    console.log('✅ Database connected successfully');
    console.log(`📊 Total users in database: ${userCount}`);

    // Test 2: Check if we have any teachers
    const teacherCount = await prisma.teacher.count();
    console.log(`📊 Total teachers in database: ${teacherCount}`);

    if (teacherCount === 0) {
      console.log('⚠️  No teachers found in database');
      console.log('   This might be why presentations aren\'t saving');
      return;
    }

    // Test 3: Check existing presentations
    const presentationCount = await prisma.aIGeneratedContent.count({
      where: { type: 'POWERPOINT' }
    });
    console.log(`📊 Existing presentations: ${presentationCount}`);

    // Test 4: Try to create a test presentation
    console.log('\n2. Testing presentation creation...');
    
    const firstTeacher = await prisma.teacher.findFirst();
    if (!firstTeacher) {
      console.log('❌ No teacher found to test with');
      return;
    }

    console.log(`📊 Testing with teacher ID: ${firstTeacher.id}`);

    const testPresentationData = {
      title: 'Test Presentation',
      subject: 'Science',
      grade: 'Grade 5',
      topic: 'Solar System',
      duration: 30,
      slideCount: 3,
      slides: [
        {
          title: 'Introduction',
          content: ['Welcome to our lesson'],
          layout: 'split',
          imagePrompt: 'Educational illustration of the solar system'
        }
      ],
      difficulty: 'medium',
      metadata: {
        generatedAt: new Date().toISOString(),
        slideCount: 3,
        duration: 30,
        difficulty: 'medium',
        hasImages: true
      }
    };

    const savedPresentation = await prisma.aIGeneratedContent.create({
      data: {
        title: testPresentationData.title,
        content: JSON.stringify(testPresentationData),
        type: 'POWERPOINT',
        subject: testPresentationData.subject,
        grade: testPresentationData.grade,
        topic: testPresentationData.topic,
        metadata: testPresentationData.metadata,
        teacherId: firstTeacher.id
      }
    });

    console.log('✅ Test presentation created successfully');
    console.log(`📊 Presentation ID: ${savedPresentation.id}`);

    // Test 5: Try to retrieve the presentation
    console.log('\n3. Testing presentation retrieval...');
    
    const retrievedPresentation = await prisma.aIGeneratedContent.findUnique({
      where: { id: savedPresentation.id }
    });

    if (retrievedPresentation) {
      console.log('✅ Presentation retrieved successfully');
      const parsedContent = JSON.parse(retrievedPresentation.content);
      console.log(`📊 Title: ${parsedContent.title}`);
      console.log(`📊 Slides: ${parsedContent.slides?.length || 0}`);
    } else {
      console.log('❌ Failed to retrieve presentation');
    }

    // Test 6: Clean up - delete the test presentation
    console.log('\n4. Cleaning up...');
    await prisma.aIGeneratedContent.delete({
      where: { id: savedPresentation.id }
    });
    console.log('✅ Test presentation deleted');

    console.log('\n🎉 Presentation Saving Test PASSED!');
    console.log('The database connection and saving functionality work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('\n🔍 Database connection issue detected');
        console.log('- Check your DATABASE_URL in .env file');
        console.log('- Ensure the database server is running');
        console.log('- Verify network connectivity');
      } else if (error.message.includes('Teacher')) {
        console.log('\n🔍 Teacher-related issue detected');
        console.log('- Make sure you have teacher records in the database');
        console.log('- Check if the user session is properly linked to a teacher');
      } else if (error.message.includes('prisma')) {
        console.log('\n🔍 Prisma-related issue detected');
        console.log('- Run: npx prisma generate');
        console.log('- Run: npx prisma db push');
        console.log('- Check your schema.prisma file');
      }
    }
  }
}

testPresentationSaving();