import { prisma } from '@/lib/prisma'

/**
 * Shared helpers for reading/writing generated-file URLs (PDF / Word / PPTX)
 * stored inside a lesson plan's content JSON. This lets the teacher dashboard
 * surface "Preview" / "Download" for files already uploaded to Supabase instead
 * of regenerating them each time.
 */
export function parseLessonPlanContent(content: any): any {
  if (content == null) return {}
  if (typeof content === 'string') {
    try { return JSON.parse(content) } catch { return { generatedContent: content } }
  }
  return content
}

/** Extract stored generated-file URLs from a lesson plan's content JSON. */
export function getLessonPlanFiles(content: any): {
  pdfUrl: string | null
  wordUrl: string | null
  pptxUrl: string | null
  hasFiles: boolean
} {
  const c = parseLessonPlanContent(content)
  const pdfUrl   = typeof c.pdfUrl   === 'string' && c.pdfUrl.trim()   ? c.pdfUrl   : null
  const wordUrl  = typeof c.wordUrl  === 'string' && c.wordUrl.trim()  ? c.wordUrl  : null
  const pptxUrl  = typeof c.pptxUrl  === 'string' && c.pptxUrl.trim()  ? c.pptxUrl  : null
  return { pdfUrl, wordUrl, pptxUrl, hasFiles: !!(pdfUrl || wordUrl || pptxUrl) }
}

/** Persist one or more generated-file URLs back into a lesson plan's content JSON. */
export async function saveLessonPlanFiles(
  lessonPlanId: string,
  urls: { pdfUrl?: string | null; wordUrl?: string | null; pptxUrl?: string | null },
): Promise<void> {
  try {
    const plan = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } })
    if (!plan) return
    const existing = parseLessonPlanContent(plan.content)
    const next = { ...existing }
    if (urls.pdfUrl !== undefined)  next.pdfUrl  = urls.pdfUrl  || null
    if (urls.wordUrl !== undefined) next.wordUrl = urls.wordUrl || null
    if (urls.pptxUrl !== undefined) next.pptxUrl = urls.pptxUrl || null
    await prisma.lessonPlan.update({ where: { id: lessonPlanId }, data: { content: JSON.stringify(next) } })
  } catch (e) {
    console.warn('[LessonPlanFiles] save failed:', e)
  }
}
