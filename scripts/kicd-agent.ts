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
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-four-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-five-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-six-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-seven-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-eight-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-nine-designs/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-ten/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-eleven/',
  'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-twelve/',
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
interface PdfEntry {
  subject: string
  fileId: string
  gradeLabel: string
}

async function crawlKicd(seedUrls: string[]): Promise<{ browser: any; entries: PdfEntry[] }> {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  const page = await context.newPage()
  const entries: PdfEntry[] = []

  for (const seed of seedUrls) {
    console.log(`Crawling: ${seed}`)
    try {
      await retry(() => page.goto(seed, { waitUntil: 'domcontentloaded', timeout: 30000 }), 2)
      await page.waitForTimeout(8000)

      const gradeLabel = seed.match(/grade-(\w+)/)?.[1] || seed.split('/').filter(Boolean).pop() || ''

      const iframeEntries = await page.evaluate(() => {
        const iframes = document.querySelectorAll('iframe[src*="drive.google.com"]')
        const entries: { subject: string; fileId: string }[] = []
        for (const el of iframes) {
          const iframe = el as HTMLIFrameElement
          const src = iframe.src
          const fileMatch = src.match(/\/d\/([a-zA-Z0-9_-]+)/)
          if (!fileMatch) continue
          const fileId = fileMatch[1]

          let subject = ''
          let node: Element | null = iframe
          for (let i = 0; i < 5 && !subject; i++) {
            const prev = node.previousElementSibling
            if (prev) {
              const text = prev.textContent?.trim()
              if (text && text.length > 1 && text.length < 50) subject = text
            }
            if (!subject && node.parentElement) {
              const parentPrev = node.parentElement.previousElementSibling
              if (parentPrev) {
                const text = parentPrev.textContent?.trim().replace(/Grade \w+ Designs?/i, '').trim()
                if (text && text.length > 1 && text.length < 50) subject = text
              }
              const heading = node.parentElement.querySelector?.('h1, h2, h3, h4, h5')
              if (heading) subject = heading.textContent?.trim() || ''
            }
            node = node.parentElement || node
            if (!node || node === document.body) break
          }
          entries.push({ subject, fileId })
        }
        return entries
      })

      console.log(`  Google Drive iframes: ${iframeEntries.length}`)
      for (const e of iframeEntries) {
        console.log(`    [${e.subject || '(no label)'}] ${e.fileId}`)
        entries.push({ ...e, gradeLabel })
      }

      // Also collect direct PDF links (for non-Google Drive PDFs)
      const directPdfs = await page.$$eval('a[href]', (anchors) =>
        (anchors as HTMLAnchorElement[]).map(a => a.href).filter(href => /\.pdf(\?|$)/i.test(href))
      )
      for (const pdf of directPdfs) {
        console.log(`    Direct PDF: ${pdf.slice(0, 80)}`)
        entries.push({ subject: pdf.split('/').pop() || 'unknown', fileId: pdf, gradeLabel })
      }
    } catch (e) {
      console.warn(`  Crawl error:`, e)
    }
  }

  console.log(`\n  Total entries found: ${entries.length}`)
  return { browser, entries }
}

