/**
 * Curriculum PDF importer.
 *
 * Turns a Google Drive link to a curriculum design PDF (KICD CBC designs)
 * into structured Curriculum -> Strand -> Substrand data persisted via Prisma.
 *
 * Pipeline:
 *   1. Download the PDF from Google Drive (handles large-file confirm token).
 *   2. Extract raw text with pdf-parse.
 *   3. Parse into structured JSON — AI-first (ElimuNova AI waterfall), with a
 *      rule-based heuristic fallback for KICD design documents.
 *   4. Upsert into the Curriculum / CurriculumStrand / CurriculumSubstrand tables.
 */

import { PDFParse } from 'pdf-parse'
import { prisma } from '@/lib/prisma'
import { generateAIContent } from '@/lib/openrouter-ai'

// ---------------------------------------------------------------------------
// Google Drive download
// ---------------------------------------------------------------------------

const GDRIVE_FILE_URL =
  /(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{10,})/i
const GDRIVE_UC_URL = /(?:drive\.google\.com\/uc\?[^"'\s]*id=)([a-zA-Z0-9_-]{10,})/i
const GDRIVE_VIEW_URL = /(?:drive\.google\.com\/open\?[^"'\s]*id=)([a-zA-Z0-9_-]{10,})/i
const GDRIVE_RAW_ID = /(^|[&=])([a-zA-Z0-9_-]{25,})($|[&=])/

/**
 * Extract a Google Drive file id from common share-URL formats.
 * Returns null if the link doesn't look like a Drive file link.
 */
export function extractGoogleDriveFileId(url: string): string | null {
  const candidates = [
    GDRIVE_FILE_URL.exec(url),
    GDRIVE_UC_URL.exec(url),
    GDRIVE_VIEW_URL.exec(url),
  ]
  for (const m of candidates) {
    if (m && m[1]) return m[1]
  }
  // Last resort: bare file id (28-ish base64 chars) on its own segment.
  if (url.startsWith('https://drive.google.com') || url.includes('drive.google.com')) {
    const m = GDRIVE_RAW_ID.exec(url)
    if (m && m[2] && m[2].length >= 20) return m[2]
  }
  return null
}

/**
 * Download a file from Google Drive as a Buffer.
 * Handles the "Virus scan warning / file too large" confirm-token flow.
 */
export async function downloadGoogleDriveFile(id: string): Promise<Buffer> {
  const base = 'https://drive.google.com/uc'
  const session = {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElimuNova/1.0)' },
  }

  // First pass — may return the HTML virus-scan confirm page.
  let res: Response
  try {
    res = await fetch(`${base}?export=download&id=${id}`, session)
  } catch (err) {
    throw new Error(`Google Drive fetch failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  let arrayBuf = Buffer.from(await res.arrayBuffer())

  // Look for a confirm token in the returned HTML.
  const html = arrayBuf.toString('utf-8')
  const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/)
  const hasPdfSignature = arrayBuf.subarray(0, 4).toString('latin1') === '%PDF'

  if (!hasPdfSignature && confirmMatch) {
    const confirm = confirmMatch[1]
    res = await fetch(`${base}?export=download&id=${id}&confirm=${confirm}`, session)
    arrayBuf = Buffer.from(await res.arrayBuffer())
  }

  if (arrayBuf.subarray(0, 4).toString('latin1') !== '%PDF') {
    throw new Error(
      'Google Drive did not return a PDF. The file may be private, non-PDF, or too large to download directly.'
    )
  }

  return arrayBuf
}

// ---------------------------------------------------------------------------
// PDF -> text
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Returns empty string on failure rather than throwing.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdf = new PDFParse({ data: buffer })
    const result = await pdf.getText({})
    return (result?.text || '').trim()
  } catch (err) {
    console.warn('[CurriculumImporter] PDF text extraction failed:', err)
    return ''
  }
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface ImportedSubstrand {
  name: string
  learningOutcomes: string[]
  activities?: string[]
  description?: string
}

export interface ImportedStrand {
  name: string
  description?: string
  substrands: ImportedSubstrand[]
}

export interface ImportedCurriculum {
  name?: string
  subject: string
  grade: string
  term?: number | null
  description?: string
  strands: ImportedStrand[]
}

const MAX_PROMPT_CHARS = 32000
const MAX_SUBSTRANDS = 60
const MAX_OUTCOMES = 12

/**
 * Rule-based parser for KICD CBC design documents.
 *
 * Works with the typical structure:
 *   "Strand 1.0  Numbers" / "Strand 2:  Measurement"
 *   "Sub-strand 1.1 Counting 1-100" then bullets/lines of "By the end..."
 *
 * Falls back to a naive section split if the numbered pattern isn't present.
 */
export function parseCurriculumHeuristic(rawText: string, grade: string, subject: string): ImportedCurriculum {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  const strandStart = /^(?:strand|theme)\s*(?:[0-9]+[.):\-\s]+)?([a-zA-Z][a-zA-Z0-9 &'\-(),/]*)/i
  const substrandStart = /^(?:sub[- ]?strand|sub-topic|subtopic)\s*(?:[0-9]+[.):\-\s]+)?([a-zA-Z][a-zA-Z0-9 &'\-(),/]*)/i

  const strands: ImportedStrand[] = []
  let currentStrand: ImportedStrand | null = null
  let currentSub: ImportedSubstrand | null = null

  for (const line of lines) {
    // Skip obvious header/footer noise.
    if (/^(kenya institute|kicd|copyright|first published|all rights|printed|isbn)/i.test(line)) continue
    if (/^(strand|sub-strand)\s*[0-9.]+$/i.test(line)) continue
    if (line.length < 3) continue

    const sMatch = line.match(strandStart)
    if (sMatch && !/^(sub[- ]strand)/i.test(line)) {
      // heuristic: only treat as a strand boundary if it looks like a header
      // (short line, capitalized, and the next content line looks like content)
      const name = sMatch[1].trim()
      if (name.length <= 80) {
        currentStrand = { name, substrands: [] }
        strands.push(currentStrand)
        currentSub = null
        continue
      }
    }

    const ssMatch = line.match(substrandStart)
    if (ssMatch && currentStrand) {
      currentSub = { name: ssMatch[1].trim(), learningOutcomes: [] }
      currentStrand.substrands.push(currentSub)
      continue
    }

    if (currentStrand) {
      if (!currentSub && currentStrand.substrands.length > 0) {
        currentSub = currentStrand.substrands[currentStrand.substrands.length - 1]
      }
      // Outcome bullets often begin with "By the end" / "Learners should" /
      // numbered lists / bullets. Append to the latest substrand.
      if (currentSub) {
        const cleaned = line.replace(/^[-•*▪◦]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
        const isOutcome =
          /^by the end|learner|learners|pupil|pupils|should be able|can /i.test(cleaned) ||
          /^(appreciate|identify|recognise|recognize|demonstrate|describe|explain|use |apply |solve |count|read|write|name |sort|compare|measure|tell|draw|sing|dance|play |pray|observe)/i.test(cleaned)
        if (isOutcome && currentSub.learningOutcomes.length < MAX_OUTCOMES) {
          currentSub.learningOutcomes.push(cleaned)
        }
      }
    }
  }

  // If the numbered-strand parser found nothing, split by simple headings.
  if (strands.length === 0) {
    return parseCurriculumBySections(rawText, grade, subject)
  }

  // Drop strands that ended up empty, normalize names.
  const clean = strands
    .filter(s => s.substrands.length > 0)
    .map(s => ({ ...s, name: s.name.replace(/\s+/g, ' ') }))
    .slice(0, MAX_SUBSTRANDS)

  return {
    subject,
    grade,
    strands: clean,
  }
}

/**
 * Very naive fallback: split text into equally sized chunks and treat each as
 * a strand with a couple of outcome bullets. Ensures import still produces
 * structure even for documents the header matcher can't handle.
 */
function parseCurriculumBySections(rawText: string, grade: string, subject: string): ImportedCurriculum {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) {
    return { subject, grade, strands: [] }
  }
  const chunk = Math.max(1, Math.floor(lines.length / 8))
  const strands: ImportedStrand[] = []
  for (let i = 0; i < lines.length; i += chunk) {
    const slice = lines.slice(i, i + chunk)
    const name = slice[0].slice(0, 80) || `Section ${strands.length + 1}`
    const outcomes = slice
      .slice(1, 6)
      .map(l => l.replace(/^[-•*▪◦\d.)]+\s*/, '').trim())
      .filter(l => l.length > 3)
    strands.push({
      name,
      substrands: [{ name, learningOutcomes: outcomes.slice(0, MAX_OUTCOMES) }],
    })
  }
  return { subject, grade, strands: strands.slice(0, MAX_SUBSTRANDS) }
}

// ---------------------------------------------------------------------------
// AI-first parsing
// ---------------------------------------------------------------------------

/**
 * Ask the AI waterfall to convert extracted curriculum text into structured
 * strand/substrand JSON. Throws if AI is unavailable or the response isn't JSON.
 */
export async function parseCurriculumWithAI(rawText: string, grade: string, subject: string): Promise<ImportedCurriculum> {
  const content = rawText.slice(0, MAX_PROMPT_CHARS)
  const prompt = `You are a curriculum specialist for the Kenyan CBC (Competency Based Curriculum).

Convert the following curriculum design document for ${subject} (${grade}) into structured JSON.

Rules:
- Extract every Strand and every Sub-strand with their specific learning outcomes.
- Preserve the exact wording of learning outcomes where present (e.g. "By the end of the sub-strand, the learner should be able to...").
- learningOutcomes is an array of strings; do not truncate.
- activities (optional) is an array of strings.
- Use the exact subject "${subject}" and grade "${grade}".
- Return ONLY valid JSON. No markdown fences, no commentary.

Document text:
${content}

Respond with this JSON shape:
{
  "subject": "${subject}",
  "grade": "${grade}",
  "description": "optional short description",
  "strands": [
    {
      "name": "Strand name",
      "description": "optional",
      "substrands": [
        { "name": "Sub-strand name", "learningOutcomes": ["..."], "activities": ["..."] }
      ]
    }
  ]
}`

  const aiText = await generateAIContent(prompt, { maxTokens: 4000, temperature: 0.2 })

  const cleaned = aiText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('AI response contained no JSON object')
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as ImportedCurriculum
  if (!parsed || !Array.isArray(parsed.strands)) {
    throw new Error('AI response JSON did not contain a strands array')
  }

  return {
    subject,
    grade,
    term: parsed.term ?? null,
    description: parsed.description,
    strands: (parsed.strands || [])
      .slice(0, MAX_SUBSTRANDS)
      .map(s => ({
        name: String(s.name || 'Strand'),
        description: s.description,
        substrands: (s.substrands || []).map(sub => ({
          name: String(sub.name || 'Sub-strand'),
          learningOutcomes: (sub.learningOutcomes || []).map(String),
          activities: (sub.activities || []).map(String),
          description: sub.description,
        })),
      })),
  }
}

/**
 * Parse extracted text into curriculum structure — AI first, heuristic fallback.
 */
export async function parseCurriculumText(rawText: string, grade: string, subject: string): Promise<ImportedCurriculum> {
  try {
    const ai = await parseCurriculumWithAI(rawText, grade, subject)
    if (ai.strands.length > 0) return ai
    console.warn('[CurriculumImporter] AI returned zero strands, using heuristic fallback')
  } catch (err) {
    console.warn('[CurriculumImporter] AI parsing failed, using heuristic fallback:', err)
  }
  return parseCurriculumHeuristic(rawText, grade, subject)
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Upsert a parsed curriculum into the DB. Replaces strands/substrands for the
 * same (grade, subject, term) so re-imports are idempotent.
 */
export async function saveImportedCurriculum(data: ImportedCurriculum): Promise<{
  curriculumId: string
  strandCount: number
  substrandCount: number
}> {
  const subject = data.subject || 'General'
  const grade = data.grade || 'General'
  const term = data.term ?? null

  const name = data.name || `CBC ${grade} ${subject}`

  const existing = await prisma.curriculum.findFirst({
    where: { type: 'CBC', grade, subject, term },
    orderBy: { createdAt: 'desc' },
  })

  const curriculum = existing
    ? await prisma.curriculum.update({
        where: { id: existing.id },
        data: { name, description: data.description, isActive: true },
      })
    : await prisma.curriculum.create({
        data: {
          name,
          type: 'CBC',
          subject,
          grade,
          term,
          description: data.description,
          isActive: true,
        },
      })

  // Delete existing strands (cascades to substrands) and rebuild.
  await prisma.curriculumStrand.deleteMany({ where: { curriculumId: curriculum.id } })

  let strandCount = 0
  let substrandCount = 0
  for (let s = 0; s < data.strands.length; s++) {
    const strand = data.strands[s]
    if (!strand || !strand.name) continue
    const created = await prisma.curriculumStrand.create({
      data: {
        curriculumId: curriculum.id,
        name: strand.name.slice(0, 255),
        description: strand.description,
        order: s,
      },
    })
    strandCount++
    for (let ss = 0; ss < strand.substrands.length; ss++) {
      const sub = strand.substrands[ss]
      if (!sub || !sub.name) continue
      await prisma.curriculumSubstrand.create({
        data: {
          strandId: created.id,
          name: sub.name.slice(0, 255),
          description: sub.description,
          learningOutcomes: sub.learningOutcomes,
          activities: sub.activities || [],
          order: ss,
        },
      })
      substrandCount++
    }
  }

  return { curriculumId: curriculum.id, strandCount, substrandCount }
}

/**
 * Full pipeline: link -> PDF buffer -> text -> parsed -> DB.
 */
export async function importCurriculumFromLink(input: {
  url: string
  grade: string
  subject: string
  term?: number | null
  name?: string
  description?: string
}): Promise<{
  curriculumId: string
  strandCount: number
  substrandCount: number
  parsedWithAI: boolean
  textLength: number
}> {
  const fileId = extractGoogleDriveFileId(input.url)
  if (!fileId) {
    throw new Error('Could not parse a Google Drive file id from the provided link')
  }

  const buffer = await downloadGoogleDriveFile(fileId)
  const text = await extractPdfText(buffer)
  if (!text) {
    throw new Error('No text could be extracted from the PDF (it may be a scanned/image-only document)')
  }

  let parsed: ImportedCurriculum
  let parsedWithAI = true
  try {
    parsed = await parseCurriculumWithAI(text, input.grade, input.subject)
    if (parsed.strands.length === 0) throw new Error('AI returned no strands')
  } catch (err) {
    console.warn('[CurriculumImporter] AI parse failed, falling back to heuristic:', err)
    parsedWithAI = false
    parsed = parseCurriculumHeuristic(text, input.grade, input.subject)
  }

  if (parsed.strands.length === 0) {
    throw new Error('Parser produced no strands. The document may not contain standard strand/sub-strand headings.')
  }

  parsed.term = input.term ?? null
  parsed.description = input.description ?? parsed.description
  if (input.name) parsed.name = input.name

  const saved = await saveImportedCurriculum(parsed)
  return { ...saved, parsedWithAI, textLength: text.length }
}
