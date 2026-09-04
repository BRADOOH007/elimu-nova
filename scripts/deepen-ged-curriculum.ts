import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { OpenAIService } from '../src/lib/openai-service'

const MIN_WORDS = 500
const TARGET_WORDS = 800

const SUBJECT_HINTS: Record<string, string> = {
  'Mathematical Reasoning':
    'The GED Mathematical Reasoning test emphasises algebra, quantitative problem-solving, and interpreting data/graphs. Style: teach the concept, then show 2-3 fully-worked numeric examples with step-by-step working, then give practice problems with answers.',
  'Reasoning Through Language Arts':
    'The GED RLA test covers reading comprehension (main idea, inference, author purpose, evidence) and grammar/usage plus essay writing. Style: define the skill, give a short passage example, model how to apply it, include practice with answers.',
  Science:
    'The GED Science test covers life science, physical science, earth/space science, and interpreting data/experiments. Style: explain the concept clearly, give concrete real-world examples, model reading tables/graphs, include practice questions with answers.',
  'Social Studies':
    'The GED Social Studies test covers civics/government, US history, economics, and geography, with emphasis on interpreting sources, charts, and maps. Style: explain the topic, cite a key fact/date, show how to read related source material, include practice with answers.',
}

async function generateDeepLesson(opts: {
  subject: string
  title: string
  objectives: string[]
  existingContent: string
  duration: number
}): Promise<string> {
  const hint = SUBJECT_HINTS[opts.subject] || 'General GED exam-prep lesson.'
  const prompt = `You are an expert GED (US high-school-equivalency) test preparation tutor writing a lesson for an adult learner preparing for the official GED exam in ${opts.subject}.

${hint}

Write ONE complete lesson:
TITLE: ${opts.title}
COVERAGE / LEARNING OBJECTIVES:
${opts.objectives.map((o) => ' - ' + o).join('\n')}
SUGGESTED SESSION LENGTH: ~${opts.duration} minutes

The existing (too short) version is:
---
${opts.existingContent}
---

Produce a SUBSTANTIAL, DEEP lesson in Markdown. Requirements:
- Length: approximately ${TARGET_WORDS} words (between ${MIN_WORDS} and 1200). Do NOT be brief.
- Clear Markdown headings (## for sections). Structure:
  1. "Introduction" — what this lesson covers and why it matters for the GED exam (2-3 sentences).
  2. Body sections (3-5 sections) teaching the core concepts in depth. Use bullet lists and bold key terms.
  3. "Worked Examples" — for Math: 2-3 numeric problems solved step by step. For other subjects: a modelled reading/analysis task or practical example.
  4. "Common Mistakes / Pitfalls" — mistakes GED test-takers commonly make on this topic.
  5. "Practice Questions" — 4-5 GED-style questions with the answers given in parentheses after each.
  6. "Key Takeaways" — a concise bullet summary.
- The audience is an adult learner. Use plain, direct language and adult, real-life contexts. Keep it accurate. Do NOT invent statistics.
- Do NOT use tables.

Return ONLY the lesson body in Markdown — no preamble, no commentary, no code fences.`

  const raw = await OpenAIService.generateText(
    [
      { role: 'system', content: 'You are an expert GED test-preparation tutor. Return only the lesson content in Markdown.' },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 3500, temperature: 0.5 }
  )

  return (raw || '').trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length

const PAUSE_MS = Number(process.env.PAUSE || 3000)

async function dbRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e: any) {
      if (i >= tries) throw e
      console.log(`   (db retry ${i}/${tries}: ${e.message})`)
      await sleep(4000 * i)
    }
  }
}

;(async () => {
  const DRY_RUN = process.env.DRY_RUN === '1'
  const SUBJ_ONLY = process.env.SUBJECT || ''
  const LIMIT = Number(process.env.LIMIT || 0)
  const curricula = await dbRetry(() =>
    prisma.curriculum.findMany({
      where: { type: 'GED' },
      select: { id: true, subject: true },
    })
  )

  let total = 0
  let done = 0
  for (const c of curricula) {
    if (SUBJ_ONLY && c.subject !== SUBJ_ONLY) continue
    const lessons = await dbRetry(() =>
      prisma.curriculumLesson.findMany({
        where: { substrand: { strand: { curriculumId: c.id } } },
        select: { id: true, title: true, content: true, objectives: true, duration: true },
        orderBy: { order: 'asc' },
      })
    )
    for (const lesson of lessons) {
      if (LIMIT && done >= LIMIT) break
      done++
      const before = wordCount(lesson.content || '')
      if (before >= MIN_WORDS) {
        console.log(`• SKIP ${c.subject} → "${lesson.title}" (already ${before}w)`)
        continue
      }
      console.log(`\n▶ ${DRY_RUN ? '[DRY] ' : ''}${c.subject} → "${lesson.title}" (${before}w)...`)
      let content = ''
      let ok = false
      for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
        try {
          content = await generateDeepLesson({
            subject: c.subject,
            title: lesson.title,
            objectives: Array.isArray(lesson.objectives) ? lesson.objectives : [],
            existingContent: lesson.content || '',
            duration: lesson.duration || 20,
          })
          ok = wordCount(content) >= MIN_WORDS
          if (!ok) console.log(`   ⚠ attempt ${attempt}: too short (${wordCount(content)}w)`)
        } catch (e: any) {
          console.log(`   ⚠ attempt ${attempt} failed: ${e.message}`)
        }
        await sleep(PAUSE_MS)
      }
      if (ok) {
        if (!DRY_RUN) {
          await dbRetry(() => prisma.curriculumLesson.update({ where: { id: lesson.id }, data: { content } }))
        } else if (process.env.PRINT === '1') {
          console.log('   ─── CONTENT ───\n' + content + '\n   ─── END ───')
        }
        total++
        console.log(`   ✓ saved (${wordCount(content)}w)`)
      } else {
        console.log(`   ✗ SKIPPED (${wordCount(content)}w)`)
      }
    }
  }
  console.log(`\n✅ Done. ${DRY_RUN ? '(dry run)' : 'Deepened ' + total + ' GED lessons.'}`)
  await prisma.$disconnect()
})()
