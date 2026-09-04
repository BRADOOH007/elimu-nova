import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { OpenAIService } from '../src/lib/openai-service'

const ADULT_TYPES = ['ADULT_AI_LITERACY', 'ADULT_COMPUTER_LITERACY', 'ADULT_FINANCIAL_LITERACY']
const MIN_WORDS = 550
const TARGET_WORDS = 900

const COURSE_INTRO: Record<string, string> = {
  ADULT_AI_LITERACY:
    'These are lessons for adult learners on a GED / high-school-equivalency pathway. This is an AI-Literacy course.',
  ADULT_COMPUTER_LITERACY:
    'These are lessons for adult learners on a GED / high-school-equivalency pathway. This is a Computer-Literacy course.',
  ADULT_FINANCIAL_LITERACY:
    'These are lessons for adult learners on a GED / high-school-equivalency pathway. This is a Financial-Literacy course.',
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function generateDeepLesson(opts: {
  courseType: string
  courseTitle: string
  lessonTitle: string
  description: string
  duration: number
  existingContent: string
}): Promise<string> {
  const prompt = `You are an expert adult-education curriculum writer.

${COURSE_INTRO[opts.courseType] || ''}
The audience is an adult learner (possibly returning to school, adult work/life experience, English may not be their first language). The tone must be warm, respectful, practical, and never patronising. Use plain language, short sentences, and real-life adult examples (work, money, family, daily life).

Write ONE complete lesson labelled:
TITLE: ${opts.lessonTitle}
ONE-LINE FOCUS: ${opts.description}
SUGGESTED SESSION LENGTH: ~${opts.duration} minutes

The existing (too short) version of this lesson is:
---
${opts.existingContent}
---

Produce a SUBSTANTIAL, DEEP lesson in Markdown that fully covers this topic. Requirements:
- Length: approximately ${TARGET_WORDS} words (aim for between ${MIN_WORDS} and 1400). Do NOT be brief.
- Use clear Markdown headings (## for sections). Structure the lesson with these sections:
  1. "Introduction" — what this lesson is about and why it matters in the learner's real life (2-3 sentences).
  2. Body sections (3-5 sections) that teach the core concepts in depth, with concrete examples. Use bullet lists and bold key terms. Include at least one realistic worked example or scenario.
  3. "Common Mistakes to Avoid" — a short practical section.
  4. "Check Your Understanding" — 4-5 questions with answers in parentheses, so the learner can self-test.
  5. "Key Takeaways" — a concise bullet summary of the 4-6 most important points.
- Always address the adult learner directly ("you"). Keep it practical and immediately useful.
- Do NOT use tables. Do NOT invent statistics. Keep it accurate and grounded.

Return ONLY the lesson body in Markdown — no preamble, no commentary, no code fences.`

  const raw = await OpenAIService.generateText(
    [
      { role: 'system', content: 'You are an expert adult-education curriculum writer. Return only the lesson content in Markdown.' },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 3500, temperature: 0.5 }
  )

  let out = (raw || '').trim()
  // Strip any accidental surrounding backticks / fences
  out = out.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
  // Another maturity guard: if the model didn't write much, expand once.
  if (wordCount(out) < MIN_WORDS) {
    const retry = await OpenAIService.generateText(
      [
        { role: 'system', content: 'You are an expert adult-education curriculum writer. Return only the lesson content in Markdown.' },
        {
          role: 'user',
          content: `Expand the following lesson to at least ${MIN_WORDS} words, keeping the same structure but adding more depth, detail, examples, and a fuller "Check Your Understanding" section. Return ONLY the full expanded Markdown lesson, no preamble.\n\n---\n${out}`,
        },
      ],
      { maxTokens: 3500, temperature: 0.5 }
    )
    const expanded = (retry || '').trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    if (wordCount(expanded) >= MIN_WORDS) out = expanded
  }
  return out
}

;(async () => {
  const DRY_RUN = process.env.DRY_RUN === '1'
  const LIMIT = Number(process.env.LIMIT || 0) // 0 = all
  const courses = await prisma.course.findMany({
    where: { type: { in: ADULT_TYPES as any } },
    include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, description: true, content: true, duration: true } } },
  })

  let total = 0
  let processed = 0
  for (const course of courses) {
    for (const lesson of course.lessons) {
      if (LIMIT && processed >= LIMIT) break
      processed++
      const before = wordCount(lesson.content || '')
      if (before >= MIN_WORDS) {
        console.log(`\n• SKIP "${course.title}" → "${lesson.title}" (already ${before} words)`)
        continue
      }
      console.log(`\n▶ ${DRY_RUN ? '[DRY RUN] ' : ''}Generating deep content for "${course.title}" → "${lesson.title}" (before: ${before} words)...`)
      let content = ''
      let attempts = 0
      while (wordCount(content) < MIN_WORDS && attempts < 3) {
        try {
          content = await generateDeepLesson({
            courseType: course.type,
            courseTitle: course.title,
            lessonTitle: lesson.title,
            description: lesson.description || '',
            duration: lesson.duration || 20,
            existingContent: lesson.content || '',
          })
        } catch (e: any) {
          console.log('   ⚠ attempt ' + (attempts + 1) + ' failed: ' + e.message)
        }
        attempts++
      }
      await sleep(4000)
      if (wordCount(content) >= MIN_WORDS) {
        if (DRY_RUN) {
          console.log(`   ✓ would save (${wordCount(content)} words)`)
          if (process.env.PRINT === '1') {
            console.log('   ─── GENERATED CONTENT ───')
            console.log(content)
            console.log('   ─── END ───')
          }
        } else {
          await prisma.courseLesson.update({ where: { id: lesson.id }, data: { content } })
          total++
          console.log(`   ✓ saved (${wordCount(content)} words) after ${attempts} attempt(s)`)
        }
      } else {
        console.log(`   ✗ SKIPPED — could not generate enough content (${wordCount(content)} words)`)
      }
    }
  }
  console.log(`\n✅ Done. ${DRY_RUN ? '(dry run — nothing written)' : 'Deepened ' + total + ' lessons.'}`)
  await prisma.$disconnect()
})()
