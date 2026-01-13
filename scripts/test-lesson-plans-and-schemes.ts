import { config } from 'dotenv';
config();

async function testLessonPlansAndSchemes() {
  console.log('🧪 Testing Lesson Plans and Schemes of Work AI Generation');
  console.log('========================================================');

  try {
    // Test 1: Test Lesson Plan Generation API
    console.log('\n1. Testing AI Lesson Plan Generation...');
    
    const lessonPlanData = {
      subject: 'Mathematics',
      grade: 'Grade 8',
      topic: 'Quadratic Equations',
      duration: 45,
      objectives: [
        'Students will understand what quadratic equations are',
        'Students will learn to solve quadratic equations using factoring',
        'Students will apply quadratic equations to real-world problems'
      ],
      prerequisites: [
        'Basic algebra skills',
        'Understanding of linear equations'
      ]
    };

    const lessonPlanResponse = await fetch('http://localhost:3000/api/ai/generate-lesson-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonPlanData)
    });

    if (lessonPlanResponse.ok) {
      const lessonPlanResult = await lessonPlanResponse.json();
      console.log('✅ Lesson Plan API working');
      console.log(`📊 Generated content length: ${lessonPlanResult.content?.length || 0} characters`);
      console.log(`📊 Model used: ${lessonPlanResult.metadata?.model || 'Unknown'}`);
      console.log(`📊 Tokens used: ${lessonPlanResult.metadata?.tokens || 0}`);
      
      // Check if content contains key lesson plan elements
      const content = lessonPlanResult.content || '';
      const hasObjectives = content.toLowerCase().includes('objective');
      const hasActivities = content.toLowerCase().includes('activit');
      const hasMaterials = content.toLowerCase().includes('material');
      const hasAssessment = content.toLowerCase().includes('assessment');
      
      console.log(`📋 Content quality check:`);
      console.log(`   - Contains objectives: ${hasObjectives ? '✅' : '❌'}`);
      console.log(`   - Contains activities: ${hasActivities ? '✅' : '❌'}`);
      console.log(`   - Contains materials: ${hasMaterials ? '✅' : '❌'}`);
      console.log(`   - Contains assessment: ${hasAssessment ? '✅' : '❌'}`);
      
      if (content.length > 500) {
        console.log('\n📝 Sample content preview:');
        console.log(content.substring(0, 300) + '...');
      }
    } else {
      console.log(`❌ Lesson Plan API failed: ${lessonPlanResponse.status}`);
      const errorData = await lessonPlanResponse.json().catch(() => ({}));
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }

    // Test 2: Test Scheme of Work Generation API
    console.log('\n2. Testing AI Scheme of Work Generation...');
    
    const schemeData = {
      subject: 'Science',
      grade: 'Grade 7',
      topic: 'Biology Fundamentals', // This will be converted to topics array
      topics: [
        'Cell Structure and Function',
        'Plant and Animal Systems',
        'Genetics and Heredity',
        'Ecosystems and Environment'
      ],
      duration: 12, // 12 weeks
      lessonsPerWeek: 4,
      prerequisites: [
        'Basic understanding of living things',
        'Elementary science concepts'
      ]
    };

    const schemeResponse = await fetch('http://localhost:3000/api/ai/generate-scheme-of-work', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemeData)
    });

    if (schemeResponse.ok) {
      const schemeResult = await schemeResponse.json();
      console.log('✅ Scheme of Work API working');
      console.log(`📊 Generated content length: ${schemeResult.content?.length || 0} characters`);
      console.log(`📊 Model used: ${schemeResult.metadata?.model || 'Unknown'}`);
      console.log(`📊 Tokens used: ${schemeResult.metadata?.tokens || 0}`);
      
      // Check if content contains key scheme elements
      const content = schemeResult.content || '';
      const hasWeeks = content.toLowerCase().includes('week');
      const hasLessons = content.toLowerCase().includes('lesson');
      const hasObjectives = content.toLowerCase().includes('objective');
      const hasActivities = content.toLowerCase().includes('activit');
      const hasAssessment = content.toLowerCase().includes('assessment');
      
      // Check if all topics are covered
      const topicsCovered = schemeData.topics.filter(topic => 
        content.toLowerCase().includes(topic.toLowerCase())
      );
      
      console.log(`📋 Content quality check:`);
      console.log(`   - Contains weeks: ${hasWeeks ? '✅' : '❌'}`);
      console.log(`   - Contains lessons: ${hasLessons ? '✅' : '❌'}`);
      console.log(`   - Contains objectives: ${hasObjectives ? '✅' : '❌'}`);
      console.log(`   - Contains activities: ${hasActivities ? '✅' : '❌'}`);
      console.log(`   - Contains assessment: ${hasAssessment ? '✅' : '❌'}`);
      console.log(`   - Topics covered: ${topicsCovered.length}/${schemeData.topics.length}`);
      
      if (topicsCovered.length > 0) {
        console.log(`   - Covered topics: ${topicsCovered.join(', ')}`);
      }
      
      if (content.length > 500) {
        console.log('\n📝 Sample content preview:');
        console.log(content.substring(0, 400) + '...');
      }
    } else {
      console.log(`❌ Scheme of Work API failed: ${schemeResponse.status}`);
      const errorData = await schemeResponse.json().catch(() => ({}));
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }

    // Test 3: Test Kiswahili Language Support
    console.log('\n3. Testing Kiswahili Language Support...');
    
    const kiswahiliLessonData = {
      subject: 'Kiswahili',
      grade: 'Darasa la 6',
      topic: 'Utungaji wa Mashairi',
      duration: 40,
      objectives: [
        'Wanafunzi watajua jinsi ya kutunga mashairi',
        'Wanafunzi watatumia vina na mizani',
        'Wanafunzi wataonyesha ubunifu katika utungaji'
      ],
      prerequisites: [
        'Uelewa wa lugha ya Kiswahili',
        'Ujuzi wa kusoma na kuandika'
      ]
    };

    const kiswahiliResponse = await fetch('http://localhost:3000/api/ai/generate-lesson-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kiswahiliLessonData)
    });

    if (kiswahiliResponse.ok) {
      const kiswahiliResult = await kiswahiliResponse.json();
      console.log('✅ Kiswahili Lesson Plan API working');
      console.log(`📊 Generated content length: ${kiswahiliResult.content?.length || 0} characters`);
      
      const content = kiswahiliResult.content || '';
      // Check for Swahili words to verify language
      const swahiliWords = ['somo', 'wanafunzi', 'mwalimu', 'shughuli', 'malengo', 'tathmini'];
      const hasSwahiliContent = swahiliWords.some(word => 
        content.toLowerCase().includes(word)
      );
      
      console.log(`🌍 Language check: ${hasSwahiliContent ? '✅ Contains Swahili content' : '❌ May not be in Swahili'}`);
      
      if (content.length > 300) {
        console.log('\n📝 Kiswahili content preview:');
        console.log(content.substring(0, 300) + '...');
      }
    } else {
      console.log(`❌ Kiswahili Lesson Plan API failed: ${kiswahiliResponse.status}`);
    }

    // Test 4: Check if lesson plans and schemes are being saved to database
    console.log('\n4. Testing Database Integration...');
    
    try {
      // Check lesson plans API
      const lessonPlansListResponse = await fetch('http://localhost:3000/api/lesson-plans');
      if (lessonPlansListResponse.ok) {
        const lessonPlansData = await lessonPlansListResponse.json();
        console.log('✅ Lesson Plans database API working');
        console.log(`📊 Found ${lessonPlansData.lessonPlans?.length || 0} saved lesson plans`);
      } else {
        console.log(`⚠️  Lesson Plans database API: ${lessonPlansListResponse.status}`);
      }

      // Check schemes of work API
      const schemesListResponse = await fetch('http://localhost:3000/api/schemes-of-work');
      if (schemesListResponse.ok) {
        const schemesData = await schemesListResponse.json();
        console.log('✅ Schemes of Work database API working');
        console.log(`📊 Found ${schemesData.schemes?.length || 0} saved schemes`);
      } else {
        console.log(`⚠️  Schemes of Work database API: ${schemesListResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️  Database integration test failed:', error);
    }

    // Test 5: Test Export Functionality
    console.log('\n5. Testing Export Functionality...');
    
    try {
      // Test lesson plan export
      const exportLessonResponse = await fetch('http://localhost:3000/api/export/lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Lesson Plan',
          content: 'Sample lesson plan content for export testing',
          format: 'pdf'
        })
      });

      if (exportLessonResponse.ok) {
        const contentType = exportLessonResponse.headers.get('content-type');
        console.log('✅ Lesson Plan export working');
        console.log(`📊 Export format: ${contentType}`);
      } else {
        console.log(`⚠️  Lesson Plan export: ${exportLessonResponse.status}`);
      }

      // Test scheme of work export
      const exportSchemeResponse = await fetch('http://localhost:3000/api/export/scheme-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Scheme of Work',
          content: 'Sample scheme content for export testing',
          format: 'pdf'
        })
      });

      if (exportSchemeResponse.ok) {
        const contentType = exportSchemeResponse.headers.get('content-type');
        console.log('✅ Scheme of Work export working');
        console.log(`📊 Export format: ${contentType}`);
      } else {
        console.log(`⚠️  Scheme of Work export: ${exportSchemeResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️  Export functionality test failed:', error);
    }

    // Summary
    console.log('\n🎉 Lesson Plans and Schemes of Work Test Results:');
    console.log('================================================');
    console.log('✅ AI Lesson Plan Generation API tested');
    console.log('✅ AI Scheme of Work Generation API tested');
    console.log('✅ Kiswahili language support tested');
    console.log('✅ Database integration checked');
    console.log('✅ Export functionality tested');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Test the UI interfaces for lesson plans and schemes');
    console.log('2. Verify that generated content is being saved properly');
    console.log('3. Test the sharing functionality for lesson plans and schemes');
    console.log('4. Check that exports are working in the browser');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('\n🔍 Authentication issue detected');
        console.log('- Make sure you are logged in as a teacher');
        console.log('- Check that the session is valid');
      } else if (error.message.includes('fetch')) {
        console.log('\n🔍 Network issue detected');
        console.log('- Make sure the development server is running');
        console.log('- Check that the API endpoints exist');
      }
    }
  }
}

testLessonPlansAndSchemes();