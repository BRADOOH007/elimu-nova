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
async function ocrWithVision(imageData: string, filename: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    // Gemini native vision (most reliable for OCR)
    const key = geminiKey.split(',')[0]?.trim()
    const base64 = imageData.slice(7, -3)
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Extract ALL visible text from this curriculum document screenshot. Output raw text.' },
          { inlineData: { mimeType: 'image/png', data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(60000),
    })
    const data = await res.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (text.length > 50) return text
  }

  // Fallback: use waterfall with a vision prompt (base64 may not work on all providers)
  const { content } = await waterfallAI(`Extract ALL visible text from this curriculum document. Output raw text only.`)
  return content
}

/* ──── AI PROVIDER WATERFALL ──── */
interface AIProviderConfig {
  name: string
  url: string
  key: string
  model: string
  headers: (key: string) => Record<string, string>
  bodyFn: (key: string) => object
  parseResponse: (data: any) => string
}

async function callProvider(config: AIProviderConfig): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(config.url, {
        method: 'POST',
        headers: { ...config.headers(config.key), 'Content-Type': 'application/json' },
        body: JSON.stringify(config.bodyFn(config.key)),
        signal: AbortSignal.timeout(120000),
      })
      const json = await res.json() as any
      if (res.status === 429 && attempt < 2) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 3000))
        continue
      }
      if (!res.ok) throw new Error(`${config.name}: ${res.status} ${json.error?.message || ''}`)
      return config.parseResponse(json) || ''
    } catch (e: any) {
      if (attempt === 2) throw e
      if (e.message?.includes('429') || e.message?.includes('rate')) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 3000))
        continue
      }
      throw e
    }
  }
  throw new Error(`${config.name}: exhausted retries`)
}

async function waterfallAI(prompt: string): Promise<{ content: string; provider: string }> {
  const OPENAI_FORMAT = (model: string) => ({
    model,
    messages: [{ role: 'user' as const, content: prompt }],
    temperature: 0.1,
    max_tokens: 4096,
  })

  const providers: AIProviderConfig[] = [
    {
      name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY || '',
      model: 'llama-3.1-8b-instant',
      headers: (k) => ({ 'Authorization': `Bearer ${k}` }),
      bodyFn: () => OPENAI_FORMAT('llama-3.1-8b-instant'),
      parseResponse: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      name: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions',
      key: process.env.DEEPSEEK_API_KEY || '',
      model: 'deepseek-chat',
      headers: (k) => ({ 'Authorization': `Bearer ${k}` }),
      bodyFn: () => OPENAI_FORMAT('deepseek-chat'),
      parseResponse: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      name: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: (process.env.GEMINI_API_KEY || '').split(',')[0]?.trim() || '',
      model: 'gemini-2.0-flash',
      headers: (k) => ({ 'Authorization': `Bearer ${k}` }),
      bodyFn: () => OPENAI_FORMAT('gemini-2.0-flash'),
      parseResponse: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENAI_API_KEY || '',
      model: 'openai/gpt-4o-mini',
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'HTTP-Referer': 'https://elimu-nova.vercel.app' }),
      bodyFn: () => OPENAI_FORMAT('openai/gpt-4o-mini'),
      parseResponse: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      name: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions',
      key: process.env.CEREBRAS_API_KEY || '',
      model: 'llama3.1-8b',
      headers: (k) => ({ 'Authorization': `Bearer ${k}` }),
      bodyFn: () => OPENAI_FORMAT('llama3.1-8b'),
      parseResponse: (d) => d?.choices?.[0]?.message?.content || '',
    },
  ]

  for (const p of providers) {
    if (!p.key || p.key.length < 10) continue
    try {
      const content = await callProvider(p)
      if (content && content.length > 20) {
        console.log(`  AI: ${p.name} (${p.model}) — ${content.length} chars`)
        return { content, provider: p.name }
      }
      console.log(`  ${p.name}: empty response`)
    } catch (e: any) {
      console.log(`  ${p.name}: ${e.message?.slice(0, 60)}`)
    }
  }
  throw new Error('All AI providers failed')
}

/* ──── CURRICULUM PARSER ──── */
async function parseCurriculum(text: string, filename: string): Promise<ParsedCurriculum> {
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

  const { content: raw } = await waterfallAI(prompt)
  const json = extractJson(raw)
  if (!json) throw new Error('Could not parse AI response as JSON')
  const parsed = JSON.parse(json) as ParsedCurriculum

  // Normalize: ensure strands is always an array
  if (parsed && !Array.isArray(parsed.strands)) {
    parsed.strands = Object.values(parsed.strands || {}).filter((s: any) => s && typeof s === 'object')
  }
  if (!Array.isArray(parsed.strands) || parsed.strands.length === 0) {
    throw new Error('No valid strands found in AI response')
  }
  return parsed
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
        text = await ocrWithVision(text, `${entry.gradeLabel}_${entry.subject}`)
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

    const parsed = await parseCurriculum(text, filename)

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
    // Rate-limit: wait between AI calls
    if (!extractOnly) await new Promise(r => setTimeout(r, 2000))
  }

  await browser.close()
  console.log(`Summary: ${done} done, ${failed} failed`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