/* ──── PDF DOWNLOAD VIA BROWSER ──── */
async function downloadPdfFromDrive(context: any, fileId: string): Promise<Buffer> {
  // Use browser context's request API (shares cookies from KICD iframe)
  // This way the request comes from the same authenticated browser session
  const apiRequest = context.request || (context.pages?.()?.[0]?.request)
  if (apiRequest) {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    const resp = await apiRequest.get(downloadUrl, { timeout: 60000 })
    if (resp.ok()) {
      const body = await resp.body()
      const buffer = Buffer.from(body)
      if (buffer.slice(0, 5).toString() === '%PDF-') {
        console.log(`    Downloaded ${(buffer.length / 1024).toFixed(0)} KB`)
        return buffer
      }
      console.log(`    Not a PDF from direct download (${buffer.length} bytes), trying confirm=t...`)
    }

    // Try with confirm=t for large files
    const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
    const resp2 = await apiRequest.get(confirmUrl, { timeout: 60000 })
    if (resp2.ok()) {
      const body2 = await resp2.body()
      const buffer2 = Buffer.from(body2)
      if (buffer2.slice(0, 5).toString() === '%PDF-') {
        console.log(`    Downloaded ${(buffer2.length / 1024).toFixed(0)} KB (confirm=t)`)
        return buffer2
      }
    }
    console.log(`    Google Drive download blocked (file not publicly downloadable)`)
  }

  // Fallback: navigate to view page and try to find download link
  const page = context.pages?.()?.[0]
  if (!page) throw new Error('No browser page available')

  console.log(`    Trying view page download...`)
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`
  await page.goto(viewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(6000)

  // Try download button
  const downloadBtn = await page.$('[aria-label="Download"], [data-tooltip="Download"], button[aria-label*="Download"]')
  if (downloadBtn) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      downloadBtn.click(),
    ])
    if (download) {
      const path = await download.path()
      const fs = await import('fs')
      const buf = fs.readFileSync(path)
      console.log(`    Downloaded via button ${(buf.length / 1024).toFixed(0)} KB`)
      return Buffer.from(buf)
    }
  }

  // Last resort: render view page as PDF
  console.log(`    Falling back to page.pdf() render...`)
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
  return Buffer.from(pdfBuffer)
}

/* ──── PDF EXTRACTION ──── */
async function extractTextFromPDF(url: string): Promise<string> {
  const fileId = isGoogleDrive(url)
  const downloadUrl = fileId
    ? `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
    : url
  console.log(`  Download: ${downloadUrl.slice(0, 80)}...`)

  const res = await retry(() => fetch(downloadUrl, {
    signal: AbortSignal.timeout(30000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://kicd.ac.ke/',
    },
  }))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  // Check if response is HTML (Google sign-in page) instead of PDF
  const header = buffer.slice(0, 5).toString()
  if (header !== '%PDF-') {
    console.log(`  Response header: ${buffer.slice(0, 200).toString('utf-8').slice(0, 120)}...`)
    throw new Error('Response is not a PDF (likely auth/consent page)')
  }

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

/* ──── PROCESS ONE PDF ENTRY ──── */
async function processEntry(context: any, entry: PdfEntry): Promise<string> {
  const url = `gdrive://${entry.fileId}`
  const existing = await (prisma as any).curriculumIngestionLog.findUnique({ where: { url } })
  if (existing?.status === 'COMPLETED') return 'SKIPPED'

  const log = await (prisma as any).curriculumIngestionLog.upsert({
    where: { url },
    update: { status: 'PROCESSING' },
    create: { url, title: `${entry.gradeLabel} ${entry.subject}`, status: 'PROCESSING' },
  })

  try {
    let buffer: Buffer
    if (entry.fileId.includes('/')) {
      // Direct PDF URL (not Google Drive)
      console.log(`  Download: ${entry.fileId.slice(0, 80)}...`)
      const res = await fetch(entry.fileId, { signal: AbortSignal.timeout(60000) })
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      // Google Drive file — download via browser context (has cookies from iframe)
      console.log(`  Fetching: ${entry.fileId} (${entry.subject})...`)
      buffer = await downloadPdfFromDrive(context, entry.fileId)
    }

    const header = buffer.slice(0, 5).toString()
    if (header !== '%PDF-') throw new Error(`Not a PDF (header: ${header || 'none'})`)

    const pdfModule = await import('pdf-parse')
    const PDFParse = pdfModule.PDFParse
    const result = await new PDFParse({ data: buffer }).getText({})
    console.log(`  Extracted ${result.text.length} chars`)

    if (result.text.length < 50) throw new Error('PDF appears empty or image-only')

    const filename = `${entry.gradeLabel}_${entry.subject}.pdf`
    const parsed = await parseWithGemini(result.text, filename)

    const gradeToSave = parsed.grade || entry.gradeLabel
    const subjectToSave = parsed.subject || entry.subject

    const curriculum = await prisma.curriculum.upsert({
      where: { type_grade_subject_term: { type: 'CBC', grade: gradeToSave, subject: subjectToSave, term: 0 as any } },
      update: { isActive: true },
      create: { name: `CBC ${gradeToSave} ${subjectToSave}`, type: 'CBC', grade: gradeToSave, subject: subjectToSave, isActive: true },
    })

    let strandCount = 0, substrandCount = 0
    for (const strand of parsed.strands) {
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

    await (prisma as any).curriculumIngestionLog.update({
      where: { id: log.id }, data: { status: 'COMPLETED', grade: gradeToSave, subject: subjectToSave },
    })
    return `DONE: ${gradeToSave} ${subjectToSave} (${strandCount} strands, ${substrandCount} substrands)`
  } catch (e: any) {
    await (prisma as any).curriculumIngestionLog.update({ where: { id: log.id }, data: { status: 'FAILED', errorMessage: e.message } })
    return `FAILED: ${e.message}`
  }
}

/* ──── MAIN ──── */
async function main() {
  const args = process.argv.slice(2)
  const urlIdx = args.indexOf('--url')
  const inputUrl = urlIdx >= 0 ? args[urlIdx + 1] : null

  if (inputUrl && !inputUrl.includes('kicd.ac.ke')) {
    // Direct PDF/drive URL — single file (legacy mode)
    console.log(`Processing single URL: ${inputUrl}\n`)
    // For single URLs outside KICD, use fetch
    const text = await extractTextFromPDF(inputUrl).catch(e => e.message)
    console.log(text)
    return
  }

  // Crawl mode
  console.log('KICD Curriculum Agent — Crawl Mode\n')
  const seeds = inputUrl ? [inputUrl] : KICD_SEEDS
  const { browser, entries } = await crawlKicd(seeds)

  if (entries.length === 0) {
    console.log('No PDFs discovered.')
    await browser.close()
    return
  }

  const context = browser.contexts?.()?.[0]
  console.log(`Processing ${entries.length} PDF(s)...\n`)

  let done = 0, failed = 0
  for (let i = 0; i < entries.length; i++) {
    console.log(`[${i + 1}/${entries.length}] ${entries[i].gradeLabel} ${entries[i].subject}`)
    const result = await processEntry(context, entries[i])
    console.log(`  ${result}\n`)
    if (result.startsWith('DONE')) done++
    else if (result !== 'SKIPPED') failed++
  }

  await browser.close()
  console.log(`Summary: ${done} done, ${failed} failed`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
