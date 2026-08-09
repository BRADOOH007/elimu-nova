import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { CloudinaryStorage } from '@/lib/cloudinary-storage'
import { intelligentCacheLookup, intelligentCacheSave } from '@/lib/lesson-cache'

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
  const safePrompt = (prompt || '').slice(0, 80).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg width="1024" height="640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eef6ff"/>
  <rect x="24" y="24" width="976" height="592" rx="18" fill="none" stroke="#7fb4e6" stroke-width="4"/>
  <circle cx="512" cy="250" r="84" fill="#cfe6fb" opacity="0.8"/>
  <text x="512" y="240" text-anchor="middle" font-family="Arial,sans-serif" font-size="44" fill="#2c6e9e" font-weight="bold">🖼️ ${safeTitle}</text>
  <text x="512" y="300" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#5a93bd">ElimuNova AI illustration</text>
  <text x="512" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#7f9fb8">${safePrompt}</text>
  <text x="512" y="560" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#a0bccf">Image prompt received — generate to replace this placeholder</text>
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

export const POST = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const body = await req.json()
  const { subject, topic, grade } = body

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
  }

  const gradeStr = grade || 'Grade 8'
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  // Fast path: serve an existing lesson for this subject/topic/grade from cache.
  // Matches exact keys, canonical curriculum topics, and near-duplicate phrasings.
  const cached = await intelligentCacheLookup(subject, topic, gradeStr)
  if (cached) {
    return NextResponse.json({
      ...(cached.content as unknown as ActiveLesson),
      fromCache: true,
      matchedVia: cached.matchedVia,
      canonicalTopic: cached.canonicalTopic ?? null,
    })
  }

  const prompt = `Create a study lesson for a ${gradeStr} student learning ${subject} about "${topic}".

You MUST return valid JSON. Escape all double quotes inside strings with backslash.
Use relatable local examples where natural.

{
  "preview": {
    "whatYoullLearn": "In one short sentence, what the student will understand after this lesson",
    "concepts": ["First concept", "Second concept", "Third concept"]
  },
  "content": "Write as markdown with ## headings, one per concept. 2-3 short paragraphs per concept. Keep it conversational and friendly. Max 600 words total. Do NOT use any special characters that break JSON.
    REQUIREMENTS — every concept section MUST contain:
    1. A comparison or feature table (GitHub-flavored markdown table with | columns |) that contrasts or summarises the key concepts/features.
    2. A text/ASCII/emoji visual model of the concept inside a fenced code block (e.g. a flow diagram using arrows =>, boxes, emojis) that shows how the concept works visually.
    3. A blockquote real-world scenario callout that starts exactly with '> **Real-World Example:** ' and describes how this concept appears in everyday life.",
  "images": [
    { "sectionTitle": "Exact ## heading of first concept", "imagePrompt": "Detailed image-generation prompt for this section: subject, key objects to show, labels, style (flat, textbook, colorful, age-appropriate, no text in image)" },
    { "sectionTitle": "Exact ## heading of second concept", "imagePrompt": "Detailed image-generation prompt for this section" },
    { "sectionTitle": "Exact ## heading of third concept", "imagePrompt": "Detailed image-generation prompt for this section" }
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
- The content field must be valid JSON string (escape newlines as \\n, double quotes as \\\")
- Make questions test real understanding, not memorization
- Request: ${requestId}`

  try {
    const raw = await OpenAIService.generateText([
      {
        role: 'system',
        content: 'You are an AI that returns ONLY valid, parseable JSON. Never wrap in backticks. Escape all double quotes inside strings. Your entire output must be a single JSON object.',
      },
      { role: 'user', content: prompt },
    ], { maxTokens: 4000, temperature: 0.3 })

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
        lesson.content = `![${topic} illustration](${durableUrl})\n\n${lesson.content}`
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
          return durableUrl ? { ...meta, imageUrl: durableUrl } : null
        } catch (e) {
          console.warn(`[ActiveLesson] Section image ${i} failed, skipping`)
          return null
        }
      })
    )
    lesson.images = rawImages.filter(Boolean) as unknown as ActiveLessonImage[]

    await intelligentCacheSave(subject, topic, gradeStr, lesson as unknown as Prisma.InputJsonValue)

    return NextResponse.json({ ...lesson, fromCache: false, matchedVia: 'generated' })

  } catch (error: any) {
    console.error('[ActiveLesson] Generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson. Please try again.' },
      { status: 500 }
    )
  }
})
