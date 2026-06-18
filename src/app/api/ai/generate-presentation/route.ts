import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { simplePresentationGenerator } from '@/lib/simple-presentation-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      title, 
      subject, 
      grade, 
      topic, 
      duration, 
      objectives, 
      difficulty, 
      slideCount,
      content, 
      slides, 
      generateImages, 
      imageStyle, 
      theme 
    } = await request.json()

    // Handle both old format (title) and new format (subject/grade/topic)
    const presentationTitle = title || `${subject} - ${topic}` || 'AI Generated Presentation'
    
    if (!presentationTitle && !subject && !topic) {
      return NextResponse.json({ error: 'Title, subject, or topic is required' }, { status: 400 })
    }

    console.log('Generating AI presentation:', presentationTitle)
    console.log('Subject:', subject, 'Grade:', grade, 'Topic:', topic)
    console.log('Generate images:', generateImages !== false) // Default to true

    // If we have structured data (subject, grade, topic), generate AI content first
    if (subject && grade && topic && !slides && !content) {
      console.log('Generating AI content for presentation...')
      
      // Generate AI content using OpenAI
      const aiContent = await generateAIPresentation({
        subject,
        grade,
        topic,
        duration: duration || 45,
        objectives: objectives || [],
        difficulty: difficulty || 'medium',
        slideCount: slideCount || 8
      })

      // Return the AI-generated content as JSON (not a file)
      return NextResponse.json({
        presentation: aiContent,
        title: presentationTitle,
        subject,
        grade,
        topic,
        slideCount: aiContent.split('\n').filter(line => line.includes('Slide')).length
      })
    }

    // If we have slides or content, generate the actual PowerPoint file
    let buffer: Buffer

    if (slides && Array.isArray(slides)) {
      console.log('🎯 Generating PowerPoint from slides...')
      
      // Convert slides to simple format
      const simpleSlides = slides.map((slide, index) => ({
        id: slide.id || `slide-${index}`,
        title: slide.title || `Slide ${index + 1}`,
        content: Array.isArray(slide.content) ? slide.content : [slide.content || ''],
        imagePrompt: slide.imagePrompt || slide.visualSuggestions?.join(', '),
        layout: slide.layout === 'image' ? 'image' as const :
                slide.layout === 'split' ? 'split' as const :
                'content' as const
      }))

      buffer = await simplePresentationGenerator.generatePresentation({
        title: presentationTitle,
        author: session.user.name || 'ElimuNova User',
        slides: simpleSlides,
        generateImages: generateImages !== false,
        imageStyle: imageStyle === 'vivid' ? 'vivid' : 'natural',
        userId: session.user.id,
        teacherId: session.user.role === 'TEACHER' ? session.user.id : undefined
      })
    } else if (content) {
      console.log('🎯 Generating PowerPoint from content...')
      
      // Parse content into simple slides
      const contentSlides = parseContentToSlides(content)
      
      buffer = await simplePresentationGenerator.generatePresentation({
        title: presentationTitle,
        author: session.user.name || 'ElimuNova User',
        slides: contentSlides,
        generateImages: generateImages !== false,
        imageStyle: imageStyle === 'vivid' ? 'vivid' : 'natural',
        userId: session.user.id,
        teacherId: session.user.role === 'TEACHER' ? session.user.id : undefined
      })
    } else {
      return NextResponse.json(
        { error: 'Either slides or content is required for file generation' },
        { status: 400 }
      )
    }

    // Return the PowerPoint file
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${presentationTitle.replace(/[^a-z0-9]/gi, '_')}.pptx"`
      }
    })

  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate presentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to parse content into slides
