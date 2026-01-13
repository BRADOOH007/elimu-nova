import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Allow teachers and super admins to generate lesson plans
    const userRole = session.user.role
    if (userRole !== 'TEACHER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied - Teachers only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subject, grade, topic, duration, objectives, prerequisites } = body

    // Validate required fields
    if (!subject || !grade || !topic || !duration || !objectives) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, grade, topic, duration, and objectives are required' },
        { status: 400 }
      )
    }

    // Filter out empty objectives and prerequisites
    const filteredObjectives = Array.isArray(objectives) 
      ? objectives.filter((obj: string) => obj && obj.trim() !== '')
      : []
    const filteredPrerequisites = Array.isArray(prerequisites) 
      ? prerequisites.filter((prereq: string) => prereq && prereq.trim() !== '') 
      : []

    if (filteredObjectives.length === 0) {
      return NextResponse.json(
        { error: 'At least one learning objective is required' },
        { status: 400 }
      )
    }

    // Language Logic: Only use Swahili for Kiswahili subject, everything else in English
    const isKiswahili = subject.toLowerCase() === 'kiswahili'
    const languageInstruction = isKiswahili 
      ? 'IMPORTANT: Generate this lesson plan entirely in Swahili language. All content, instructions, and explanations should be in Swahili.'
      : 'IMPORTANT: Generate this lesson plan entirely in English language. All content, instructions, and explanations should be in English.'

    const prompt = `Create a detailed lesson plan for:
Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
Duration: ${duration} minutes
Learning Objectives: ${filteredObjectives.join(', ')}
Prerequisites: ${filteredPrerequisites.length > 0 ? filteredPrerequisites.join(', ') : 'None specified'}

${languageInstruction}

Please create a comprehensive lesson plan that includes:

## Lesson Plan Structure:

### 1. Lesson Information
- Subject: ${subject}
- Grade: ${grade}
- Topic: ${topic}
- Duration: ${duration} minutes

### 2. Learning Objectives
List the specific learning objectives for this lesson.

### 3. Materials Needed
List all materials, resources, and equipment needed for the lesson.

### 4. Lesson Activities (with timing)
Break down the lesson into phases:
- **Introduction (X minutes):** Opening activities and review
- **Main Activity (X minutes):** Core learning activities
- **Practice (X minutes):** Guided and independent practice
- **Conclusion (X minutes):** Summary and wrap-up

### 5. Assessment Strategies
- Formative assessment methods
- Summative assessment methods

### 6. Homework/Extension Activities
Assignments or activities for students to complete outside class.

### 7. Teacher Notes
Additional notes and tips for effective lesson delivery.

Format the response clearly with proper headings and bullet points for easy reading.`

    const messages = [
      {
        role: 'system' as const,
        content: isKiswahili 
          ? "You are an expert educational consultant specializing in creating detailed, practical lesson plans in Swahili language. You have deep knowledge of Kiswahili curriculum, Swahili teaching methods, and East African education systems. Focus on student engagement, clear learning objectives, and effective teaching strategies. CRITICAL: Always respond entirely in Swahili language for Kiswahili subjects."
          : "You are an expert educational consultant specializing in creating detailed, practical lesson plans. Focus on student engagement, clear learning objectives, and effective teaching strategies. Create well-structured, practical lesson plans that teachers can easily follow. CRITICAL: Always respond entirely in English language for all subjects except Kiswahili."
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    console.log('Generating lesson plan for:', { subject, grade, topic, duration })

    // Generate lesson plan using OpenAI
    const content = await OpenAIService.generateText(messages, {
      maxTokens: 2000,
      temperature: 0.7
    })

    console.log('Lesson plan generated successfully, length:', content.length)

    return NextResponse.json({
      success: true,
      content: content,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
        subject,
        grade,
        topic,
        duration,
        objectives: filteredObjectives,
        prerequisites: filteredPrerequisites,
        language: isKiswahili ? 'swahili' : 'english'
      }
    })
  } catch (error) {
    console.error('Error generating lesson plan:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate lesson plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
