/**
 * POST /api/export/lesson-plan
 *
 * Exports a lesson plan as a print-ready HTML document matching the
 * official KICD CBC lesson plan format used by Kenyan teachers.
 *
 * Accepts either:
 *   - lessonPlanId: string  — loads from DB
 *   - content: any          — raw lesson plan content
 *   - title, subject, grade, topic, duration
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, BUCKETS } from '@/lib/supabase'
import { route } from '@/lib/api-middleware'
import { generateLessonPlanPDF } from '@/lib/kicd-lesson-plan-pdf'
import { normalizeLessonContent } from '@/lib/lesson-plan-content'
import { saveLessonPlanFiles } from '@/lib/lesson-plan-files'

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  let { content, title, subject, grade, topic, duration, lessonPlanId } = body

  if (lessonPlanId && !content) {
    const plan = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } })
    if (plan) {
      title   = plan.title
      subject = plan.subject
      grade   = plan.grade
      try {
        content = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content
      } catch (e) {
        console.warn('[ExportLessonPlan] JSON parse failed:', e)
        content = { generatedContent: plan.content }
      }
    }
  }

  let teacherName = user.name || 'Teacher'
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { user: true },
    })
    if (teacher?.user) {
      teacherName = `${teacher.user.firstName || ''} ${teacher.user.lastName || ''}`.trim() || teacherName
    }
  } catch { /* non-fatal */ }

  const safeName = (title || topic || 'LessonPlan').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const format = body.format || 'pdf'

  if (format === 'word') {
    const html = buildLessonPlanHTML(content, title, subject, grade, topic, duration, teacherName)
    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${safeName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>body{font-family:Arial,sans-serif;font-size:10pt;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #999;padding:4px 8px;}</style>
</head><body>${html.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<body>|<\/body>|<!DOCTYPE[^>]*>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')}</body></html>`
    const wordBuffer = Buffer.from(wordHtml, 'utf-8')
    let wordUrl = ''
    try {
      wordUrl = await uploadFile(BUCKETS.LESSON_PLANS, `${user.id}/lesson-${safeName}.doc`, wordBuffer, 'application/msword') || ''
    } catch { /* non-fatal */ }
    if (lessonPlanId && wordUrl) await saveLessonPlanFiles(lessonPlanId, { wordUrl })
    return new NextResponse(wordBuffer, {
      headers: {
        'Content-Type':        'application/msword; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeName}.doc"`,
        'X-Download-URL':      wordUrl,
      },
    })
  }

  // ── PDF: generate a real PDF file for direct download ──
  if (format === 'pdf' || format === 'pdf-file') {
    try {
      const pdf = generateLessonPlanPDF(content, { title, subject, grade, topic, teacherName })
      const buffer = Buffer.from(pdf.output('arraybuffer'))
      let pdfUrl = ''
      try {
        pdfUrl = await uploadFile(BUCKETS.LESSON_PLANS, `${user.id}/lesson-${safeName}.pdf`, buffer, 'application/pdf') || ''
      } catch { /* non-fatal */ }
      if (lessonPlanId && pdfUrl) await saveLessonPlanFiles(lessonPlanId, { pdfUrl })
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
          'X-Download-URL':      pdfUrl,
        },
      })
    } catch (e) {
      console.warn('[ExportLessonPlan] PDF generation failed, falling back to HTML:', e)
      // Fall back to HTML (printable) — never fail the download
    }
  }

  // ── Fallback: HTML (print-ready) as an attachment download ──
  const html = buildLessonPlanHTML(content, title, subject, grade, topic, duration, teacherName)
  const htmlBuffer = Buffer.from(html, 'utf-8')
  let htmlUrl = ''
  try {
    htmlUrl = await uploadFile(BUCKETS.LESSON_PLANS, `${user.id}/lesson-${safeName}.html`, htmlBuffer, 'text/html') || ''
  } catch { /* non-fatal */ }
  if (lessonPlanId && htmlUrl) await saveLessonPlanFiles(lessonPlanId, { pdfUrl: htmlUrl })
  return new NextResponse(htmlBuffer, {
    headers: {
      'Content-Type':        'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.html"`,
      'X-Download-URL':      htmlUrl,
    },
  })
})

