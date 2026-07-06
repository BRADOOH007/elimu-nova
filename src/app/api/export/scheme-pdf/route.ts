/**
 * GET /api/export/scheme-pdf?id=xxx
 *
 * Exports a scheme of work as a print-ready HTML document matching
 * the schemesofwork.com / official KICD format exactly.
 *
 * Layout:
 *   - Cover header: School name, subject, grade, term, teacher, year
 *   - Official CBC column headers (Wk | Lsn | Strand | Sub-Strand | SLOs |
 *     Key Inquiry Questions | Learning Experiences | Learning Resources |
 *     Assessment | Reflection)
 *   - Break rows span full width in amber
 *   - Print: A4 landscape, 8mm margins
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
      include: {
        topics:  { orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }] },
        teacher: { include: { user: true, school: true } },
      },
    })
    if (!scheme) return NextResponse.json({ error: 'Scheme not found' }, { status: 404 })

    // Parse rows from content JSON
    let rows: any[] = []
    try {
      const parsed = typeof scheme.content === 'string' ? JSON.parse(scheme.content) : scheme.content
      rows = Array.isArray(parsed) ? parsed : []
    } catch { rows = [] }

    // Fallback: build from SchemeTopic records
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
        type:                     'lesson',
      }))
    }

    const teacherName = [scheme.teacher?.user?.firstName, scheme.teacher?.user?.lastName]
      .filter(Boolean).join(' ') || 'Teacher'
    const schoolName = (scheme.teacher as any)?.school?.name || ''

    const html = buildSchemeHTML(scheme, rows, teacherName, schoolName)
    const htmlBuffer = Buffer.from(html, 'utf-8')

    // Upload to Supabase (non-blocking)
    let publicUrl = ''
    try {
      publicUrl = await uploadFile(
        BUCKETS.SCHEMES,
        `${session.user.id}/scheme-${id}.html`,
        htmlBuffer,
        'text/html'
      ) || ''
    } catch { /* non-fatal */ }

    const filename = `Scheme_${scheme.subject}_${scheme.grade}_${(scheme.term || 'Term1').replace(/\s/g, '')}.html`

    return new NextResponse(htmlBuffer, {
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Download-URL':      publicUrl,
      },
    })
  } catch (error: any) {
    console.error('[EXPORT_SCHEME_PDF]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── HTML escaping ─────────────────────────────────────────────────────────
function esc(s: any): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function listItems(arr: any): string {
  if (!arr) return ''
  if (!Array.isArray(arr)) return esc(arr)
  return arr.map((x: any) => `<div class="bullet">• ${esc(x)}</div>`).join('')
}

// ── Main HTML builder ─────────────────────────────────────────────────────
function buildSchemeHTML(scheme: any, rows: any[], teacherName: string, schoolName: string): string {
  const year = new Date().getFullYear()
  const totalTeachingRows = rows.filter(r => r.type !== 'break' && r.type !== 'revision' && r.type !== 'exam').length

  const rowsHtml = rows.map((r, idx) => {
    // ── Break / revision / exam rows ──────────────────────────────────────
    if (r.type === 'break' || r.type === 'revision' || r.type === 'exam') {
      return `
        <tr class="break-row">
          <td class="center bold">${esc(r.week)}</td>
          <td colspan="9" class="center bold break-text">
            ⏸&nbsp; ${esc(r.breakReason || r.specificLearningOutcomes)}
          </td>
        </tr>`
    }

    // ── Teaching rows ──────────────────────────────────────────────────────
    const rowClass = idx % 2 === 0 ? 'row-even' : 'row-odd'
    return `
      <tr class="${rowClass}">
        <td class="center">${esc(r.week)}</td>
        <td class="center">${esc(r.lesson)}</td>
        <td>${esc(r.strand)}</td>
        <td class="bold-cell">${esc(r.subStrand)}</td>
        <td>${esc(r.specificLearningOutcomes)}</td>
        <td>${listItems(r.keyInquiryQuestions)}</td>
        <td>${listItems(r.learningExperiences)}</td>
        <td>${listItems(r.learningResources)}</td>
        <td>${esc(r.assessment)}</td>
        <td class="reflection-cell">&nbsp;</td>
      </tr>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(scheme.title)}</title>
  <style>
    /* ── Reset & Base ────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #111;
      background: #fff;
    }

    /* ── Print settings ─────────────────────────────────────────────── */
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      @page { size: A4 landscape; margin: 8mm 8mm 8mm 8mm; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }

    /* ── Screen wrapper ─────────────────────────────────────────────── */
    @media screen {
      body { padding: 20px; background: #f0f2f5; }
      .page { background: #fff; max-width: 1180px; margin: 0 auto; padding: 16px 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    }

    /* ── Cover / Header ─────────────────────────────────────────────── */
    .cover {
      border: 2px solid #1a3a6c;
      padding: 12px 16px;
      margin-bottom: 12px;
      background: #f7f9fc;
    }
    .cover-title {
      text-align: center;
      font-size: 15pt;
      font-weight: bold;
      color: #1a3a6c;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .cover-subtitle {
      text-align: center;
      font-size: 10pt;
      color: #444;
      margin-bottom: 10px;
    }
    .cover-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px 20px;
      font-size: 9pt;
    }
    .meta-item { display: flex; gap: 6px; }
    .meta-label { font-weight: bold; color: #1a3a6c; min-width: 60px; }
    .meta-value { color: #222; }

    /* ── Table ──────────────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7.8pt;
    }

    /* Column widths — tuned to match schemesofwork.com proportions */
    col.wk   { width: 3%; }
    col.lsn  { width: 3%; }
    col.str  { width: 8%; }
    col.sub  { width: 9%; }
    col.slo  { width: 18%; }
    col.kiq  { width: 12%; }
    col.le   { width: 17%; }
    col.lr   { width: 12%; }
    col.asmt { width: 10%; }
    col.refl { width: 8%; }

    thead tr th {
      background: #1a3a6c;
      color: #fff;
      font-size: 8pt;
      font-weight: bold;
      padding: 5px 4px;
      border: 1px solid #0f2548;
      text-align: center;
      vertical-align: middle;
    }

    tbody td {
      border: 1px solid #b0bbcc;
      padding: 3px 4px;
      vertical-align: top;
      line-height: 1.35;
      word-wrap: break-word;
    }

    .row-even { background: #fff; }
    .row-odd  { background: #f3f6fb; }

    .center { text-align: center; vertical-align: middle; }
    .bold-cell { font-weight: bold; color: #1a3a6c; }
    .reflection-cell { background: #f9f9f9; }

    /* Break rows */
    .break-row td {
      background: #fff8e1 !important;
      border-color: #f0c040 !important;
    }
    .break-text {
      color: #7a5c00;
      font-size: 9pt;
      letter-spacing: 0.5px;
    }

    /* Bullet list inside cells */
    .bullet { margin: 1px 0; padding-left: 2px; }

    /* ── Footer / Signature ─────────────────────────────────────────── */
    .footer {
      margin-top: 14px;
      border-top: 1px solid #1a3a6c;
      padding-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      font-size: 8.5pt;
    }
    .sig-line {
      border-bottom: 1px solid #333;
      padding-bottom: 16px;
      margin-bottom: 4px;
    }
    .sig-label { font-weight: bold; font-size: 8pt; color: #1a3a6c; }

    /* ── Print button (screen only) ─────────────────────────────────── */
    .no-print {
      text-align: center;
      margin: 16px 0;
    }
    .btn-print {
      background: #1a3a6c;
      color: #fff;
      border: none;
      padding: 10px 32px;
      font-size: 11pt;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      letter-spacing: 1px;
    }
    .btn-print:hover { background: #2557a7; }

    .stats { font-size: 8pt; color: #666; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Print button (hidden when printing) -->
    <div class="no-print">
      <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
    </div>

    <!-- ── Cover header ──────────────────────────────────────────── -->
    <div class="cover">
      <div class="cover-title">Scheme of Work</div>
      <div class="cover-subtitle">Kenya Competency-Based Curriculum (CBC) — KICD Format</div>
      <div class="cover-meta">
        ${schoolName ? `<div class="meta-item"><span class="meta-label">School:</span><span class="meta-value">${esc(schoolName)}</span></div>` : ''}
        <div class="meta-item"><span class="meta-label">Subject:</span><span class="meta-value">${esc(scheme.subject)}</span></div>
        <div class="meta-item"><span class="meta-label">Grade/Form:</span><span class="meta-value">${esc(scheme.grade)}</span></div>
        <div class="meta-item"><span class="meta-label">Term:</span><span class="meta-value">${esc(scheme.term || 'Term 1')}</span></div>
        <div class="meta-item"><span class="meta-label">Year:</span><span class="meta-value">${year}</span></div>
        <div class="meta-item"><span class="meta-label">Teacher:</span><span class="meta-value">${esc(teacherName)}</span></div>
        <div class="meta-item"><span class="meta-label">Lessons/Wk:</span><span class="meta-value">${esc((scheme as any).lessonsPerWeek || '—')}</span></div>
        <div class="meta-item"><span class="meta-label">Duration:</span><span class="meta-value">${esc(scheme.duration || '—')} weeks</span></div>
        <div class="meta-item"><span class="meta-label">Total Lessons:</span><span class="meta-value">${totalTeachingRows}</span></div>
      </div>
    </div>

    <!-- ── KICD Table ─────────────────────────────────────────────── -->
    <table>
      <colgroup>
        <col class="wk"> <col class="lsn"> <col class="str"> <col class="sub">
        <col class="slo"> <col class="kiq"> <col class="le">  <col class="lr">
        <col class="asmt"> <col class="refl">
      </colgroup>
      <thead>
        <tr>
          <th>WK</th>
          <th>LSN</th>
          <th>STRAND</th>
          <th>SUB-STRAND</th>
          <th>SPECIFIC LEARNING OUTCOMES (SLOs)</th>
          <th>KEY INQUIRY QUESTIONS</th>
          <th>LEARNING EXPERIENCES</th>
          <th>LEARNING RESOURCES</th>
          <th>ASSESSMENT</th>
          <th>REFLECTION</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- ── Signature block ───────────────────────────────────────── -->
    <div class="footer">
      <div>
        <div class="sig-line">&nbsp;</div>
        <div class="sig-label">Teacher's Signature</div>
      </div>
      <div>
        <div class="sig-line">&nbsp;</div>
        <div class="sig-label">HOD's Signature</div>
      </div>
      <div>
        <div class="sig-line">&nbsp;</div>
        <div class="sig-label">Principal's Signature &amp; Date</div>
      </div>
    </div>

  </div><!-- /page -->

  <script>
    // Auto-open print dialog when opened in browser with ?print=1
    if (new URLSearchParams(window.location.search).get('print') === '1') {
      window.addEventListener('load', () => setTimeout(() => window.print(), 400));
    }
  </script>
</body>
</html>`
}
