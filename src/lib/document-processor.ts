import { prisma } from '@/lib/prisma'

export interface ProcessedDocument {
  title: string
  documentType: 'scheme_of_work' | 'lesson_plan' | 'exam' | 'curriculum_guide' | 'resource'
  grade: string
  subject: string
  term?: number
  strandName?: string
  content: string
  metadata: {
    strandCount: number
    substrandCount: number
    outcomeCount: number
    weekCount: number
    formattingStyle: string
    sections: string[]
  }
}

type DocType = ProcessedDocument['documentType']

export function detectDocumentType(extractedText: string, title: string): DocType {
  const lower = extractedText.toLowerCase()
  const titleLower = title.toLowerCase()

  if (lower.includes('scheme of work') || lower.includes('schemes of work') ||
      titleLower.includes('scheme of work') || titleLower.includes('sow') ||
      (lower.includes('week') && lower.includes('strand') && lower.includes('lesson'))) {
    return 'scheme_of_work'
  }

  if (lower.includes('lesson plan') || lower.includes('lesson plans') ||
      titleLower.includes('lesson plan') ||
      (lower.includes('specific learning outcome') && lower.includes('key inquiry question'))) {
    return 'lesson_plan'
  }

  if (lower.includes('exam') || lower.includes('examination') || lower.includes('test paper') ||
      titleLower.includes('exam') || titleLower.includes('test') ||
      lower.includes('section a') || lower.includes('section b')) {
    return 'exam'
  }

  if (lower.includes('curriculum design') || lower.includes('curriculum guide') ||
      lower.includes('syllabus') || titleLower.includes('curriculum')) {
    return 'curriculum_guide'
  }

  return 'resource'
}

export function extractMetadata(text: string, docType: DocType): ProcessedDocument['metadata'] {
  const strandMatches = text.match(/STRAND:?\s*(.+)/gi) || []
  const subStrandMatches = text.match(/SUB[- ]?STRAND:?\s*(.+)/gi) || []
  const outcomeMatches = text.match(/by the end of the (lesson|sub.strand).*learner should be able to/gi) || []
  const weekMatches = text.match(/WEEK\s*(\d+)/gi) || []

  const sections: string[] = []
  const sectionHeaders = text.match(/^[A-Z][A-Z\s]{3,}$/gm) || []
  for (const h of sectionHeaders) {
    if (h.length > 5 && h.length < 60) sections.push(h.trim())
  }

  return {
    strandCount: Math.max(strandMatches.length, (text.match(/strand/gi) || []).length),
    substrandCount: Math.max(subStrandMatches.length, (text.match(/sub.strand/gi) || []).length),
    outcomeCount: outcomeMatches.length,
    weekCount: weekMatches.length,
    formattingStyle: detectFormattingStyle(text),
    sections: [...new Set(sections)].slice(0, 20),
  }
}

function detectFormattingStyle(text: string): string {
  const hasTables = (text.match(/\|.*\|/g) || []).length > 5
  const hasNumberedSections = /^\d+\.\s/m.test(text)
  const hasBullets = (text.match(/^[\s]*[-•*]\s/mg) || []).length > 5
  const hasHeadings = (text.match(/^#{1,3}\s/mg) || []).length > 3

  const styles: string[] = []
  if (hasTables) styles.push('tables')
  if (hasNumberedSections) styles.push('numbered')
  if (hasBullets) styles.push('bullets')
  if (hasHeadings) styles.push('headings')
  return styles.join(', ') || 'plain'
}

export async function storeDocumentInLibrary(
  extractedText: string,
  title: string,
  grade: string,
  subject: string,
  teacherId?: string,
  sourceId?: string
): Promise<string> {
  const docType = detectDocumentType(extractedText, title)
  const metadata = extractMetadata(extractedText, docType)
  const termMatch = title.match(/term\s*(\d)/i) || extractedText.match(/term\s*(\d)/i)

  const doc = await prisma.documentLibrary.create({
    data: {
      title,
      documentType: docType,
      grade,
      subject,
      term: termMatch ? parseInt(termMatch[1]) : null,
      content: extractedText,
      metadata,
      sourceId,
      teacherId,
      isProcessed: true,
    },
  })

  return doc.id
}

export async function getSimilarDocuments(
  grade: string,
  subject: string,
  docType: DocType,
  limit: number = 5
): Promise<{ id: string; title: string; content: string; metadata: any }[]> {
  const docs = await prisma.documentLibrary.findMany({
    where: {
      grade,
      subject,
      documentType: docType,
      isProcessed: true,
    },
    select: {
      id: true,
      title: true,
      content: true,
      metadata: true,
    },
    orderBy: { uploadedAt: 'desc' },
    take: limit,
  })

  return docs
}

export async function getAllTeacherDocuments(teacherId: string): Promise<{ id: string; title: string; documentType: string; grade: string; subject: string; uploadedAt: string }[]> {
  const docs = await prisma.documentLibrary.findMany({
    where: { teacherId },
    select: { id: true, title: true, documentType: true, grade: true, subject: true, uploadedAt: true },
    orderBy: { uploadedAt: 'desc' },
  })
  return docs.map(d => ({ ...d, uploadedAt: d.uploadedAt.toISOString() }))
}

export async function deleteDocument(id: string): Promise<void> {
  await prisma.documentLibrary.delete({ where: { id } })
}
