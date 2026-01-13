import { config } from 'dotenv'
config()

async function testSchemeExport() {
  console.log('🧪 Testing Scheme of Work Export Functionality')
  console.log('='.repeat(50))
  
  // Sample scheme of work content (similar to what AI generates)
  const sampleContent = `
# Scheme of Work: Mathematics Fundamentals

## Week 1: Introduction to Numbers

### Lesson 1: Understanding Whole Numbers
**Objectives:**
- Students will identify and classify whole numbers
- Students will understand place value concepts
- Students will compare and order whole numbers

**Teaching Activities:**
- Interactive number line demonstration
- Place value chart exercises
- Number comparison games
- Group work on ordering numbers

**Resources and Materials:**
- Number line charts
- Place value blocks
- Worksheets
- Interactive whiteboard

**Assessment:**
- Observation during activities
- Exit ticket with number ordering
- Quick verbal quiz

### Lesson 2: Basic Operations
**Objectives:**
- Students will perform addition and subtraction
- Students will understand operation properties
- Students will solve word problems

**Teaching Activities:**
- Demonstration of addition strategies
- Hands-on subtraction with manipulatives
- Word problem solving techniques
- Peer tutoring sessions

**Resources and Materials:**
- Counting blocks
- Operation worksheets
- Word problem cards
- Calculator for checking

**Assessment:**
- Practice worksheet completion
- Problem-solving presentation
- Peer assessment activity

## Week 2: Fractions and Decimals

### Lesson 3: Introduction to Fractions
**Objectives:**
- Students will understand fraction concepts
- Students will identify parts of a whole
- Students will compare simple fractions

**Teaching Activities:**
- Pizza fraction demonstration
- Fraction circle activities
- Visual fraction comparisons
- Hands-on fraction building

**Resources and Materials:**
- Fraction circles
- Pizza models
- Fraction strips
- Visual aids

**Assessment:**
- Fraction identification quiz
- Hands-on demonstration
- Worksheet completion
`

  try {
    console.log('📤 Testing scheme export with sample content...')
    
    // Test the export API directly
    const response = await fetch('http://localhost:3000/api/export/scheme-of-work', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: sampleContent,
        title: 'Mathematics Fundamentals - Grade 6',
        subject: 'Mathematics',
        grade: 'Grade 6',
        duration: 12,
        lessonsPerWeek: 5,
        lessonDuration: 45,
        topics: ['Introduction to Numbers', 'Fractions and Decimals'],
        format: 'pdf'
      }),
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const htmlContent = await response.text()
      console.log('✅ Export successful!')
      console.log('📄 Content length:', htmlContent.length, 'characters')
      
      // Check if content contains expected elements
      const checks = {
        hasTitle: htmlContent.includes('Mathematics Fundamentals'),
        hasWeeks: htmlContent.includes('Week 1') && htmlContent.includes('Week 2'),
        hasLessons: htmlContent.includes('Understanding Whole Numbers') && htmlContent.includes('Introduction to Fractions'),
        hasObjectives: htmlContent.includes('Students will identify'),
        hasActivities: htmlContent.includes('Interactive number line'),
        hasResources: htmlContent.includes('Number line charts'),
        hasAssessment: htmlContent.includes('Observation during activities'),
        hasStructure: htmlContent.includes('lesson-title') && htmlContent.includes('detail-section')
      }
      
      console.log('\n📋 Content Quality Checks:')
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed}`)
      })
      
      // Show sample of generated HTML
      console.log('\n📝 Sample HTML structure:')
      const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const weekMatch = htmlContent.match(/<h3[^>]*>Week \d+<\/h3>/i)
      const lessonMatch = htmlContent.match(/<div class="lesson-title"[^>]*>(.*?)<\/div>/i)
      
      if (titleMatch) console.log('   Title:', titleMatch[1])
      if (weekMatch) console.log('   Week found:', weekMatch[0])
      if (lessonMatch) console.log('   Lesson found:', lessonMatch[1])
      
      // Count parsed elements
      const weekCount = (htmlContent.match(/Week \d+/g) || []).length
      const lessonCount = (htmlContent.match(/lesson-title/g) || []).length
      const objectiveCount = (htmlContent.match(/Learning Objectives/g) || []).length
      
      console.log('\n📊 Parsed Elements:')
      console.log(`   Weeks found: ${weekCount}`)
      console.log(`   Lessons found: ${lessonCount}`)
      console.log(`   Objective sections: ${objectiveCount}`)
      
      if (weekCount >= 2 && lessonCount >= 3 && objectiveCount >= 2) {
        console.log('\n🎉 Export test PASSED! Content is properly structured.')
      } else {
        console.log('\n⚠️  Export test PARTIAL - Content structure needs improvement.')
      }
      
    } else {
      const errorText = await response.text()
      console.log('❌ Export failed')
      console.log('Error:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🏁 Scheme of Work Export Test Complete')
}

testSchemeExport()