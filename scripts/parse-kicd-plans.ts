/**
 * Parse KICD lesson-plan PDFs into structured KICDContent rows.
 * Detects the grade from the filename and maps each lesson into
 * grade/subject/term/week/lesson/strand/substrand/outcomes/experiences.
 *
 * Run: npx tsx scripts/parse-kicd-plans.ts "<pdf path>" [term]
 */
import 'dotenv/config'
import { PDFParse } from 'pdf-parse'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

function gradeFromName(name: string): string {
  const m = name.match(/Grade\s*(\d+)/i) || name.match(/Gr\.?\s*(\d+)/i)
  return m ? `Grade ${m[1]}` : ''
}

function subjectFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('mathematics') || lower.includes('math')) return 'Mathematics'
  if (lower.includes('english')) return 'English'
  if (lower.includes('kiswahili') || lower.includes('swahili')) return 'Kiswahili'
  if (lower.includes('science')) return 'Science and Technology'
  if (lower.includes('social')) return 'Social Studies'
  if (lower.includes('creative')) return 'Creative Arts'
  if (lower.includes('agric')) return 'Agriculture and Nutrition'
  if (lower.includes('cre') || lower.includes('religious')) return 'CRE'
  return 'General'
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

// Split the document text into individual lessons. Each lesson begins with a
// "SCHOOL LEVEL LEARNING AREA ..." header row and ends before the next one.
function splitLessons(text: string): string[] {
  const marks: number[] = []
  const re = /SCHOOL\s*\t?\s*LEVEL\s*\t?\s*LEARNING AREA/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    // extend the mark to just before the next "Strand:" shown on the same page
    marks.push(m.index)
  }
  if (marks.length === 0) {
    // fallback: anchor on "Strand:" lines
    const sRe = /Strand:/g
    while ((m = sRe.exec(text)) !== null) {
      const before = text.slice(0, m.index)
      const hIdx = before.lastIndexOf('SCHOOL')
      marks.push(hIdx >= 0 ? hIdx : m.index)
    }
  }
  const parts: string[] = []
  for (let i = 0; i < marks.length; i++) {
    parts.push(text.slice(marks[i], marks[i + 1] ?? text.length))
  }
  return parts.filter(x => x.trim().length > 0)
}

function field(text: string, label: string): string {
  const re = new RegExp(label + ':([\\s\\S]*?)(?=\\n[A-Z][A-Za-z ]+:|\nSubstrand|\nKey Inquiry|\nLesson Learning|\nLearning Resources|\nOrganization|\nPage|$)')
  const m = text.match(re)
  return m ? clean(m[1]) : ''
}

function parseLesson(block: string, grade: string, subject: string, term: number, lessonNum: number): any {
  const strand = (block.match(/Strand:\s*([^\n]+)/) || [])[1]?.trim() || subject
  const substrand = (block.match(/Substrand:\s*([^\n]+)/) || [])[1]?.trim() || 'General'

  // Learning outcomes: between "Lesson Learning Outcome:" and "Key Inquiry Question:"
  const outcomeSection = (block.match(/Lesson Learning Outcome:([\s\S]*?)(?=Key Inquiry Question:)/)?.[1] || '')
  const outcomes = outcomeSection.split('\n')
    .map(l => clean(l).replace(/^-\s*/, ''))
    .filter(l => l && l !== 'By the end of the lesson, the learner should be able to:' && l.length > 10)

  const keyQs = (block.match(/Key Inquiry Question:\s*([^\n]+)/) || [])[1]?.trim()
  const resources = (block.match(/Learning Resources:\s*([^\n]+)/) || [])[1]?.trim()
  const org = (block.match(/Organization of Learning:\s*([^\n]+)/) || [])[1]?.trim()

  // Lesson development: Introduction through Conclusion
  const intro = (block.match(/Introduction([\s\S]*?)(?=Lesson Development|Step 1|Extended Activities|Conclusion)/)?.[1] || '').trim()
  const dev = (block.match(/Lesson Development([\s\S]*?)(?=Extended Activities|Conclusion|Reflection in the lesson)/)?.[1] || '').trim()

  return {
    grade, subject, term,
    week: Math.ceil(lessonNum / 5),
    lesson: ((lessonNum - 1) % 5) + 1,
    strand, subStrand: substrand,
    learningOutcomes: outcomes.length ? outcomes : [`Understand ${substrand.toLowerCase()}`],
    learningExperiences: [intro, dev].filter(Boolean),
    keyInquiryQuestions: keyQs ? [keyQs] : [],
    resources: resources ? [resources] : [],
    assessment: 'Oral questions, observation, and written exercises',
    values: ['Respect', 'Responsibility'],
    competencies: ['Communication & Collaboration', 'Critical Thinking & Problem Solving'],
    source: 'imported',
    isVerified: true,
  }
}

async function main() {
  const pdfPath = process.argv[2]
  const term = parseInt(process.argv[3] || '3', 10)
  if (!pdfPath) { console.error('Usage: npx tsx parse-kicd-plans.ts "<pdf>" [term]'); return }
  const name = path.basename(pdfPath)
  const grade = gradeFromName(name)
  const subject = subjectFromName(name)
  if (!grade) { console.error('Could not detect grade from:', name); return }
  console.log(`📄 ${name}\n  grade=${grade} subject=${subject} term=${term}`)

  const pdf = new PDFParse({ data: fs.readFileSync(pdfPath) })
  const result = await pdf.getText({})
  const text = result.text || ''
  const lessonBlocks = splitLessons(text)
  console.log(`  detected ${lessonBlocks.length} lessons\n`)

  let created = 0
  for (let i = 0; i < lessonBlocks.length; i++) {
    const row = parseLesson(lessonBlocks[i], grade, subject, term, i + 1)
    try {
      await p.kICDContent.create({ data: row })
      created++
    } catch (e) { console.warn('  skip lesson', i+1, e?.message?.slice(0,80)) }
  }
  console.log(`✅ Saved ${created} lessons to KICDContent (Grade ${grade} ${subject} Term ${term})`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
