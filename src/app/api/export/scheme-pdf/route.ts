/**
 * GET /api/export/scheme-pdf?id=xxx
 *
 * Exports a scheme of work as a PDF in KICD table format.
 * Uploads to Supabase Storage and returns download URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, BUCKETS } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const scheme = await prisma.schemeOfWork.findUnique({
      where: { id },
      include: { topics: { orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }] }, teacher: { include: { user: true } } },
    })
    if (!scheme) return NextResponse.json({ error: 'Scheme not found' }, { status: 404 })

    // Parse rows
    let rows: any[] = []
    try {
      rows = typeof scheme.content === 'string' ? JSON.parse(scheme.content) : scheme.content || []
    } catch { rows = [] }

    // If no structured rows, use topics
    if (rows.length === 0 && scheme.topics.length > 0) {
      rows = scheme.topics.map(t => ({
        week:                     t.weekNumber,
        lesson:                   t.lessonNumber,
        strand:                   '',
        subStrand:                t.title,
        specificLearningOutcomes: t.objectives[0] || '',
        keyInquiryQuestions:      [],
        learningExperiences:      t.activities,
        learningResources:        t.resources,
        assessment:               t.assessment || '',
        reflection:               '',
        durationMinutes:          t.duration,
      }))
    }

    // Build teacher name safely
    const teacherName = [
      scheme.teacher?.user?.firstName,
      scheme.teacher?.user?.lastName,
    ].filter(Boolean).join(' ') || 'Teacher'
    const html = buildSchemeHTML(scheme, rows, teacherName)

    // For now return HTML that browser can print to PDF
    // When Puppeteer is available, generate actual PDF
    const htmlBuffer = Buffer.from(html, 'utf-8')

    // Try to save to Supabase
    const fileName  = `${session.user.id}/scheme-${id}.html`
    const publicUrl = await uploadFile(BUCKETS.SCHEMES, fileName, htmlBuffer, 'text/html')

    return new NextResponse(htmlBuffer, {
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="Scheme_${scheme.subject}_${scheme.grade}_${scheme.term || 'Term1'}.html"`,
        'X-Download-URL':      publicUrl || '',
      },
    })
  } catch (error: any) {
    console.error('[EXPORT_SCHEME_PDF]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function esc(s: any): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildSchemeHTML(scheme: any, rows: any[], teacherName: string): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td>${esc(r.week)}</td>
      <td>${esc(r.lesson)}</td>
      <td>${esc(r.strand)}</td>
      <td>${esc(r.subStrand)}</td>
      <td>${esc(r.specificLearningOutcomes)}</td>
      <td>${Array.isArray(r.keyInquiryQuestions) ? r.keyInquiryQuestions.map(esc).join('<br>') : esc(r.keyInquiryQuestions)}</td>
      <td>${Array.isArray(r.learningExperiences) ? r.learningExperiences.map(esc).join('<br>') : esc(r.learningExperiences)}</td>
      <td>${Array.isArray(r.learningResources) ? r.learningResources.map(esc).join('<br>') : esc(r.learningResources)}</td>
      <td>${esc(r.assessment)}</td>
      <td></td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${scheme.title}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; margin: 15mm; }
  h1 { text-align: center; font-size: 13pt; margin-bottom: 4px; }
  .meta { text-align: center; font-size: 9pt; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e3a5f; color: white; padding: 5px 4px; font-size: 8pt; text-align: center; border: 1px solid #ccc; }
  td { padding: 4px; border: 1px solid #ccc; font-size: 8pt; vertical-align: top; }
  tr:nth-child(even) { background: #f5f7fa; }
  @media print { body { margin: 10mm; } @page { size: A4 landscape; margin: 10mm; } }
</style>
</head>
<body>
<h1>SCHEME OF WORK</h1>
<div class="meta">
  <strong>Subject:</strong> ${scheme.subject} &nbsp;&nbsp;
  <strong>Grade:</strong> ${scheme.grade} &nbsp;&nbsp;
  <strong>Term:</strong> ${scheme.term || 'Term 1'} &nbsp;&nbsp;
  <strong>Teacher:</strong> ${teacherName} &nbsp;&nbsp;
  <strong>Year:</strong> ${new Date().getFullYear()}
</div>
<table>
  <thead>
    <tr>
      <th>Wk</th><th>Lsn</th><th>Strand</th><th>Sub-Strand</th>
      <th>Specific Learning Outcomes</th><th>Key Inquiry Questions</th>
      <th>Learning Experiences</th><th>Learning Resources</th>
      <th>Assessment</th><th>Reflection</th>
    </tr>
  </thead>
  <tbody>${rowsHtml}</tbody>
</table>
<br>
<div style="margin-top:10px; font-size:8pt;">
  <strong>Signature:</strong> _________________ &nbsp;&nbsp; <strong>HOD:</strong> _________________ &nbsp;&nbsp; <strong>Date:</strong> _________________
</div>
</body>
</html>`
}
