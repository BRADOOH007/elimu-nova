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

/* ──── PDF TEXT EXTRACTION ──── */
async function extractTextFromDrive(page: any, fileId: string): Promise<{ text: string; method: string }> {
  // Strategy: open the Google Drive preview, wait for the PDF to render,
  // then extract text directly from the DOM (Google's PDF viewer renders text as selectable DOM nodes)

  await page.goto(`https://drive.google.com/file/d/${fileId}/preview`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  })
  await page.waitForTimeout(10000)

  // Get all visible text from the page
  const bodyText = await page.evaluate(() => {
    // Try to find the PDF viewer content container
    const viewer = document.querySelector('[role="document"], #drive-viewer-page, .ndfHFb-c4YZDc')
    if (viewer) return viewer.textContent || ''
    return document.body.innerText || ''
  })

  if (bodyText.length > 200) {
    // Clean up common Google Drive UI text
    const cleaned = bodyText
      .replace(/Request a review|Learn more|Signature pending|Sign|Reject|View details|Review|Not spam|Remove forever\|Not spam|Loading[^\n]*/gi, '')
      .replace(/\{"id":.*?\}/g, '')
      .replace(/JavaScript.*needed|Go to Drive|Open in.*editor/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (cleaned.length > 150) {
      console.log(`    Extracted ${cleaned.length} chars from DOM`)
      return { text: cleaned, method: 'dom-text' }
    }
  }

  // Fallback: screenshot + page.pdf for OCR (visual extraction)
  console.log(`    DOM text too short (${bodyText.length} chars), using visual extraction...`)
  const pdfBuf = await page.pdf({ format: 'A4', printBackground: true, scale: 1.5, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
  console.log(`    Visual PDF: ${(pdfBuf.length / 1024).toFixed(0)} KB`)
  
  // Try pdf-parse on the visual PDF (text may be embedded as images)
  try {
    const pdfModule = await import('pdf-parse')
    const PDFParse = pdfModule.PDFParse
    const result = await new PDFParse({ data: Buffer.from(pdfBuf) }).getText({})
    if (result.text.length > 100) {
      console.log(`    pdf-parse extracted ${result.text.length} chars from rendered PDF`)
      return { text: result.text, method: 'page-pdf' }
    }
  } catch { /* pdf-parse failed, continue to image OCR */ }

  // Last resort: pass the rendered page as base64 image to AI vision
  const screenshot = await page.screenshot({ type: 'png', fullPage: true })
  const base64 = Buffer.from(screenshot).toString('base64')
  console.log(`    Screenshot: ${(screenshot.length / 1024).toFixed(0)} KB, will use AI vision OCR`)
  return { text: `[image:${base64.slice(0, 50)}...]`, method: 'screenshot' }
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

/* ──── AI VISION OCR ──── */
async function parseWithGeminiVision(imageData: string, filename: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('No OPENAI_API_KEY for vision')

  const base64 = imageData.slice(7, -3)

  // Use Google's Gemini via OpenRouter (or direct Google endpoint if key is GEMINI)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Extract ALL visible text from this curriculum document screenshot. Output raw text.' },
          { inlineData: { mimeType: 'image/png', data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(60000),
    })
    const geminiVisData = await res.json() as any
    return geminiVisData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // Fallback: OpenRouter with vision-capable model
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Extract ALL visible text from this curriculum document screenshot. Output raw text only.' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
      ]}],
      temperature: 0.1,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(60000),
  })
  const data = await res.json() as any
  return data?.choices?.[0]?.message?.content || ''
}