function parseContentToSlides(content: string) {
  const slides = []
  const sections = content.split(/(?=^#|\n#)/m).filter(section => section.trim())
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()
    const lines = section.split('\n')
    
    let title = ''
    let contentPoints = []
    let imagePrompt = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine.startsWith('#')) {
        title = trimmedLine.replace(/^#+\s*/, '')
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        contentPoints.push(trimmedLine.substring(2))
      } else if (trimmedLine.toLowerCase().includes('image:') || trimmedLine.toLowerCase().includes('visual:')) {
        imagePrompt = trimmedLine.replace(/^.*?(image|visual):\s*/i, '')
      } else if (trimmedLine && !trimmedLine.includes(':')) {
        contentPoints.push(trimmedLine)
      }
    }
    
    if (title || contentPoints.length > 0) {
      slides.push({
        id: `slide-${i}`,
        title: title || `Slide ${i + 1}`,
        content: contentPoints.length > 0 ? contentPoints : ['Content for this slide'],
        imagePrompt: imagePrompt || `Educational illustration for ${title}`,
        layout: 'split' as const
      })
    }
  }
  
  return slides
}

// AI Content Generation Function
async function generateAIPresentation(params: {
  subject: string
  grade: string
  topic: string
  duration: number
  objectives: string[]
  difficulty: string
  slideCount: number
}): Promise<string> {
  try {
    const { subject, grade, topic, duration, objectives, difficulty, slideCount } = params

    const prompt = `Create a comprehensive educational presentation about "${topic}" for ${grade} ${subject} students.

Requirements:
- Duration: ${duration} minutes
- Number of slides: ${slideCount}
- Difficulty level: ${difficulty}
- Learning objectives: ${objectives.join(', ')}

CRITICAL: Each slide MUST include specific, detailed visual suggestions for AI image generation.

Please generate a detailed presentation with the following EXACT structure for each slide:

# Slide [number]: [Title]
**Content:**
[Detailed bullet points explaining the concept - make it engaging and age-appropriate]

**Speaker Notes:**
[Detailed notes for the teacher including explanations, examples, and teaching tips]

**Image Prompt:**
[REQUIRED: Specific, detailed prompt for AI image generation - educational illustration for ${grade} students]

**Layout:**
[Choose: title, content, image, or split]

---

Make sure to:
1. Start with an engaging title slide
2. Include clear learning objectives
3. Break down complex concepts into digestible parts
4. Provide practical examples relevant to ${grade} students
5. End with a summary slide
6. EVERY slide must have a detailed Image Prompt
7. Make content age-appropriate for ${grade} level

Generate exactly ${slideCount} slides.`

    // Use the ElimuNova AI waterfall
    const { OpenAIService } = await import('@/lib/openai-service')
    const generatedContent = await OpenAIService.generateLongContent(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4000, temperature: 0.7 }
    )

    if (!generatedContent) throw new Error('No content generated from AI')
    console.log('AI presentation generated successfully')
    return generatedContent

  } catch (error) {
    console.error('AI generation error:', error)
    return generateFallbackPresentation(params)
  }
}

// Fallback presentation generator
function generateFallbackPresentation(params: {
  subject: string
  grade: string
  topic: string
  slideCount: number
}): string {
  const { subject, grade, topic, slideCount } = params

  let content = `# Slide 1: ${topic}
**Content:**
Welcome to our lesson on ${topic}
This presentation will help you understand the key concepts

**Speaker Notes:**
Introduce the topic and engage students with a question about their prior knowledge

**Visual Suggestions:**
Title slide with relevant subject imagery

---

# Slide 2: Learning Objectives
**Content:**
By the end of this lesson, you will be able to:
• Understand the main concepts of ${topic}
• Apply knowledge in practical situations
• Explain key terms and processes

**Speaker Notes:**
Review objectives with students and explain what they will learn

**Visual Suggestions:**
Bulleted list with icons for each objective

---`

  // Generate additional slides
  for (let i = 3; i <= slideCount - 1; i++) {
    content += `
# Slide ${i}: Key Concept ${i - 2}
**Content:**
Important information about ${topic}
• Key point 1
• Key point 2
• Key point 3

**Speaker Notes:**
Explain this concept clearly with examples relevant to ${grade} students

**Visual Suggestions:**
Diagrams or images that illustrate the concept

---`
  }

  // Summary slide
  content += `
# Slide ${slideCount}: Summary
**Content:**
Let's review what we learned about ${topic}:
• Main concept 1
• Main concept 2
• Main concept 3

**Speaker Notes:**
Summarize key points and check for understanding

**Visual Suggestions:**
Summary graphic with key takeaways

---`

  return content
}
