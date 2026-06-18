/**
 * POST /api/ai/generate-pptx-from-lesson
 *
 * Generates a PowerPoint from a lesson plan.
 * Works whether the lesson plan is from DB (by id) or passed directly.
 *
 * Steps:
 *   1. Load lesson plan content (from DB or request body)
 *   2. Ask AI to generate slide structure with image prompts
 *   3. Generate AI images for each slide
 *   4. Build PPTX using pptxgenjs
 *   5. Upload to Supabase Storage (if configured)
 *   6. Return download URL + file buffer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { simplePresentationGenerator } from '@/lib/simple-presentation-generator'
import { uploadFile, BUCKETS } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      lessonPlanId,    // load from DB
      lessonContent,   // or pass directly
      subject,
      grade,
      slideCount = 8,
      generateImages = true,
    } = await request.json()

    let content: any = lessonContent
    let planTitle = 'Lesson Plan'

    // Load from DB if ID provided
    if (lessonPlanId && !lessonContent) {
      const plan = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } })
      if (!plan) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

      try {
        content = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content
      } catch { content = { title: plan.title } }
      planTitle = plan.title
    }

    if (!content) return NextResponse.json({ error: 'lessonPlanId or lessonContent required' }, { status: 400 })

    // ── Generate slide structure from lesson content ────────────────────────
    const systemPrompt = `You are an educational presentation designer.
Return ONLY a valid JSON array of slide objects. No markdown.
Each slide object: { "id": string, "title": string, "content": string[], "imagePrompt": string, "layout": "title"|"content"|"split"|"image", "speakerNotes": string }`

    const lessonSummary = typeof content === 'object'
      ? `Title: ${content.title || planTitle}
Strand: ${content.strand || subject}
Sub-Strand: ${content.subStrand || ''}
Learning Outcomes: ${content.specificLearningOutcomes || ''}
Introduction: ${content.introduction?.activity || ''}
Main Activity: ${content.mainActivity?.activity || ''}
Assessment: ${content.assessment || ''}`
      : String(content).substring(0, 1000)

    const userPrompt = `Create ${slideCount} presentation slides for this lesson:

${lessonSummary}

Requirements:
- Slide 1: Title slide with lesson topic and grade
- Slide 2: Learning outcomes (what students will learn)
- Slides 3-6: Core content broken into clear, visual sections
- Slide 7: Activity/practice for students
- Slide 8: Summary and assessment

For each slide:
- content: 3-5 bullet points, concise and age-appropriate for ${grade}
- imagePrompt: detailed description for an educational illustration (bright, colourful, appropriate for ${grade})
- layout: use "split" for content slides, "title" for first slide, "image" for activity slides
- speakerNotes: what the teacher says during this slide`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      { maxTokens: 3000, temperature: 0.5 }
    )

    let slides: any[] = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No slides JSON')
      slides = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'AI returned invalid slide format. Please try again.' }, { status: 500 })
    }

    // Normalise slides
    const normalised = slides.map((s, i) => ({
      id:          s.id || `slide-${i + 1}`,
      title:       s.title || `Slide ${i + 1}`,
      content:     Array.isArray(s.content) ? s.content : [s.content || ''],
      imagePrompt: s.imagePrompt || `Educational illustration for ${subject} ${grade}`,
      layout:      (['title', 'content', 'split', 'image'].includes(s.layout) ? s.layout : 'split') as any,
    }))

    // ── Generate PPTX ──────────────────────────────────────────────────────
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })

    const pptxBuffer = await simplePresentationGenerator.generatePresentation({
      title:          planTitle,
      author:         session.user.name || 'ElimuNova Teacher',
      slides:         normalised,
      generateImages: generateImages,
      imageStyle:     'natural',
      userId:         session.user.id,
      teacherId:      teacher?.id,
    })

    // ── Upload to Supabase Storage ─────────────────────────────────────────
    const fileName  = `${session.user.id}/${Date.now()}-${planTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx`
    const publicUrl = await uploadFile(BUCKETS.PRESENTATIONS, fileName, pptxBuffer, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')

    // Save reference to DB if we have a lesson plan
    if (lessonPlanId && publicUrl) {
      try {
        const existing = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } })
        if (existing) {
          const existingContent = typeof existing.content === 'string' ? JSON.parse(existing.content) : existing.content
          await prisma.lessonPlan.update({
            where: { id: lessonPlanId },
            data:  { content: JSON.stringify({ ...existingContent, pptxUrl: publicUrl }) },
          })
        }
      } catch { /* non-fatal */ }
    }

    // Return file
    const safeTitle = planTitle.replace(/[^a-z0-9]/gi, '_')
    // Convert Buffer to Uint8Array for proper BodyInit
    const uint8 = new Uint8Array(pptxBuffer.buffer, pptxBuffer.byteOffset, pptxBuffer.byteLength)
    return new NextResponse(uint8, {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${safeTitle}.pptx"`,
        'X-Download-URL':      publicUrl || '',
        'X-Slide-Count':       String(normalised.length),
      },
    })
  } catch (error: any) {
    console.error('[GENERATE_PPTX_FROM_LESSON]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate PowerPoint' }, { status: 500 })
  }
}
