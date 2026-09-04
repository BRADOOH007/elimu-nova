import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { CloudinaryStorage } from '@/lib/cloudinary-storage'
import { intelligentCacheLookup, intelligentCacheSave } from '@/lib/lesson-cache'
import { buildCurriculumLessonContext } from '@/lib/curriculum-prompt'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'
import { buildSubjectPedagogySection } from '@/lib/subject-pedagogy'
import { buildGradeBandSection } from '@/lib/grade-bands'
import { getContentWordLimit } from '@/lib/grade-bands'

interface ActiveLessonImage {
  sectionTitle: string
  imagePrompt: string
  imageUrl?: string
}

interface ActiveLesson {
  topic: string
  subject: string
  grade: string
  preview: { whatYoullLearn: string; concepts: string[] }
  content: string
  images: ActiveLessonImage[]
  recall: { question: string; type: string; options?: string[]; answer: string; explanation: string }[]
  generatedAt: string
}

const MAX_SECTION_IMAGES = 4

// Persist a generated image to permanent storage so cached lessons never break
// when the original provider URL (e.g. DALL-E) expires. Falls back to the original on failure.
async function persistImage(imageUrl: string, prompt: string, topic: string, userId: string): Promise<string> {
  if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl
  try {
    const saved = await CloudinaryStorage.saveAIImage({
      imageUrl,
      topic: topic.slice(0, 60),
      prompt,
      type: 'ILLUSTRATION',
      size: 'MEDIUM_1024',
      quality: 'standard',
      userId,
    })
    return saved.storedUrl
  } catch (e) {
    console.warn('[ActiveLesson] Image persistence failed, keeping original URL:', e)
    return imageUrl
  }
}

