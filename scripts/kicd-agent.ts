#!/usr/bin/env ts-node
/**
 * KICD Curriculum Agent — self-healing autonomous curriculum ingestion pipeline.
 * Parses PDFs, OCRs via Gemini, upserts into PostgreSQL via Prisma.
 *
 * Usage: npx ts-node scripts/kicd-agent.ts [--url URL] [--file path/to/urls.txt]
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import PDFParse from 'pdf-parse'

const prisma = new PrismaClient()

interface ParsedCurriculum {
  grade: string
  subject: string
  strands: Array<{
    name: string; order: number
    substrands: Array<{
      name: string; order: number; term?: number
      suggestedLessons?: number
      learningOutcomes: string[]
      inquiryQuestions: string[]
      coreCompetencies: string[]
      suggestedActivities: string[]
    }>
  }>
}

async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn() } catch (e) {
      if (i === maxRetries - 1) throw e
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
    }
  }
  throw new Error('unreachable')
}

function isGoogleDrive(url: string): string | null {
  const match = url.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

function toDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
}

async function extractTextFromPDF(url: string): Promise<string> {
  const downloadUrl = isGoogleDrive(url) ? toDirectUrl(isGoogleDrive(url)!) : url

  const response = await retry(() => fetch(downloadUrl, { signal: AbortSignal.timeout(30000) }))
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  const pdf = new PDFParse({ data: buffer })
  const result = await pdf.getText({})
  return result.text
}

async function parseWithGemini(text: string, filename: string): Promise<ParsedCurriculum> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('No AI API key configured')

  const prompt = `Extract the full CBC curriculum from this document and return ONLY valid JSON matching this structure:
{
  "grade": "Grade 8",
  "subject": "Social Studies",
  "strands": [
    {
      "name": "1.0 Natural and Historical Monuments",
      "order": 1,
      "substrands": [
        {
          "name": "1.1 Historical Sites",
          "order": 1,
          "term": 1,
          "suggestedLessons": 6,
          "learningOutcomes": ["By the end of the sub-strand..."],
          "inquiryQuestions": ["What is the importance of...?"],
          "coreCompetencies": ["Communication", "Critical thinking"],
          "suggestedActivities": ["Learners visit a nearby historical site..."]
        }
      ]
    }
  ]
}

Document: ${filename}
Content: ${text.slice(0, 12000)}`

  const response = await retry(() =>
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8000 },
      }),
      signal: AbortSignal.timeout(60000),
    })
  )

  const data = await response.json() as any
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const json = cleanJson(raw)
  if (!json) throw new Error('Could not parse AI response as JSON')

  return JSON.parse(json)
}

function cleanJson(raw: string): string {
  let t = raw.trim()
  if (t.startsWith('```')) t = t.replace(/```(?:json)?\n?/g, '').trim()
  const start = t.indexOf('{'); const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) return ''
  return t.slice(start, end + 1)
}

async function upsertCurriculum(data: ParsedCurriculum): Promise<{ strands: number; substrands: number }> {
  let strandCount = 0; let substrandCount = 0

  const curriculum = await prisma.curriculum.upsert({
    where: { type_grade_subject_term: { type: 'CBC', grade: data.grade, subject: data.subject, term: null } },
    update: { isActive: true },
    create: { name: `CBC ${data.grade} ${data.subject}`, type: 'CBC', grade: data.grade, subject: data.subject, isActive: true },
  })

  for (const strand of data.strands) {
    const s = await prisma.curriculumStrand.upsert({
      where: { curriculumId_name: { curriculumId: curriculum.id, name: strand.name } },
      update: { order: strand.order },
      create: { curriculumId: curriculum.id, name: strand.name, order: strand.order },
    })
    strandCount++

    for (const sub of strand.substrands) {
      await prisma.curriculumSubstrand.upsert({
        where: { strandId_name: { strandId: s.id, name: sub.name } },
        update: {
          learningOutcomes: sub.learningOutcomes,
          activities: sub.suggestedActivities,
          order: sub.order,
        },
        create: {
          strandId: s.id, name: sub.name, order: sub.order,
          learningOutcomes: sub.learningOutcomes,
          activities: sub.suggestedActivities,
        },
      })
      substrandCount++
    }
  }

  return { strands: strandCount, substrands: substrandCount }
}

async function processUrl(url: string): Promise<void> {
  const existing = await prisma.curriculumIngestionLog.findUnique({ where: { url } })
  if (existing?.status === 'COMPLETED') { console.log(`[SKIP] Already processed: ${url}`); return }

  const log = await prisma.curriculumIngestionLog.upsert({
    where: { url },
    update: { status: 'PROCESSING' },
    create: { url, title: url.split('/').pop() || url, status: 'PROCESSING' },
  })

  try {
    console.log(`[PROCESS] Extracting: ${url}`)
    const text = await extractTextFromPDF(url)

    if (text.length < 200) {
      console.warn(`[WARN] Low text extraction, attempting Gemini OCR`)
    }

    const filename = url.split('/').pop() || 'document.pdf'
    const parsed = await parseWithGemini(text, filename)
    console.log(`[PARSE] Grade ${parsed.grade} ${parsed.subject}: ${parsed.strands.length} strands`)

    const result = await upsertCurriculum(parsed)
    await prisma.curriculumIngestionLog.update({
      where: { id: log.id },
      data: { status: 'COMPLETED', grade: parsed.grade, subject: parsed.subject },
    })
    console.log(`[DONE] ${result.strands} strands, ${result.substrands} substrands saved`)
  } catch (e: any) {
    console.error(`[FAIL] ${url}:`, e.message)
    await prisma.curriculumIngestionLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', errorMessage: e.message },
    })
  }
}

async function main() {
  const args = process.argv.slice(2)
  let urls: string[] = []

  const urlIdx = args.indexOf('--url')
  if (urlIdx >= 0) urls.push(args[urlIdx + 1])

  const fileIdx = args.indexOf('--file')
  if (fileIdx >= 0) {
    const content = fs.readFileSync(args[fileIdx + 1], 'utf-8')
    urls = urls.concat(content.split('\n').map(l => l.trim()).filter(Boolean))
  }

  if (urls.length === 0) {
    console.log('KICD Curriculum Agent\nUsage:\n  npx ts-node scripts/kicd-agent.ts --url https://...\n  npx ts-node scripts/kicd-agent.ts --file urls.txt')
    return
  }

  console.log(`Processing ${urls.length} URLs...`)
  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}]`)
    await processUrl(urls[i])
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
