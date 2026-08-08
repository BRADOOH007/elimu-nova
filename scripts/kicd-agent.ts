#!/usr/bin/env ts-node
/**
 * KICD Curriculum Agent — autonomous web crawler + PDF ingestion pipeline.
 * Crawls kicd.ac.ke, discovers curriculum PDFs, downloads, OCRs via Gemini,
 * upserts into PostgreSQL via Prisma.
 *
 * Usage:
 *   npx ts-node scripts/kicd-agent.ts              (full crawl + ingest)
 *   npx ts-node scripts/kicd-agent.ts --url <URL>  (single URL)
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import { chromium } from 'playwright'

const prisma = new PrismaClient()

const KICD_SEEDS = [
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/regular-curriculum-designs/',
  'https://kicd.ac.ke/downloads/',
]

interface ParsedCurriculum {
  grade: string; subject: string
  strands: Array<{
    name: string; order: number
    substrands: Array<{
      name: string; order: number; teachingWeeks?: number
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
  const m = url.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function isPdfUrl(url: string): boolean {
  return /\.pdf$/i.test(url) || /drive\.google\.com\/file\/d\//i.test(url)
}

/* ──── CRAWLER ──── */
async function crawlKicd(seedUrls: string[]): Promise<string[]> {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  const page = await context.newPage()
  const allUrls = new Set<string>()

  for (const seed of seedUrls) {
    console.log(`Crawling: ${seed}`)
    try {
      await retry(() => page.goto(seed, { waitUntil: 'networkidle', timeout: 30000 }), 2)

      // Click any "Load more" or pagination buttons
      const loadButtons = page.locator('a:has-text("Load more"), button:has-text("More"), a:has-text("Next"), a:has-text("2")')
      const loadCount = await loadButtons.count()
      for (let i = 0; i < loadCount && i < 5; i++) {
        try {
          await loadButtons.nth(i).click()
          await page.waitForTimeout(2000)
        } catch { /* ignore */ }
      }

      // Extract all links from the page
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'))
        return anchors.map(a => (a as HTMLAnchorElement).href).filter(href =>
          href.includes('.pdf') || href.includes('drive.google.com/file/d/') || href.includes('download')
        )
      })

      for (const link of links) {
        if (isPdfUrl(link)) allUrls.add(link)
      }
      console.log(`  Found ${links.length} PDF links on this page`)
    } catch (e) {
      console.warn(`  Crawl error for ${seed}:`, e)
    }
  }

  // Also check iframe sources on KICD pages
  for (const seed of seedUrls) {
    try {
      await page.goto(seed, { waitUntil: 'domcontentloaded', timeout: 15000 })
      const iframeUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('iframe[src]')).map(f => (f as HTMLIFrameElement).src)
      })
      for (const url of iframeUrls) {
        if (isPdfUrl(url)) allUrls.add(url)
      }
    } catch { /* ignore */ }
  }

  await browser.close()
  console.log(`Total unique PDFs found: ${allUrls.size}\n`)
  return [...allUrls]
}

