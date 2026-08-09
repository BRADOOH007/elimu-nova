#!/usr/bin/env ts-node
/**
 * Curriculum Sync — generates strand/substrand content for all curricula.
 * Uses AI to create structured data for each curriculum's subjects.
 * Run: npx ts-node scripts/sync-curricula.ts
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

interface Strand {
  name: string; order: number
  substrands: { name: string; order: number; outcomes: string[] }[]
}

async function generateWithAI(prompt: string): Promise<any> {
  const key = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY
  if (!key) throw new Error('No API key')

  // Try OpenRouter/OpenAI first
  const providers = [
    { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.1-8b-instant' },
    { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'openai/gpt-4o-mini' },
    { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
  ].filter(p => p.key)

  for (const p of providers) {
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.key}` },
        body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 2000 }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) continue
      const d = await res.json() as any
      const text = d?.choices?.[0]?.message?.content || ''
      const json = text.match(/\[[\s\S]*\]/)?.[0]
      if (json) return JSON.parse(json)
    } catch { continue }
  }
  throw new Error('All AI providers failed')
}

async function generateStrands(subject: string, curriculum: string, grade: string): Promise<Strand[]> {
  const prompt = `You are a curriculum standards database. Output ONLY valid JSON for ${subject} in ${curriculum} for ${grade}.

Return this exact structure (array of strands):
[{
  "name": "1.0 Number & Operations",
  "order": 1,
  "substrands": [{
    "name": "1.1 Place Value",
    "order": 1,
    "outcomes": ["By the end, the learner should be able to...", "..."]
  }]
}]

Include 4-6 strands with 2-4 substrands each. Use the ACTUAL official curriculum standards for ${curriculum}. Generate specific, measurable learning outcomes.`
  return generateWithAI(prompt)
}

async function syncCurriculum(curriculumId: string, curriculumName: string, grades: string[], subjects: string[]) {
  console.log(`\n📚 ${curriculumName} (${grades.length} grades, ${subjects.length} subjects)`)

  for (const grade of grades.slice(0, 4)) { // First 4 grades to keep it manageable
    for (const subject of subjects.slice(0, 3)) { // First 3 subjects
      const key = `${curriculumId}_${grade}_${subject}`
      const existing = await prisma.curriculumStrand.findFirst({
        where: { curriculum: { type: curriculumId === 'cbc' ? 'CBC' : 'OTHER', grade, subject } },
      })
      if (existing) { console.log(`  ✓ ${grade} ${subject} — already exists`); continue }

      try {
        const strands = await generateStrands(subject, curriculumName, grade)
        if (!strands.length) continue

        // Upsert curriculum
        let curriculum = await prisma.curriculum.findFirst({
          where: { type: curriculumId === 'cbc' ? 'CBC' : 'OTHER' as any, grade, subject },
        })
        if (!curriculum) {
          curriculum = await prisma.curriculum.create({
            data: { name: `${curriculumName} ${grade} ${subject}`, type: curriculumId === 'cbc' ? 'CBC' : 'OTHER' as any, grade, subject, isActive: true },
          })
        }

        for (const strand of strands) {
          const s = await prisma.curriculumStrand.create({
            data: { curriculumId: curriculum.id, name: strand.name, order: strand.order },
          })
          for (const sub of strand.substrands) {
            await prisma.curriculumSubstrand.create({
              data: { strandId: s.id, name: sub.name, order: sub.order, learningOutcomes: sub.outcomes, activities: [] },
            })
          }
        }
        console.log(`  ✅ ${grade} ${subject} — ${strands.length} strands`)
      } catch (e: any) {
        console.log(`  ⚠️ ${grade} ${subject} — ${e.message?.slice(0,40)}`)
      }
    }
  }
}

async function main() {
  // Import curricula definitions
  const { CURRICULA } = await import('../src/lib/curricula')

  const top = CURRICULA.slice(0, 10) // Focus on top 10 most popular

  for (const c of top) {
    if (c.id === 'cbc') continue // CBC already has full data
    await syncCurriculum(c.id, c.name, c.grades, c.subjects)
  }

  console.log('\n✨ Done.')
  await prisma.$disconnect()
}

main().catch(console.error)
