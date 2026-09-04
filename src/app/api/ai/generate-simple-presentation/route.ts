/**
 * POST /api/ai/generate-simple-presentation
 *
 * Generates a structured slide deck matching TutorBot AI format:
 * - Returns JSON with slides array (section, title, content[], imagePrompt, speakerNotes)
 * - Metadata: subject, grade, topic, totalSlides
 * - Used by the PowerPoint page for preview AND PPTX download
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { getGradeBand, getContentWordLimit } from '@/lib/grade-bands'

export interface GeneratedSlide {
  slideNumber:  number
  section:      'introduction' | 'body' | 'conclusion'
  title:        string
  content:      string[]
  speakerNotes: string
  imagePrompt:  string
  imageUrl?:    string
}

function normaliseSection(raw: string): 'introduction' | 'body' | 'conclusion' {
  const v = (raw || '').toLowerCase()
  if (v.includes('intro'))                                        return 'introduction'
  if (v.includes('conclusion') || v.includes('summary') || v.includes('end')) return 'conclusion'
  return 'body'
}

function sanitiseSlides(raw: any, fallback: { subject: string; grade: string; topic: string; count: number }) {
  const arr = Array.isArray(raw?.slides) ? raw.slides : []
  return arr.slice(0, fallback.count).map((s: any, i: number) => ({
    slideNumber:  i + 1,
    section:      normaliseSection(s?.section),
    title:        String(s?.title || `Slide ${i + 1}`).trim(),
    content:      (Array.isArray(s?.content) ? s.content : [s?.content || ''])
                    .map((c: any) => String(c).trim()).filter(Boolean).slice(0, 6),
    speakerNotes: String(s?.speakerNotes || s?.speaker_notes || '').trim(),
    imagePrompt:  String(s?.imagePrompt || s?.image_prompt || '').trim(),
  }))
}

export const POST = route({}, async (request, { user }) => {
    const {
      subject, grade, topic,
      slideCount    = 8,
      difficulty    = 'medium',
      customInstructions = '',
      documentContext,
    } = await request.json()

    if (!subject || !grade || !topic) {
      return NextResponse.json({ error: 'subject, grade, and topic are required' }, { status: 400 })
    }

    // Fetch teacher's saved curriculum template as presentation style reference
    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const t = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { curriculumTemplate: true },
      })
      templateText = t?.curriculumTemplate || null
    }
    const templateBlock = templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the presentation slides in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    // Grade-band aware depth: senior secondary & adult learners deserve richer
    // slides with substance, application, and depth — not just one-liners.
    const band = getGradeBand(grade)
    const wordLimit = getContentWordLimit(grade)
    const isAdvanced = band === 'adult' || band === 'senior_secondary'
    const depthBlock = isAdvanced
      ? `- This presentation is for ADVANCED learners (${band === 'adult' ? 'adult GED' : 'senior secondary'} students).\n- Make every bullet a substantive, complete point (not a fragment) — each should be informative enough to stand alone.\n- Include concrete examples, data, and real-world application; connect ideas across slides.\n- Aim for roughly ${wordLimit} words across the whole deck so it genuinely teaches the topic.`
      : `- Aim for roughly ${wordLimit} words across the whole deck.\n- Each bullet should be a complete, informative point.`

    // ── Build AI prompt (same structure as TutorBot generate-lesson-slides) ──
    const systemPrompt = `You are an expert educator creating a PowerPoint presentation for ${grade} students following the selected curriculum.${templateBlock}
Return ONLY valid JSON — no markdown fences, no explanation.
Use section values strictly: introduction, body, conclusion.
Do NOT use asterisks (*) in content or speaker notes.
For Maths: use × ÷ ² ³ ½ ⅓ ¼ and include units.`

    const userPrompt = `Create a ${slideCount}-slide presentation for:
Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
Difficulty: ${difficulty}
${customInstructions ? `\nTeacher instructions: ${customInstructions}` : ''}

Structure:
- Slides 1-2: INTRODUCTION — title/hook with engaging scenario
- Slides 3-${slideCount - 2}: BODY — progressive content, 4-6 bullet points, relatable local examples
- Slides ${slideCount - 1}-${slideCount}: CONCLUSION — summary + assessment questions

${depthBlock}

For EACH slide return:
{
  "slideNumber": 1,
  "section": "introduction",
  "title": "Slide title",
  "content": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "speakerNotes": "What the teacher says (50-100 words)",
  "imagePrompt": "Detailed description of educational diagram or photo for this slide"
}

Return exactly this JSON (no other text):
{
  "slides": [...],
  "metadata": { "subject": "${subject}", "grade": "${grade}", "topic": "${topic}", "totalSlides": ${slideCount} }
}`

    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ], { maxTokens: 6000, temperature: 0.6 })

    // ── Robust JSON extraction ──────────────────────────────────────────────
    let slidesData: { slides: GeneratedSlide[]; metadata: any } | null = null
    try {
      const { cleanAiJson } = await import('@/lib/ai-generation-utils')
      const cleaned = cleanAiJson(raw)
      if (cleaned) {
        const parsed = JSON.parse(cleaned)
        const slides = sanitiseSlides(parsed, { subject, grade, topic, count: slideCount })
        if (slides.length > 0) {
          slidesData = { slides, metadata: parsed.metadata || { subject, grade, topic, totalSlides: slideCount } }
        }
      }
    } catch (e) {
      console.error('[PPTX_GEN] JSON parse failed:', e)
    }

    if (!slidesData) {
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    // ── Save to DB for later access ─────────────────────────────────────────
    let savedId: string | null = null
    try {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (teacher) {
        const saved = await prisma.aIGeneratedContent.create({
          data: {
            title:     `${subject}: ${topic}`,
            content:   JSON.stringify(slidesData),
            type:      'POWERPOINT',
            subject,
            grade,
            topic,
            metadata:  { slideCount: slidesData.slides.length, difficulty, generatedAt: new Date().toISOString() },
            teacherId: teacher.id,
          },
        })
        savedId = saved.id
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success:        true,
      presentationId: savedId,
      presentation:   slidesData,
    })

})