/* ──── PDF EXTRACTION ──── */
async function extractTextFromPDF(url: string): Promise<string> {
  const fileId = isGoogleDrive(url)
  const downloadUrl = fileId
    ? `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
    : url
  console.log(`  Download: ${downloadUrl.slice(0, 80)}...`)

  const res = await retry(() => fetch(downloadUrl, { signal: AbortSignal.timeout(30000) }))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const pdfModule = await import('pdf-parse')
  const PDFParse = pdfModule.PDFParse
  const result = await new PDFParse({ data: buffer }).getText({})
  console.log(`  Extracted ${result.text.length} chars`)
  return result.text
}

/* ──── GEMINI OCR ──── */
async function parseWithGemini(text: string, filename: string): Promise<ParsedCurriculum> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('No GEMINI_API_KEY or OPENAI_API_KEY in env')

  const prompt = `Extract the full CBC curriculum from this document. Return ONLY valid JSON:
{
  "grade": "Grade 8",
  "subject": "Social Studies",
  "strands": [{
    "name": "1.0 Natural Monuments",
    "order": 1,
    "substrands": [{
      "name": "1.1 Historical Sites",
      "order": 1,
      "teachingWeeks": 6,
      "learningOutcomes": ["By the end of the sub-strand, the learner should be able to..."],
      "inquiryQuestions": ["What is the importance of...?"],
      "coreCompetencies": ["Communication", "Critical thinking"],
      "suggestedActivities": ["Learners visit a nearby site..."]
    }]
  }]
}
File: ${filename}
Content: ${text.slice(0, 12000)}`

  const res = await retry(() =>
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(60000),
    })
  )

  const data = await res.json() as any
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const json = extractJson(raw)
  if (!json) throw new Error('Could not parse AI response as JSON')
  return JSON.parse(json)
}

function extractJson(raw: string): string {
  let t = raw.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('{'), end = t.lastIndexOf('}')
  return (start >= 0 && end > start) ? t.slice(start, end + 1) : ''
}

/* ──── DB UPSERT ──── */
async function upsertCurriculum(data: ParsedCurriculum): Promise<{ strands: number; substrands: number }> {
  let strandCount = 0, substrandCount = 0

  const curriculum = await prisma.curriculum.upsert({
    where: { type_grade_subject_term: { type: 'CBC', grade: data.grade, subject: data.subject, term: 0 as any } },
    update: { isActive: true },
    create: { name: `CBC ${data.grade} ${data.subject}`, type: 'CBC', grade: data.grade, subject: data.subject, isActive: true },
  })

  for (const strand of data.strands) {
    let s = await prisma.curriculumStrand.findFirst({ where: { curriculumId: curriculum.id, name: strand.name } })
    if (s) {
      s = await prisma.curriculumStrand.update({ where: { id: s.id }, data: { order: strand.order } })
    } else {
      s = await prisma.curriculumStrand.create({ data: { curriculumId: curriculum.id, name: strand.name, order: strand.order } })
    }
    strandCount++

    for (const sub of strand.substrands) {
      const existing = await prisma.curriculumSubstrand.findFirst({ where: { strandId: s.id, name: sub.name } })
      if (existing) {
        await prisma.curriculumSubstrand.update({ where: { id: existing.id }, data: { learningOutcomes: sub.learningOutcomes, activities: sub.suggestedActivities, order: sub.order } })
      } else {
        await prisma.curriculumSubstrand.create({ data: { strandId: s.id, name: sub.name, order: sub.order, learningOutcomes: sub.learningOutcomes, activities: sub.suggestedActivities } })
      }
      substrandCount++
    }
  }

  return { strands: strandCount, substrands: substrandCount }
}

/* ──── PROCESS ONE URL ──── */
async function processUrl(url: string): Promise<string> {
  const existing = await (prisma as any).curriculumIngestionLog.findUnique({ where: { url } })
  if (existing?.status === 'COMPLETED') return 'SKIPPED'

  const log = await (prisma as any).curriculumIngestionLog.upsert({
    where: { url },
    update: { status: 'PROCESSING' },
    create: { url, title: url.split('/').pop() || url, status: 'PROCESSING' },
  })

  try {
    const text = await extractTextFromPDF(url)
    if (text.length < 50) throw new Error('PDF appears empty or image-only')
    const filename = url.split('/').pop() || 'document.pdf'
    const parsed = await parseWithGemini(text, filename)

    const result = await upsertCurriculum(parsed)
    await (prisma as any).curriculumIngestionLog.update({
      where: { id: log.id }, data: { status: 'COMPLETED', grade: parsed.grade, subject: parsed.subject },
    })
    return `DONE: Grade ${parsed.grade} ${parsed.subject} (${result.strands} strands, ${result.substrands} substrands)`
  } catch (e: any) {
    await (prisma as any).curriculumIngestionLog.update({ where: { id: log.id }, data: { status: 'FAILED', errorMessage: e.message } })
    return `FAILED: ${e.message}`
  }
}

/* ──── MAIN ──── */
async function main() {
  const args = process.argv.slice(2)

  // Single URL mode
  const urlIdx = args.indexOf('--url')
  if (urlIdx >= 0) {
    const url = args[urlIdx + 1]
    console.log(`Processing single URL: ${url}\n`)
    const result = await processUrl(url)
    console.log(result)
    return
  }

  // Full crawl mode (default)
  console.log('KICD Curriculum Agent — Full Crawl Mode\n')
  const discovered = await crawlKicd(KICD_SEEDS)

  if (discovered.length === 0) {
    console.log('No PDFs discovered. The KICD website structure may have changed.')
    return
  }

  console.log(`Processing ${discovered.length} discovered PDFs...\n`)
  for (let i = 0; i < discovered.length; i++) {
    console.log(`[${i + 1}/${discovered.length}] ${discovered[i]}`)
    const result = await processUrl(discovered[i])
    console.log(`  ${result}\n`)
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
