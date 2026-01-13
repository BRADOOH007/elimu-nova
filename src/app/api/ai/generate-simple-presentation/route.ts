import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      subject, 
      grade, 
      topic, 
      duration = 45,
      slideCount = 8,
      difficulty = 'medium'
    } = await request.json()

    if (!subject || !grade || !topic) {
      return NextResponse.json({ 
        error: 'Subject, grade, and topic are required' 
      }, { status: 400 })
    }

    console.log('Generating AI presentation:', { subject, grade, topic, duration, slideCount })

    // Generate AI content using OpenAI
    const aiContent = await generateAIPresentation({
      subject,
      grade,
      topic,
      duration,
      slideCount,
      difficulty
    })

    // Parse the AI content into structured slides
    const slides = parseAIContentToSlides(aiContent)

    console.log('Generated AI content length:', aiContent.length)
    console.log('Parsed slides count:', slides.length)

    // Ensure we have at least some slides
    if (slides.length === 0) {
      console.log('No slides parsed, creating basic fallback slides')
      const fallbackSlides = [
        {
          title: `Introduction to ${topic}`,
          content: [`Welcome to our lesson on ${topic}`, `This is a ${grade} ${subject} presentation`],
          speakerNotes: `Introduce the topic of ${topic} to ${grade} students`,
          imageDescription: `Educational illustration showing an introduction to ${topic}, suitable for ${grade} students learning ${subject}`,
          layout: 'split'
        },
        {
          title: `Key Concepts`,
          content: [`Main concept 1 about ${topic}`, `Main concept 2 about ${topic}`, `Main concept 3 about ${topic}`],
          speakerNotes: `Explain the key concepts of ${topic}`,
          imageDescription: `Educational diagram showing the key concepts and main ideas of ${topic} for ${grade} ${subject} students`,
          layout: 'split'
        },
        {
          title: `Summary`,
          content: [`Review what we learned about ${topic}`, `Key takeaways for ${grade} students`],
          speakerNotes: `Summarize the lesson on ${topic}`,
          imageDescription: `Summary graphic showing the main takeaways and conclusions about ${topic} for ${grade} students`,
          layout: 'split'
        }
      ]
      slides.push(...fallbackSlides)
    }

    // Get teacher ID for database storage
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Save presentation to database
    const presentationData = {
      title: `${subject}: ${topic}`,
      subject,
      grade,
      topic,
      duration,
      slideCount: slides.length,
      slides,
      content: aiContent,
      difficulty,
      metadata: {
        generatedAt: new Date().toISOString(),
        slideCount: slides.length,
        duration,
        difficulty,
        hasImages: true
      }
    }

    const savedPresentation = await prisma.aIGeneratedContent.create({
      data: {
        title: presentationData.title,
        content: JSON.stringify(presentationData),
        type: 'POWERPOINT',
        subject,
        grade,
        topic,
        metadata: presentationData.metadata,
        teacherId: teacher.id
      }
    })

    return NextResponse.json({
      success: true,
      presentationId: savedPresentation.id,
      presentation: {
        id: savedPresentation.id,
        title: `${subject}: ${topic}`,
        subject,
        grade,
        topic,
        duration,
        slideCount: slides.length,
        slides,
        content: aiContent,
        createdAt: savedPresentation.createdAt,
        updatedAt: savedPresentation.updatedAt
      }
    })

  } catch (error) {
    console.error('AI presentation generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate presentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// AI Content Generation Function
async function generateAIPresentation(params: {
  subject: string
  grade: string
  topic: string
  duration: number
  slideCount: number
  difficulty: string
}): Promise<string> {
  try {
    const { subject, grade, topic, duration, slideCount, difficulty } = params

    const prompt = `Create a comprehensive educational presentation about "${topic}" for ${grade} ${subject} students.

Requirements:
- Duration: ${duration} minutes
- Number of slides: ${slideCount}
- Difficulty level: ${difficulty}
- Make it engaging and age-appropriate for ${grade} students

CRITICAL: Each slide MUST include a detailed, specific image description for AI image generation.

Please generate a detailed presentation with the following structure for each slide:

SLIDE [number]: [Title]
Content:
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

Speaker Notes: [Detailed notes for the teacher]

Image Description: [REQUIRED: Very specific, detailed description for AI image generation. Include visual elements, colors, style, and educational context. Make it suitable for ${grade} students learning ${subject}]

---

EXAMPLE:
SLIDE 1: Introduction to Photosynthesis
Content:
- Photosynthesis is how plants make their own food
- Plants use sunlight, water, and carbon dioxide
- This process produces oxygen that we breathe
- It happens mainly in the leaves of plants

Speaker Notes: Start by asking students what they know about how plants get energy. Explain that unlike animals, plants don't eat food - they make it themselves through photosynthesis.

Image Description: Educational diagram showing a green plant with bright yellow sunlight rays coming from above, blue water droplets being absorbed by roots from brown soil, and carbon dioxide molecules (CO2) entering through green leaves, with oxygen bubbles (O2) coming out of leaves. The style should be colorful, cartoon-like, and suitable for grade school students with clear labels and arrows showing the process flow.

---

Generate exactly ${slideCount} slides following this format. Make sure to:
1. Start with an engaging title slide
2. Include clear learning objectives
3. Break down complex concepts into simple parts
4. Provide practical examples relevant to ${grade} students
5. Include interactive elements or questions
6. End with a summary slide
7. Make all content age-appropriate for ${grade} level
8. EVERY slide must have a detailed "Image Description" for AI image generation
9. Make image descriptions very specific with colors, objects, style, and educational context
10. Ensure images are appropriate and helpful for ${grade} students learning ${subject}`

    const response = await OpenAIService.generateAIContent(prompt, {
      maxTokens: 3000,
      temperature: 0.7
    })

    if (!response) {
      throw new Error('No content generated from AI')
    }

    console.log('AI presentation generated successfully')
    return response

  } catch (error) {
    console.error('AI generation error:', error)
    // Fallback content if AI fails
    return generateFallbackPresentation(params)
  }
}

// Parse AI content into structured slides
function parseAIContentToSlides(content: string) {
  console.log('Parsing AI content:', content.substring(0, 500) + '...')
  
  const slides = []
  
  // Try multiple parsing strategies
  
  // Strategy 1: Split by "---" or "SLIDE" markers
  let slideBlocks = content.split('---').filter(block => block.trim())
  
  if (slideBlocks.length <= 1) {
    // Strategy 2: Split by "SLIDE" keyword
    slideBlocks = content.split(/(?=SLIDE \d+:)/).filter(block => block.trim())
  }
  
  if (slideBlocks.length <= 1) {
    // Strategy 3: Split by "# Slide" markdown format
    slideBlocks = content.split(/(?=# Slide \d+:)/).filter(block => block.trim())
  }

  console.log('Found slide blocks:', slideBlocks.length)

  for (const block of slideBlocks) {
    const lines = block.trim().split('\n')
    let title = ''
    let contentPoints = []
    let speakerNotes = ''
    let imageDescription = ''

    let currentSection = ''

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Extract title from various formats
      if (trimmedLine.match(/^(SLIDE \d+:|# Slide \d+:)/)) {
        title = trimmedLine.replace(/^(SLIDE \d+:|# Slide \d+:)\s*/, '')
      } else if (trimmedLine.toLowerCase().includes('content:')) {
        currentSection = 'content'
        // Check if content is on the same line
        const contentMatch = trimmedLine.match(/content:\s*(.+)/i)
        if (contentMatch) {
          contentPoints.push(contentMatch[1])
        }
      } else if (trimmedLine.toLowerCase().includes('speaker notes:')) {
        currentSection = 'notes'
        speakerNotes = trimmedLine.replace(/^.*speaker notes:\s*/i, '')
      } else if (trimmedLine.toLowerCase().includes('image description:') || trimmedLine.toLowerCase().includes('image prompt:')) {
        currentSection = 'image'
        imageDescription = trimmedLine.replace(/^.*(image description|image prompt):\s*/i, '')
      } else if (trimmedLine.startsWith('- ') && currentSection === 'content') {
        contentPoints.push(trimmedLine.substring(2))
      } else if (trimmedLine.startsWith('• ') && currentSection === 'content') {
        contentPoints.push(trimmedLine.substring(2))
      } else if (currentSection === 'content' && trimmedLine && !trimmedLine.includes(':')) {
        // Add non-bulleted content points
        contentPoints.push(trimmedLine)
      } else if (currentSection === 'notes' && trimmedLine && !trimmedLine.includes(':')) {
        speakerNotes += ' ' + trimmedLine
      } else if (currentSection === 'image' && trimmedLine && !trimmedLine.includes(':')) {
        imageDescription += ' ' + trimmedLine
      }
    }

    // Clean up and validate slide
    if (title || contentPoints.length > 0) {
      const slide: any = {
        title: title || `Slide ${slides.length + 1}`,
        content: contentPoints.length > 0 ? contentPoints : ['Content for this slide'],
        speakerNotes: speakerNotes.trim() || 'Speaker notes for this slide',
        imageDescription: imageDescription.trim() || `Educational illustration showing ${title || 'slide content'} for students`,
        layout: 'split' // Always use split layout for automatic image generation
      }
      
      slides.push(slide)
      console.log(`Parsed slide ${slides.length}:`, slide.title)
    }
  }

  // If no slides were parsed, create a fallback structure
  if (slides.length === 0) {
    console.log('No slides parsed, creating fallback slides from raw content')
    
    // Split content into paragraphs and create slides
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    
    for (let i = 0; i < Math.min(paragraphs.length, 8); i++) {
      const paragraph = paragraphs[i].trim()
      if (paragraph) {
        slides.push({
          title: `Slide ${i + 1}`,
          content: [paragraph],
          speakerNotes: `Speaker notes for slide ${i + 1}`,
          imageDescription: `Educational illustration for slide ${i + 1} content: ${paragraph.substring(0, 100)}`,
          layout: 'split' // Use split layout for automatic image generation
        })
      }
    }
  }

  console.log('Final parsed slides:', slides.length)
  return slides
}

// Fallback presentation generator
function generateFallbackPresentation(params: {
  subject: string
  grade: string
  topic: string
  slideCount: number
}): string {
  const { subject, grade, topic, slideCount } = params

  let content = `SLIDE 1: ${topic}
Content:
- Welcome to our lesson on ${topic}
- This presentation will help you understand the key concepts
- We'll explore practical applications
- Let's begin our learning journey

Speaker Notes: Introduce the topic and engage students with a question about their prior knowledge

Image Description: Title slide with relevant ${subject} imagery

---

SLIDE 2: Learning Objectives
Content:
- Understand the main concepts of ${topic}
- Apply knowledge in practical situations
- Explain key terms and processes
- Connect learning to real-world examples

Speaker Notes: Review objectives with students and explain what they will learn

Image Description: Icons representing different learning objectives

---`

  // Generate additional slides
  for (let i = 3; i <= slideCount - 1; i++) {
    content += `
SLIDE ${i}: Key Concept ${i - 2}
Content:
- Important information about ${topic}
- Key point related to ${subject}
- Practical example for ${grade} students
- Connection to previous learning

Speaker Notes: Explain this concept clearly with examples relevant to ${grade} students

Image Description: Diagram or illustration showing the key concept

---`
  }

  // Summary slide
  content += `
SLIDE ${slideCount}: Summary
Content:
- Let's review what we learned about ${topic}
- Key takeaway 1
- Key takeaway 2
- Questions for further exploration

Speaker Notes: Summarize key points and check for understanding

Image Description: Summary graphic with key takeaways

---`

  return content
}