import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import PptxGenJS from 'pptxgenjs'
import { writeFile, mkdir, readFile } from 'fs/promises'
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

export const POST = route({}, async (request, { user }) => {

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
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find student or teacher
    let studentId = null
    let teacherId = null

    const student = await prisma.student.findUnique({
      where: { userId: dbUser.id }
    })

    if (student) {
      studentId = student.id
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: dbUser.id }
      })
      if (teacher) {
        teacherId = teacher.id
      }
    }

    // Save to database
    const savedPresentation = await (prisma.aIGeneratedContent.create as any)({
      data: {
        title: slidePlan.title,
        content: JSON.stringify({
          slides: slidesWithImages.map((slide: any) => ({
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
})

// Generate slide plan using waterfall AI
async function generateSlidePlan(params: {
  topic: string
  numSlides: number
  gradeLevel: string
  subject: string
  includeImages: boolean
}): Promise<{ title: string; slides: Array<{ title: string; bullets: string[]; speaker_notes: string; image_prompt: string }> }> {
  const { topic, numSlides, gradeLevel, subject, includeImages } = params

  const systemPrompt = `You are an expert educational content creator. Generate a presentation plan as STRICT JSON only. No markdown, no explanation — raw JSON only.
JSON Schema: { "title": "string", "slides": [{ "title": "string", "bullets": ["string"], "speaker_notes": "string", "image_prompt": "string" }] }
Rules: max 5 bullets per slide, grade-appropriate for ${gradeLevel}, image_prompt must say NO TEXT in image.`

  const userPrompt = `Create a ${numSlides}-slide educational presentation about "${topic}" for ${gradeLevel} ${subject} students.
${includeImages ? 'Each slide needs a detailed image_prompt.' : 'Set image_prompt to empty string.'}
Return ONLY valid JSON.`

  const raw = await OpenAIService.generateLongContent([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt   },
  ], { maxTokens: 3000, temperature: 0.7 })

  // Robust JSON extraction
  const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('No JSON in slide plan response')
  const parsed = JSON.parse(raw.slice(start, end + 1))
  if (!parsed.title || !Array.isArray(parsed.slides)) throw new Error('Invalid slide plan structure')
  console.log('✅ Generated slide plan:', parsed.slides.length, 'slides')
  return parsed
}

// Generate image for a slide using OpenAIService (with SVG fallback)
async function generateSlideImage(prompt: string, size: string, slideNumber: number): Promise<string> {
  try {
    const enhanced = `${prompt}, no text, clean educational illustration, white background, thick lines, vector style`
    const result = await OpenAIService.generateImage({
      prompt:  enhanced,
      size:    (size === '512x512' ? '1024x1024' : size) as '1024x1024',
      quality: 'standard',
      style:   'natural',
    })

    if (result.provider === 'placeholder') {
      console.log(`⚠️  Using placeholder image for slide ${slideNumber}`)
      return result.url // data URI — PptxGenJS can use this
    }

    // Download and save to /public for serving
    const imageResponse = await fetch(result.url)
    if (!imageResponse.ok) throw new Error(`Download failed: ${imageResponse.status}`)
    const buf = Buffer.from(await imageResponse.arrayBuffer())
    const fileName = `slide-${slideNumber.toString().padStart(2, '0')}-${Date.now()}.png`
    const tempDir  = path.join(process.cwd(), 'public', 'ai-images', 'temp')
    if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true })
    await writeFile(path.join(tempDir, fileName), buf)
    const saved = `/ai-images/temp/${fileName}`
    console.log(`🖼️ Saved slide ${slideNumber} image:`, saved)
    return saved
  } catch (error) {
    console.error(`❌ Image error for slide ${slideNumber}:`, error)
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
    // Resolve every slide image to an embeddable data URI up front
    const resolvedImages = await Promise.all(
      slides.map(async slide => {
        if (!slide.imageUrl) return null
        try {
          return await toEmbeddableImage(slide.imageUrl)
        } catch (e) {
          console.warn(`⚠️ Could not embed image for slide "${slide.title}":`, e)
          return null
        }
      })
    )

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

          // Add image (real image embedded; fall back to placeholder)
          const embeddable = resolvedImages[index]
          if (embeddable) {
            try {
              slide.addImage({
                data: embeddable,
                x: 5.5,
                y: 1.8,
                w: 4,
                h: 4,
                rounding: true,
                sizing: { type: 'contain', w: 4, h: 4 },
              } as any)
            } catch (imgError) {
              console.warn(`⚠️ addImage failed for slide ${index + 1}:`, imgError)
              slide.addText('[AI Generated Image]', {
                x: 5.5,
                y: 1.8,
                w: 4,
                h: 4,
                fontSize: 14,
                color: accentColor,
                align: 'center',
                valign: 'middle',
                border: { type: 'solid', color: accentColor, pt: 2 },
                margin: 0
              } as any)
            }
          } else {
            slide.addText('[AI Generated Image]', {
              x: 5.5,
              y: 1.8,
              w: 4,
              h: 4,
              fontSize: 14,
              color: accentColor,
              align: 'center',
              valign: 'middle',
              border: { type: 'solid', color: accentColor, pt: 2 },
              margin: 0
            } as any)
          }
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

/**
 * Convert a slide image (data URI, local path, or remote URL) into a
 * base64 data URI that PptxGenJS can embed into the PPTX.
 */
async function toEmbeddableImage(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl

  if (imageUrl.startsWith('/')) {
    // Local path served from /public (e.g. /ai-images/temp/file.png)
    const filePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''))
    const buf = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase().slice(1)
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  }

  // Remote URL (Supabase public URL, Unsplash, Wikimedia, etc.)
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  const buf = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || 'image/png'
  return `data:${contentType};base64,${buf.toString('base64')}`
}