/* ──── GEMINI OCR ──── */
async function parseWithGemini(text: string, filename: string): Promise<ParsedCurriculum> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

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
Content: ${text.slice(0, 15000)}`

  let raw: string

  if (geminiKey) {
    // Use Gemini
    const res = await retry(() =>
      fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
        signal: AbortSignal.timeout(120000),
      })
    )
    const geminiData = await res.json() as any
    raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else if (openaiKey) {
    // Fallback via OpenRouter (key starts with sk-or-v1)
    const body = JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    })
    const res = await retry(() =>
      fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${openaiKey}`,
          'HTTP-Referer': 'https://elimu-nova.vercel.app',
          'X-Title': 'Elimu Nova KICD Agent',
        },
        body,
        signal: AbortSignal.timeout(120000),
      })
    )
    const orData = await res.json() as any
    if (!res.ok || orData.error) {
      console.log(`    OpenRouter error: ${res.status} - ${JSON.stringify(orData).slice(0, 200)}`)
      throw new Error(`OpenRouter API error: ${orData.error?.message || res.status}`)
    }
    raw = orData?.choices?.[0]?.message?.content || ''
  } else {
    throw new Error('No GEMINI_API_KEY or OPENAI_API_KEY in env')
  }

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
async function processEntry(page: any, entry: PdfEntry, extractOnly: boolean): Promise<string> {
  const url = `gdrive://${entry.fileId}`
  const existing = await (prisma as any).curriculumIngestionLog.findUnique({ where: { url } })
  if (existing?.status === 'COMPLETED') return 'SKIPPED'

  const log = await (prisma as any).curriculumIngestionLog.upsert({
    where: { url },
    update: { status: 'PROCESSING' },
    create: { url, title: `${entry.gradeLabel} ${entry.subject}`, status: 'PROCESSING' },
  })

  try {
    let text: string

    if (entry.fileId.includes('/')) {
      // Direct PDF URL — download normally
      console.log(`  Download: ${entry.fileId.slice(0, 80)}...`)
      const res = await fetch(entry.fileId, { signal: AbortSignal.timeout(60000) })
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.slice(0, 5).toString() !== '%PDF-') throw new Error('Not a PDF')
      const pdfModule = await import('pdf-parse')
      const PDFParse = pdfModule.PDFParse
      const result = await new PDFParse({ data: buf }).getText({})
      text = result.text
      console.log(`  Extracted ${text.length} chars`)
    } else {
      // Google Drive file — extract text from rendered preview
      const extracted = await extractTextFromDrive(page, entry.fileId)
      text = extracted.text
    }

    if (text.length < 50 || text.startsWith('[image:')) {
      if (text.startsWith('[image:')) {
        console.log('    Using AI vision OCR for screenshot...')
        text = await parseWithGeminiVision(text, `${entry.gradeLabel}_${entry.subject}`)
      } else {
        throw new Error(`Text too short (${text.length} chars)`)
      }
    }

    // Save extracted text to file as backup (in case AI parsing fails later)
    const cacheDir = 'cache/kicd-texts'
    const fsMod = await import('fs')
    const pathMod = await import('path')
    fsMod.mkdirSync(cacheDir, { recursive: true })
    const textFile = pathMod.join(cacheDir, `${entry.gradeLabel}_${entry.subject.replace(/[^a-zA-Z0-9]/g, '_')}.txt`)
    fsMod.writeFileSync(textFile, text)

    const filename = `${entry.gradeLabel}_${entry.subject}.pdf`

    if (extractOnly) {
      console.log(`  Saved ${text.length} chars`)
      await (prisma as any).curriculumIngestionLog.upsert({
        where: { url: `gdrive://${entry.fileId}` },
        update: { status: 'EXTRACTED', grade: entry.gradeLabel, subject: entry.subject },
        create: { url: `gdrive://${entry.fileId}`, title: filename, status: 'EXTRACTED', grade: entry.gradeLabel, subject: entry.subject },
      })
      return `SAVED: ${entry.gradeLabel} ${entry.subject}`
    }

    const parsed = await parseWithGemini(text, filename)

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
  const extractOnly = args.includes('--extract-only')

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
  const page = context?.pages?.()?.[0]
  console.log(`Processing ${entries.length} PDF(s)...\n`)

  let done = 0, failed = 0
  for (let i = 0; i < entries.length; i++) {
    console.log(`[${i + 1}/${entries.length}] ${entries[i].gradeLabel} ${entries[i].subject}`)
    const result = await processEntry(page, entries[i], extractOnly)
    console.log(`  ${result}\n`)
    if (result.startsWith('DONE') || result.startsWith('SAVED')) done++
    else if (result !== 'SKIPPED') failed++
  }

  await browser.close()
  console.log(`Summary: ${done} done, ${failed} failed`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