// ── Helpers ──────────────────────────────────────────────────────────────
function esc(s: any): string {
  if (s == null) return ''
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function listHtml(arr: any, fallback = ''): string {
  if (!arr) return fallback
  if (Array.isArray(arr) && arr.length > 0) {
    return '<ul>' + arr.map((x: any) => `<li>${esc(x)}</li>`).join('') + '</ul>'
  }
  return `<p>${esc(arr) || fallback}</p>`
}

function activityBlock(act: any): string {
  if (!act || typeof act === 'string') return `<p>${esc(act) || '—'}</p>`
  return `
    <p><strong>Activity:</strong> ${esc(act.activity || act.description || '')}</p>
    ${act.teacherActions ? `<p><strong>Teacher:</strong> ${esc(act.teacherActions)}</p>` : ''}
    ${act.studentActions ? `<p><strong>Learners:</strong> ${esc(act.studentActions)}</p>` : ''}
    ${act.duration ? `<p><em>Duration: ${esc(act.duration)} min</em></p>` : ''}
  `
}

// ── Main HTML builder ─────────────────────────────────────────────────────
function buildLessonPlanHTML(
  content: any,
  title: string,
  subject: string,
  grade: string,
  topic: string,
  duration: number,
  teacherName: string
): string {
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString('en-KE', { day:'2-digit', month:'long', year:'numeric' })

  // Normalise content — structured JSON object, JSON string, or plain markdown string
  const c: any = normalizeLessonContent(content) ?? {}

  const header = c.lessonHeader || {}
  const lessonTitle    = esc(title || c.title || topic || 'Lesson Plan')
  const lessonSubject  = esc(subject || c.subject || header.learningArea || '')
  const lessonGrade    = esc(grade || c.grade || header.grade || '')
  const lessonDuration = esc(duration || c.duration || header.duration || 40)
  const strand         = esc(c.strand || '')
  const subStrand      = esc(c.subStrand || topic || '')
  const slos           = c.specificLearningOutcomes || c.objectives || ''
  const keyQs          = c.keyInquiryQuestions || []
  const comps          = c.coreCompetencies || []
  const values         = c.values || []
  const pcis           = c.pcis || []
  const resources      = c.learningResources   || []
  const assessment     = esc(c.assessment || c.conclusion?.assessment || '')
  const extended       = esc(c.extendedActivities || '')
  const homework       = esc(c.homework || '')
  const reflection     = esc(c.teacherReflection || c.reflection || '')
  const differentiation = c.differentiation || null
  const org            = c.organisationOfLearning || null

  const intro     = c.introduction  || null
  const mainAct   = c.mainActivity  || null
  const practAct  = c.practiceActivity || null
  const conc      = c.conclusion    || null
  const rawContent = c.generatedContent || ''

  const slosList = (Array.isArray(slos) ? slos : [slos]).filter(Boolean)
  const chips = [...comps.map((x: any) => ({ text: x, cls: 'chip-purple' })), ...values.map((x: any) => ({ text: x, cls: 'chip-green' })), ...pcis.map((x: any) => ({ text: x, cls: 'chip-amber' }))]

  const orgSteps: Array<[string, any]> = [
    ['Introduction', org?.introduction], ['Step 1', org?.step1], ['Step 2', org?.step2],
    ['Step 3', org?.step3], ['Conclusion', org?.conclusion],
  ].filter(([, s]) => !!s) as Array<[string, any]>

  const orgHtml = org
    ? orgSteps.map(([label, s]) => `
      <div class="org-step">
        <div class="phase-title">${label} (${esc(s.duration || '')} min)</div>
        ${s.teacherActivity || s.teacherActions ? `<p><strong>Teacher:</strong> ${esc(s.teacherActivity || s.teacherActions)}</p>` : ''}
        ${s.learnerActivity || s.studentActions ? `<p><strong>Learner:</strong> ${esc(s.learnerActivity || s.studentActions)}</p>` : ''}
        ${(!s.teacherActivity && !s.learnerActivity && s.activity) ? `<p>${esc(s.activity)}</p>` : ''}
      </div>`).join('')
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${lessonTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      color: #111;
      background: #fff;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 12mm; }
    }

    @media screen {
      body { padding: 24px; background: #eef1f5; }
      .page { background: #fff; max-width: 820px; margin: 0 auto; padding: 24px 28px; box-shadow: 0 2px 16px rgba(0,0,0,0.14); }
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .page-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      color: #1a3a6c;
      text-transform: uppercase;
      letter-spacing: 2px;
      border-bottom: 3px solid #1a3a6c;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .subtitle {
      text-align: center;
      font-size: 9pt;
      color: #555;
      margin-bottom: 14px;
    }

    /* ── Meta table ──────────────────────────────────────────────── */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9pt;
    }
    .meta-table td {
      border: 1px solid #9dadc4;
      padding: 4px 8px;
    }
    .meta-table .lbl {
      background: #1a3a6c;
      color: #fff;
      font-weight: bold;
      white-space: nowrap;
      width: 1%;
    }

    /* ── Section boxes ───────────────────────────────────────────── */
    .section {
      margin-bottom: 10px;
    }
    .section-header {
      background: #1a3a6c;
      color: #fff;
      font-weight: bold;
      font-size: 9pt;
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-body {
      border: 1px solid #9dadc4;
      border-top: none;
      padding: 6px 8px;
      min-height: 36px;
      font-size: 9pt;
      line-height: 1.5;
    }
    .section-body ul { padding-left: 18px; }
    .section-body li { margin: 2px 0; }
    .section-body p  { margin: 2px 0; }

    /* Phase grid for lesson body */
    .phase-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0;
      border: 1px solid #9dadc4;
      border-top: none;
    }
    .phase-cell {
      border-right: 1px solid #9dadc4;
      padding: 6px 8px;
      font-size: 9pt;
    }
    .phase-cell:last-child { border-right: none; }
    .phase-title {
      font-weight: bold;
      color: #1a3a6c;
      margin-bottom: 4px;
      font-size: 8.5pt;
    }

    /* Organisation-of-learning step list (KICD) */
    .org-grid {
      border: 1px solid #9dadc4;
      border-top: none;
    }
    .org-step {
      border-bottom: 1px solid #dde5f0;
      padding: 6px 8px;
      font-size: 9pt;
      line-height: 1.5;
    }
    .org-step:last-child { border-bottom: none; }
    .org-step p { margin: 2px 0; }

    /* Chip tags for competencies / values / PCIs */
    .chip {
      display: inline-block;
      border-radius: 10px;
      padding: 2px 8px;
      margin: 2px;
      font-size: 8pt;
    }
    .chip-purple { background: #f0e7ff; color: #6b21a8; border: 1px solid #d8b4fe; }
    .chip-green  { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .chip-amber  { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }

    /* 2-col grid */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }

    /* Reflection lines */
    .lines { }
    .line-row {
      border-bottom: 1px solid #ccc;
      height: 24px;
      margin: 2px 0;
    }

    /* Footer */
    .footer {
      margin-top: 18px;
      border-top: 2px solid #1a3a6c;
      padding-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      font-size: 8.5pt;
    }
    .sig-line { border-bottom: 1px solid #333; padding-bottom: 18px; margin-bottom: 4px; }
    .sig-label { font-weight: bold; color: #1a3a6c; }

    /* Print button */
    .no-print { text-align: center; margin-bottom: 18px; }
    .btn-print {
      background: #1a3a6c; color: #fff; border: none;
      padding: 9px 28px; font-size: 10pt; font-weight: bold;
      border-radius: 5px; cursor: pointer;
    }
    .btn-print:hover { background: #2557a7; }

    .raw-content {
      white-space: pre-wrap;
      font-size: 9pt;
      line-height: 1.6;
    }
  </style>
</head>
<body>
<div class="page">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <!-- ── Page title ──────────────────────────────────────────────── -->
  <div class="page-title">Lesson Plan</div>
  <div class="subtitle">Curriculum-Aligned Lesson Plan</div>

  <!-- ── Meta information table ────────────────────────────────── -->
  <table class="meta-table">
    <tr>
      <td class="lbl">School</td><td>${esc(header.school || '&nbsp;')}</td>
      <td class="lbl">Teacher</td><td>${esc(header.teacher || teacherName)}</td>
      <td class="lbl">Date</td><td>${esc(header.date || date)}</td>
    </tr>
    <tr>
      <td class="lbl">Subject</td><td>${lessonSubject}</td>
      <td class="lbl">Grade/Class</td><td>${lessonGrade}</td>
      <td class="lbl">Duration</td><td>${lessonDuration} minutes</td>
    </tr>
    <tr>
      <td class="lbl">Strand</td><td>${strand || '&nbsp;'}</td>
      <td class="lbl">Sub-Strand</td><td colspan="3">${subStrand || '&nbsp;'}</td>
    </tr>
    <tr>
      <td class="lbl">Term</td><td>${esc(header.term || '&nbsp;')}</td>
      <td class="lbl">Week</td><td>${esc(header.week || '&nbsp;')}</td>
      <td class="lbl">Lesson</td><td>${esc(header.lesson || '&nbsp;')}</td>
    </tr>
    ${header.enrolment ? `<tr><td class="lbl">Enrolment</td><td colspan="5">${esc(header.enrolment)}</td></tr>` : ''}
    <tr>
      <td class="lbl">Lesson Title</td><td colspan="5">${lessonTitle}</td>
    </tr>
  </table>

  <!-- ── Specific Learning Outcomes ────────────────────────────── -->
  <div class="section">
    <div class="section-header">Specific Learning Outcomes (SLOs)</div>
    <div class="section-body">
      ${slosList.length > 0 ? '<ul>' + slosList.map((s: any, i: number) => `<li>${i + 1}. ${esc(s)}</li>`).join('') + '</ul>' : '<p>By the end of the lesson, the learner should be able to:</p>'}
    </div>
  </div>

  <!-- ── Key Inquiry Questions ─────────────────────────────────── -->
  <div class="section">
    <div class="section-header">Key Inquiry Questions</div>
    <div class="section-body">
      ${listHtml(keyQs, '—')}
    </div>
  </div>

  <!-- ── Competencies / Values / PCIs ─────────────────────────── -->
  ${chips.length > 0 ? `
  <div class="section">
    <div class="section-header">Core Competencies / Values / PCIs</div>
    <div class="section-body">
      ${chips.map((ch: any) => `<span class="chip ${ch.cls}">${esc(ch.text)}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  <!-- ── Lesson Development ───────────────────────────────────── -->
  <div class="section">
    <div class="section-header">Lesson Development</div>
    ${orgHtml ? `
    <div class="org-grid">${orgHtml}</div>
    ` : (intro || mainAct || conc) ? `
    <div class="phase-grid">
      <div class="phase-cell">
        <div class="phase-title">Introduction (${intro?.duration || 10} min)</div>
        ${activityBlock(intro)}
      </div>
      <div class="phase-cell">
        <div class="phase-title">Main Activity (${mainAct?.duration || 25} min)</div>
        ${activityBlock(mainAct)}
        ${mainAct?.coreCompetencies ? `<p><em>Core Competencies: ${esc(Array.isArray(mainAct.coreCompetencies) ? mainAct.coreCompetencies.join(', ') : mainAct.coreCompetencies)}</em></p>` : ''}
      </div>
      <div class="phase-cell">
        <div class="phase-title">Practice / Conclusion (${(practAct?.duration || conc?.duration || 10)} min)</div>
        ${activityBlock(practAct || conc)}
      </div>
    </div>
    ` : rawContent ? `
    <div class="section-body raw-content">${esc(rawContent)}</div>
    ` : `
    <div class="section-body">
      <p><em>Lesson content not available. Expand from scheme row.</em></p>
    </div>
    `}
  </div>

  <!-- ── Learning Resources & Assessment ───────────────────────── -->
  <div class="two-col">
    <div class="section">
      <div class="section-header">Learning Resources</div>
      <div class="section-body">
        ${listHtml(resources, '—')}
      </div>
    </div>
    <div class="section">
      <div class="section-header">Assessment</div>
      <div class="section-body">
        <p>${assessment || 'Oral questions, observation, written exercises'}</p>
      </div>
    </div>
  </div>

  <!-- ── Homework / Extension ──────────────────────────────────── -->
  ${(extended || homework) ? `
  <div class="section">
    <div class="section-header">Extended Activities / Homework</div>
    <div class="section-body"><p>${extended || homework}</p></div>
  </div>
  ` : ''}

  <!-- ── Differentiation (legacy) ───────────────────────────────── -->
  ${differentiation && (differentiation.support || differentiation.extension) ? `
  <div class="section">
    <div class="section-header">Differentiation</div>
    <div class="section-body">
      ${differentiation.support ? `<p><strong>Support:</strong> ${esc(differentiation.support)}</p>` : ''}
      ${differentiation.extension ? `<p><strong>Extension:</strong> ${esc(differentiation.extension)}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- ── Teacher Reflection ─────────────────────────────────────── -->
  <div class="section">
    <div class="section-header">Teacher's Reflection / Notes</div>
    <div class="section-body lines">
      ${reflection ? `<p>${reflection}</p>` : `
        <div class="line-row"></div>
        <div class="line-row"></div>
        <div class="line-row"></div>
      `}
    </div>
  </div>

  <!-- ── Signature block ─────────────────────────────────────────── -->
  <div class="footer">
    <div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-label">Teacher's Signature &amp; Date</div>
    </div>
    <div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-label">HOD's Signature &amp; Date</div>
    </div>
    <div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-label">Principal's Signature &amp; Date</div>
    </div>
  </div>

</div><!-- /page -->
<script>
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 400));
  }
</script>
</body>
</html>`
}