function fallbackSvg(title: string, prompt: string): string {
  const safeTitle = (title || 'Visual').slice(0, 60).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const words = safeTitle.split(/\s+/).slice(0, 6)
  const line1 = words.slice(0, 3).join(' ')
  const line2 = words.slice(3).join(' ')
  const svg = `<svg width="1024" height="520" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f4ff"/>
      <stop offset="100%" style="stop-color:#e8f0fe"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="40" y="40" width="944" height="440" rx="16" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="40" y="40" width="944" height="6" rx="3" fill="url(#accent)"/>
  <circle cx="512" cy="200" r="56" fill="#eef2ff" stroke="#c7d2fe" stroke-width="2"/>
  <text x="512" y="212" text-anchor="middle" font-family="system-ui,sans-serif" font-size="40" fill="#6366f1">&#x1F4D6;</text>
  <text x="512" y="290" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="#1e293b">${line1}</text>
  ${line2 ? `<text x="512" y="324" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="#1e293b">${line2}</text>` : ''}
  <text x="512" y="380" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#94a3b8">Visual concept illustration</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function cleanJson(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return ''
  cleaned = cleaned.slice(start, end + 1)
  return cleaned
}

/**
 * Strip any embedded images (markdown image or data-URI) from the lesson's
 * markdown content. Visuals are supplied separately via the images array, so
 * a giant base64 SVG inline in the content only bloats the payload and blows
 * up the layout. ASCII/emoji diagrams in fenced code blocks are preserved.
 */
function stripEmbeddedImages(md: string): string {
  if (!md) return md
  return md
    // remove ![alt](data:image/...), ![alt](http...) — entire markdown image tag
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // remove stray raw <img ...> tags
    .replace(/<img[^>]*>/gi, '')
    // remove any bare data-URI image that leaked without markdown
    .replace(/!\[\]?\(data:image\/[^)]*\)/g, '')
    // collapse 3+ blank lines to 1
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const POST = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const body = await req.json()
  const { subject, topic, grade, curriculum } = body

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
  }

  const gradeStr = grade || 'Grade 8'
  const curCtx = buildCurriculumLessonContext({ curriculum, grade, subject })
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  // Fast path: serve an existing lesson for this subject/topic/grade from cache.
  const cached = await intelligentCacheLookup(subject, topic, gradeStr, curriculum)
  if (cached) {
    const cachedLesson = cached.content as unknown as ActiveLesson
    // Clean any embedded images that may have been duplicated into cached content
    if (cachedLesson?.content) cachedLesson.content = stripEmbeddedImages(cachedLesson.content)
    return NextResponse.json({
      ...cachedLesson,
      fromCache: true,
      matchedVia: cached.matchedVia,
      canonicalTopic: cached.canonicalTopic ?? null,
    })
  }

  // Build curriculum intelligence — official outcomes + teacher examples + RAG
  let curriculumSection = ''
  try {
      const { curriculumSection: cs } = await buildFullGenerationContext(
        gradeStr, subject, { generationType: 'lesson_plan', topic, curriculum: curriculum as string }
    )
    curriculumSection = cs
  } catch { /* curriculum intelligence unavailable */ }

  // Subject-specific pedagogy
  const pedagogySection = buildSubjectPedagogySection(subject)

  // Grade-band adaptations
  const gradeBandSection = buildGradeBandSection(gradeStr)
  const wordLimit = getContentWordLimit(gradeStr)

  const prompt = `Create a study lesson for a ${gradeStr} ${curriculum === 'ged-hiset' || grade === 'Adult' ? 'adult GED learner' : 'student'} learning ${subject} about "${topic}".
${curCtx}
${curriculumSection}
${pedagogySection}
${gradeBandSection}
${curriculum === 'ged-hiset' || grade === 'Adult' ? `This is an ADULT LEARNER preparing for the GED high-school equivalency exam. Make the lesson genuinely beneficial for an adult:
- Write in plain, respectful, jargon-free language; introduce technical terms only after explaining the idea.
- Include at least one step-by-step worked example inside the "content" markdown.
- Connect each concept to real adult life — work, money, home, or civic life.
- End the "content" with a "**Key Takeaways**" bullet list and a "**GED Tip**" paragraph explaining how this topic commonly appears on the GED test (Mathematical Reasoning, Reasoning Through Language Arts, Science, or Social Studies).` : ''}
You MUST return valid JSON. Escape all double quotes inside strings with backslash.

{
  "preview": {
    "whatYoullLearn": "In one short sentence, what the student will understand after this lesson",
    "concepts": ["First concept", "Second concept", "Third concept"]
  },
  "content": "Write as MARKDOWN with these exact rules. The content will be rendered by a student-facing markdown renderer that supports headings, bold, italic, tables, code blocks, lists, and blockquotes.\n\nLENGTH REQUIREMENT (CRITICAL):\n- The 'content' field MUST contain at least ${wordLimit} words of genuine teaching material. This is a HARD MINIMUM — before returning, count the words in 'content' and if it is under ${wordLimit}, expand it with more explanatory paragraphs, examples, and practice.\n- Target ${Math.round(wordLimit * 1.2)} words so there is ample, helpful material.\n\nFORMAT RULES:\n- Use ## for concept headings (4-6 concepts, one per section)\n- Use ### for sub-sections within a concept\n- Use **bold** for key terms and definitions\n- Use _italic_ for emphasis sparingly\n- Use > blockquotes for real-world examples\n- Use pipe tables for comparisons and summaries\n- Use triple-backtick fenced code blocks for visual diagrams (ASCII art, flow charts with arrows, emoji diagrams)\n- Use dash bullet lists for key points and steps\n- Use numbered lists for sequential steps\n- Write substantive paragraphs of 3-5 sentences each — do NOT skimp. Explain fully.\n- Write in a friendly, conversational tone like a cool teacher\n\nSTRUCTURE for EACH concept section:\n1. Start with a **bold key term** and its clear definition\n2. Explain it in depth with 3-5 rich paragraphs — use analogies, compare to everyday life\n3. Include a **worked example** — walk through it step by step in a numbered list\n4. Include a comparison table summarizing key points vs related concepts\n5. Include a visual diagram in a code block (ASCII art, flow chart, or emoji model)\n6. End with a real-world application blockquote showing where this matters outside school\n7. Add a **Common Mistakes** bullet list — 1-2 things students typically get wrong and how to avoid them\n\nAfter all concepts, add these sections:\n- **Quick Review** — bullet list of ALL key takeaways from every concept (5-8 bullets)\n- **Try It Yourself** — 3-4 practice challenges with increasing difficulty, each with a hint\n- **Think Deeper** — 2 thought-provoking questions that connect concepts together\n\nRemember: the content MUST be at least ${wordLimit} words. Use age-appropriate language for ${gradeStr} students. Make it fun with emojis in diagrams but NOT in regular text. IMPORTANT: Do NOT embed any images or base64 data in the content — text, tables, and ASCII diagrams only. Do NOT use any special characters that break JSON.",
  "images": [
    { "sectionTitle": "Exact ## heading of first concept", "imagePrompt": "Detailed image-generation prompt for this section: subject, key objects to show, labels, style (flat, textbook, colorful, age-appropriate, no text in image)" },
    { "sectionTitle": "Exact ## heading of second concept", "imagePrompt": "Detailed image-generation prompt for this section" },
    { "sectionTitle": "Exact ## heading of third concept", "imagePrompt": "Detailed image-generation prompt for this section" }
  ],
  "vocabulary": [
    { "term": "Key term 1", "definition": "Clear, concise definition", "example": "How it's used in context" },
    { "term": "Key term 2", "definition": "Clear, concise definition", "example": "How it's used in context" }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "tryItYourself": [
    { "challenge": "Description of the challenge", "hint": "Helpful hint" },
    { "challenge": "Description of the challenge", "hint": "Helpful hint" }
  ],
  "misconceptions": [
    { "statement": "Common wrong belief students have", "correction": "The correct understanding", "tip": "How to remember the right way" }
  ],
  "recall": [
    {
      "question": "MCQ about the first key concept",
      "type": "mcq",
      "options": ["Wrong A", "Correct answer", "Wrong C", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Why the correct answer is right"
    },
    {
      "question": "MCQ about the second key concept",
      "type": "mcq",
      "options": ["Wrong A", "Wrong B", "Correct answer", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "MCQ about the third key concept",
      "type": "mcq",
      "options": ["Correct answer", "Wrong B", "Wrong C", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "MCQ about the fourth key concept",
      "type": "mcq",
      "options": ["Wrong A", "Correct answer", "Wrong C", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "Final MCQ testing application of all concepts",
      "type": "mcq",
      "options": ["Wrong A", "Wrong B", "Correct answer", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    }
  ]
}

RULES:
- Only return the JSON object. No markdown. No explanation. No backticks.
- Escape all double quotes inside text fields with backslash
- The content field must be valid JSON string (escape newlines as \\n, double quotes as \\")
- Make questions test real understanding, not memorization
- Request: ${requestId}`

  try {
    const raw = await OpenAIService.generateText([
      {
        role: 'system',
        content: 'You are an AI that returns ONLY valid, parseable JSON. Never wrap in backticks. Escape all double quotes inside strings. Your entire output must be a single JSON object.',
      },
      { role: 'user', content: prompt },
    ],     { maxTokens: 16000, temperature: 0.3 })

    const json = cleanJson(raw)
    if (!json) {
      console.error('[ActiveLesson] Could not extract JSON from:', raw.slice(0, 200))
      throw new Error('AI returned invalid JSON format')
    }

    const lesson: ActiveLesson = JSON.parse(json)
    lesson.topic = topic
    lesson.subject = subject
    lesson.grade = gradeStr
    lesson.generatedAt = new Date().toISOString()
    // Remove embedded image blobs from the markdown content — visuals come
    // from the images array instead, keeping the content text-focused.
    if (lesson.content) lesson.content = stripEmbeddedImages(lesson.content)

    // Section visuals: metadata required by the model, imageUrl generated best-effort
    const imageMeta: ActiveLessonImage[] = Array.isArray(lesson.images) ? lesson.images : []
    const heroPrompt = `A clean, colorful educational illustration about "${topic}" for ${gradeStr} ${subject} students. Textbook quality, simple, clear, age-appropriate. White or light background. No text or words in the image.`

    // Lead image (hero) above the lesson — persisted so the cached copy never expires
    try {
      const hero = await OpenAIService.generateImage({
        prompt: heroPrompt,
        style: 'natural',
        size: '1024x1024',
        quality: 'standard',
      })
      if (hero?.url) {
        const durableUrl = await persistImage(hero.url, heroPrompt, topic, user?.id || 'system')
        const heroImage: ActiveLessonImage = { sectionTitle: topic, imagePrompt: heroPrompt, imageUrl: durableUrl }
        lesson.images = [heroImage, ...(lesson.images || [])]
      }
    } catch (e) {
      console.warn('[ActiveLesson] Hero image generation failed:', e)
    }

    // One illustration per key section, capped for cost/latency
    const rawImages = await Promise.all(
      imageMeta.slice(0, MAX_SECTION_IMAGES).map(async (meta, i) => {
        try {
          const img = await OpenAIService.generateImage({
            prompt: meta.imagePrompt || `Illustration for: ${meta.sectionTitle} (${topic}, ${subject}).`,
            style: 'natural',
            size: '1024x1024',
            quality: 'standard',
          })
          const durableUrl = img?.url
            ? await persistImage(img.url, meta.imagePrompt || '', meta.sectionTitle, user?.id || 'system')
            : null
          if (durableUrl) return { ...meta, imageUrl: durableUrl }
        } catch (e) {
          console.warn(`[ActiveLesson] Section image ${i} failed, using placeholder`)
        }
        // Fallback: styled SVG placeholder so the lesson always has a visual
        return { ...meta, imageUrl: fallbackSvg(meta.sectionTitle, meta.imagePrompt || '') }
      })
    )
    lesson.images = rawImages.filter(Boolean) as unknown as ActiveLessonImage[]

    await intelligentCacheSave(subject, topic, gradeStr, lesson as unknown as Prisma.InputJsonValue, curriculum)

    return NextResponse.json({ ...lesson, fromCache: false, matchedVia: 'generated' })

  } catch (error: any) {
    console.error('[ActiveLesson] Generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson. Please try again.' },
      { status: 500 }
    )
  }
})
