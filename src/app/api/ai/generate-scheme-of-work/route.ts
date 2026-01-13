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

    // Allow teachers and super admins to generate schemes of work
    const userRole = session.user.role
    if (userRole !== 'TEACHER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied - Teachers only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subject, grade, topic, duration, lessonsPerWeek, prerequisites, language = 'english', topics: requestTopics } = body

    // Use topics array if provided, otherwise fall back to single topic
    const topicsList = requestTopics && requestTopics.length > 0 ? requestTopics : (topic ? [topic] : [])

    // Validate required fields
    if (!subject || !grade || topicsList.length === 0 || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, grade, topics, and duration are required' },
        { status: 400 }
      )
    }

    // Filter out empty prerequisites
    const filteredPrerequisites = Array.isArray(prerequisites) 
      ? prerequisites.filter((prereq: string) => prereq && prereq.trim() !== '') 
      : []

    console.log('Generating scheme of work for topics:', topicsList)

    // Language Logic: Only use Swahili for Kiswahili subject, everything else in English
    const isKiswahili = subject.toLowerCase() === 'kiswahili'
    const languageInstruction = isKiswahili 
      ? 'IMPORTANT: Generate this scheme of work entirely in Swahili language. All content, instructions, and explanations should be in Swahili.'
      : 'IMPORTANT: Generate this scheme of work entirely in English language. All content, instructions, and explanations should be in English.'

    const prompt = `Create a comprehensive scheme of work for:
Subject: ${subject}
Grade: ${grade}
Duration: ${duration} weeks
Lessons per week: ${lessonsPerWeek || 5}
Topics to cover: ${topicsList.join(', ')}
Prerequisites: ${filteredPrerequisites.length > 0 ? filteredPrerequisites.join(', ') : 'None specified'}

${languageInstruction}

## Scheme of Work Structure:

Please create a detailed scheme of work with the following format:

### Overview
- Subject: ${subject}
- Grade: ${grade}
- Duration: ${duration} weeks
- Lessons per week: ${lessonsPerWeek || 5}
- Total lessons: ${(duration * (lessonsPerWeek || 5))}

### Topics Coverage
You must cover ALL these topics: ${topicsList.join(', ')}

### Weekly Breakdown

For each week, provide:

**Week X: [Main Topic Name]**

**Lesson 1: [Specific Lesson Topic]**
- **Objectives:**
  • [Learning objective 1]
  • [Learning objective 2]
  • [Learning objective 3]

- **Teaching Activities:**
  • [Activity 1 with timing]
  • [Activity 2 with timing]
  • [Activity 3 with timing]

- **Resources and Materials:**
  • [Resource 1]
  • [Resource 2]
  • [Resource 3]

- **Assessment:**
  • [Assessment method 1]
  • [Assessment method 2]

**Lesson 2: [Next Lesson Topic]**
[Same structure as Lesson 1]

[Continue for all lessons in the week]

### Assessment Overview
- Continuous assessment methods
- Mid-term evaluation
- End-of-term assessment

### Resources Summary
- Required textbooks
- Supplementary materials
- Digital resources

CRITICAL REQUIREMENTS:
1. Generate content for exactly ${duration} weeks
2. Include exactly ${lessonsPerWeek || 5} lessons per week
3. Cover ALL ${topicsList.length} topics provided
4. Each lesson must have objectives, activities, resources, and assessment
5. Use clear formatting with bullet points
6. Ensure logical progression of topics across weeks`

    const messages = [
      {
        role: 'system' as const,
        content: isKiswahili 
          ? "You are an expert curriculum developer specializing in creating comprehensive schemes of work in Swahili language. You have deep knowledge of Kiswahili curriculum, Swahili teaching methods, and East African education systems. Focus on progressive learning, clear objectives, and practical implementation strategies. CRITICAL: Always respond entirely in Swahili language for Kiswahili subjects. IMPORTANT: You MUST cover ALL topics provided in the request - never skip any topic."
          : "You are an expert curriculum developer specializing in creating comprehensive schemes of work. Focus on progressive learning, clear objectives, and practical implementation strategies. Create well-structured schemes that teachers can easily follow and implement. CRITICAL: Always respond entirely in English language for all subjects except Kiswahili. IMPORTANT: You MUST cover ALL topics provided in the request - never skip any topic, ensure each topic gets dedicated lesson content."
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    console.log('Generating scheme of work for:', { subject, grade, topics: topicsList, duration })

    // Generate scheme of work using OpenAI
    const content = await OpenAIService.generateText(messages, {
      maxTokens: 2500,
      temperature: 0.7
    })

    console.log('Scheme of work generated successfully, length:', content.length)

    return NextResponse.json({
      success: true,
      content: content,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
        subject,
        grade,
        topics: topicsList,
        duration,
        lessonsPerWeek: lessonsPerWeek || 5,
        totalLessons: duration * (lessonsPerWeek || 5),
        prerequisites: filteredPrerequisites,
        language: isKiswahili ? 'swahili' : 'english'
      }
    })
  } catch (error) {
    console.error('Error generating scheme of work:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate scheme of work', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}