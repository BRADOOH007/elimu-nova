import { prisma } from '@/lib/prisma'

/**
 * Shared helpers for reading/writing generated-file URLs (PDF / Word / PPTX)
 * stored inside a scheme of work's content JSON. Mirrors lesson-plan-files.ts.
 */
export function parseSchemeOfWorkContent(content: any): any {
  if (content == null) return {}
  if (typeof content === 'string') {
    try { return JSON.parse(content) } catch { return { generatedContent: content } }
  }
  return content
}

/** Extract stored generated-file URLs from a scheme of work's content JSON. */
export function getSchemeOfWorkFiles(content: any): {
  pdfUrl: string | null
  wordUrl: string | null
  pptxUrl: string | null
  hasFiles: boolean
} {
  const c = parseSchemeOfWorkContent(content)
  const pdfUrl   = typeof c.pdfUrl   === 'string' && c.pdfUrl.trim()   ? c.pdfUrl   : null
  const wordUrl  = typeof c.wordUrl  === 'string' && c.wordUrl.trim()  ? c.wordUrl  : null
  const pptxUrl  = typeof c.pptxUrl  === 'string' && c.pptxUrl.trim()  ? c.pptxUrl  : null
  return { pdfUrl, wordUrl, pptxUrl, hasFiles: !!(pdfUrl || wordUrl || pptxUrl) }
}

/** Persist one or more generated-file URLs back into a scheme of work's content JSON. */
export async function saveSchemeOfWorkFiles(
  schemeOfWorkId: string,
  urls: { pdfUrl?: string | null; wordUrl?: string | null; pptxUrl?: string | null },
): Promise<void> {
  try {
    const scheme = await prisma.schemeOfWork.findUnique({ where: { id: schemeOfWorkId } })
    if (!scheme) return
    const existing = parseSchemeOfWorkContent(scheme.content)
    const next = { ...existing }
    if (urls.pdfUrl !== undefined)  next.pdfUrl  = urls.pdfUrl  || null
    if (urls.wordUrl !== undefined) next.wordUrl = urls.wordUrl || null
    if (urls.pptxUrl !== undefined) next.pptxUrl = urls.pptxUrl || null
    // Keep the same shape as it was originally stored (content may have been a
    // plain string or a JSON object). We always upgrade to a JSON object so
    // URLs can be attached without conflicting with generatedContent.
    await prisma.schemeOfWork.update({ where: { id: schemeOfWorkId }, data: { content: JSON.stringify(next) } })
  } catch (e) {
    console.warn('[SchemeOfWorkFiles] save failed:', e)
  }
}
