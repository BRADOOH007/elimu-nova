import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import PptxGenJS from 'pptxgenjs'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { z } from 'zod'

// Validation schema
const PresentationRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  numSlides: z.number().min(1).max(12).default(6),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  includeImages: z.boolean().default(true),
  imageSize: z.enum(['512x512', '1024x1024']).default('1024x1024')
})

// Slide schema for validation
const SlideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).max(5),
  speaker_notes: z.string(),
  image_prompt: z.string()
})

const PresentationPlanSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema)
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input
    const body = await request.json()
    const validatedInput = PresentationRequestSchema.parse(body)
    
    const { topic, numSlides, gradeLevel, subject, includeImages, imageSize } = validatedInput

    console.log('🎯 Generating AI presentation:', { topic, numSlides, gradeLevel, subject, includeImages })

    // Step 1: Generate slide plan using OpenAI
    const slidePlan = await generateSlidePlan({
      topic,
      numSlides,
      gradeLevel: gradeLevel || 'General',
      subject: subject || 'General',
      includeImages
    })

    console.log('📋 Generated slide plan with', slidePlan.slides.length, 'slides')

    // Step 2: Generate images for each slide (if enabled)
    const slidesWithImages = await Promise.all(
      slidePlan.slides.map(async (slide, index) => {
        if (!includeImages || !slide.image_prompt) {
          return { ...slide, imageUrl: null }
        }

        try {
          const imageUrl = await generateSlideImage(slide.image_prompt, imageSize, index + 1)
          return { ...slide, imageUrl }
        } catch (error) {
          console.error(`Failed to generate image for slide ${index + 1}:`, error)
          return { ...slide, imageUrl: null }
        }
      })
    )

    console.log('🖼️ Generated images for', slidesWithImages.filter(s => s.imageUrl).length, 'slides')

    // Step 3: Create presentation ID and directories
    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create directories
    const presentationsDir = path.join(process.cwd(), 'public', 'ai-presentations')
    const imagesDir = path.join(process.cwd(), 'public', 'ai-images', presentationId)
    
    if (!existsSync(presentationsDir)) {
      await mkdir(presentationsDir, { recursive: true })
    }
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true })
    }

    // Step 4: Build PPTX using PptxGenJS
    const pptxBuffer = await buildPresentationPPTX({
      title: slidePlan.title,
      slides: slidesWithImages,
      presentationId
    })

    // Step 5: Save PPTX file
    const pptxPath = path.join(presentationsDir, `${presentationId}.pptx`)
    await writeFile(pptxPath, pptxBuffer)
    
    const pptxUrl = `/ai-presentations/${presentationId}.pptx`

    console.log('💾 Saved PPTX to:', pptxUrl)

    // Step 6: Save metadata to database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find student or teacher
    let studentId = null
    let teacherId = null

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (student) {
      studentId = student.id
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (teacher) {
        teacherId = teacher.id
      }
    }

    // Save to database
    const savedPresentation = await prisma.aIGeneratedContent.create({
      data: {
        title: slidePlan.title,
        content: JSON.stringify({
          slides: slidesWithImages.map(slide => ({
            title: slide.title,
            bullets: slide.bullets,
            speakerNotes: slide.speaker_notes,
            imageUrl: slide.imageUrl
          })),
          pptxUrl,
          presentationId,
          metadata: {
            topic,
            gradeLevel,
            subject,
            numSlides: slidesWithImages.length,
            includeImages,
            imageSize,
            generatedAt: new Date().toISOString()
          }
        }),
        type: 'POWERPOINT',
        subject: subject || 'General',
        grade: gradeLevel || 'General',
        topic,
        metadata: {
          presentationId,
          pptxUrl,
          slideCount: slidesWithImages.length,
          hasImages: includeImages
        },
        teacherId: teacherId || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ Presentation saved to database with ID:', savedPresentation.id)

    // Step 7: Return response
    return NextResponse.json({
      success: true,
      presentationId,
      pptxUrl,
      title: slidePlan.title,
      slideCount: slidesWithImages.length,
      slides: slidesWithImages.map(slide => ({
        title: slide.title,
        bullets: slide.bullets,
        imageUrl: slide.imageUrl,
        speakerNotes: slide.speaker_notes
      })),
      metadata: {
        topic,
        gradeLevel,
        subject,
        includeImages,
        generatedAt: new Date().toISOString()
      },
      databaseId: savedPresentation.id
    })

  } catch (error) {
    console.error('❌ Presentation generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to generate presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Generate slide plan using OpenAI
async function generateSlidePlan(params: {
  topic: string
  numSlides: number
  gradeLevel: string
  subject: string
  includeImages: boolean
}): Promise<{ title: string; slides: Array<{ title: string; bullets: string[]; speaker_notes: string; image_prompt: string }> }> {
  const { topic, numSlides, gradeLevel, subject, includeImages } = params

  const systemPrompt = `You are an expert educational content creator. Generate a presentation plan as STRICT JSON only.

CRITICAL RULES:
1. Use ${gradeLevel}-appropriate language
2. Maximum 5 bullets per slide
3. ${includeImages ? 'Each slide MUST have image_prompt' : 'No image prompts needed'}
4. Image prompts must specify "NO TEXT in image, clean educational illustration, white background, thick lines"
5. Output MUST be valid JSON only - no markdown, no explanations
6. speaker_notes should be detailed teaching guidance

JSON Schema:
{
  "title": "Presentation title",
  "slides": [
    {
      "title": "Slide title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "speaker_notes": "Detailed teaching notes and explanations",
      "image_prompt": "Educational illustration prompt with NO TEXT, clean vector style, white background, thick lines"
    }
  ]
}`

  const userPrompt = `Create a ${numSlides}-slide educational presentation about "${topic}" for ${gradeLevel} ${subject} students.

Requirements:
- Grade-appropriate language for ${gradeLevel}
- Educational and engaging content
- Clear learning progression
- ${includeImages ? 'Detailed image prompts for visual learning' : 'Focus on text content'}
- Practical examples and applications

Generate ONLY valid JSON following the exact schema above.`

  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    // Parse and validate JSON
    const parsed = JSON.parse(content)
    const validated = PresentationPlanSchema.parse(parsed)
    
    console.log('✅ Generated and validated slide plan')
    return validated

  } catch (error) {
    console.error('❌ Error generating slide plan:', error)
    throw new Error(`Failed to generate slide plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Generate image for a slide
async function generateSlideImage(prompt: string, size: string, slideNumber: number): Promise<string> {
  try {
    const enhancedPrompt = `${prompt}, no text, clean educational illustration, white background, thick lines, vector style, suitable for educational presentation`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      size: size as '512x512' | '1024x1024',
      quality: 'standard',
      n: 1
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Download and save the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const fileName = `slide-${slideNumber.toString().padStart(2, '0')}.png`
    const imagePath = path.join(process.cwd(), 'public', 'ai-images', 'temp', fileName)
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'public', 'ai-images', 'temp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    await writeFile(imagePath, Buffer.from(imageBuffer))
    
    const savedImageUrl = `/ai-images/temp/${fileName}`
    console.log(`🖼️ Generated and saved image for slide ${slideNumber}:`, savedImageUrl)
    
    return savedImageUrl

  } catch (error) {
    console.error(`❌ Error generating image for slide ${slideNumber}:`, error)
    throw error
  }
}

// Build PPTX using PptxGenJS
async function buildPresentationPPTX(params: {
  title: string
  slides: Array<{ title: string; bullets: string[]; speaker_notes: string; imageUrl: string | null }>
  presentationId: string
}): Promise<Buffer> {
  const { title, slides, presentationId } = params

  try {
    const pptx = new PptxGenJS()

    // Set presentation properties
    pptx.author = 'ElimuNova AI'
    pptx.company = 'ElimuNova'
    pptx.title = title
    pptx.subject = 'AI Generated Educational Presentation'

    // Define theme colors
    const primaryColor = '2E5090'
    const accentColor = '4472C4'
    const textColor = '1A1A1A'

    // Create slides
    slides.forEach((slideData, index) => {
      const slide = pptx.addSlide()

      if (index === 0) {
        // Title slide
        slide.addText(slideData.title, {
          x: 0.5,
          y: 2,
          w: 9,
          h: 2,
          fontSize: 36,
          bold: true,
          color: primaryColor,
          align: 'center'
        })

        slide.addText('Generated by ElimuNova AI', {
          x: 0.5,
          y: 4.5,
          w: 9,
          h: 0.5,
          fontSize: 18,
          color: accentColor,
          align: 'center'
        })
      } else {
        // Content slide
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 28,
          bold: true,
          color: primaryColor
        })

        // Add bullets
        const bulletText = slideData.bullets.map(bullet => `• ${bullet}`).join('\n')
        
        if (slideData.imageUrl) {
          // Split layout with image
          slide.addText(bulletText, {
            x: 0.5,
            y: 1.8,
            w: 4.5,
            h: 4,
            fontSize: 16,
            color: textColor,
            valign: 'top'
          })

          // Add image placeholder (since we can't easily load external images in PptxGenJS)
          slide.addText('[AI Generated Image]', {
            x: 5.5,
            y: 1.8,
            w: 4,
            h: 4,
            fontSize: 14,
            color: accentColor,
            align: 'center',
            valign: 'middle',
            border: { type: 'solid', color: accentColor, pt: 2 }
          })
        } else {
          // Full width content
          slide.addText(bulletText, {
            x: 0.5,
            y: 1.8,
            w: 9,
            h: 4,
            fontSize: 18,
            color: textColor,
            valign: 'top'
          })
        }

        // Add speaker notes
        if (slideData.speaker_notes) {
          slide.addNotes(slideData.speaker_notes)
        }
      }
    })

    // Generate buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
    console.log('✅ Generated PPTX buffer')
    
    return buffer

  } catch (error) {
    console.error('❌ Error building PPTX:', error)
    throw new Error(`Failed to build PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}