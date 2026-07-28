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
import { route } from '@/lib/api-middleware'

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

  const html = buildLessonPlanHTML(content, title, subject, grade, topic, duration, teacherName)
  const safeName = (title || topic || 'LessonPlan').replace(/[^a-z0-9]/gi, '_').toLowerCase()

  const format = body.format || 'pdf'

  if (format === 'word') {
    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${safeName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>body{font-family:Arial,sans-serif;font-size:10pt;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #999;padding:4px 8px;}</style>
</head><body>${html.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<body>|<\/body>|<!DOCTYPE[^>]*>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')}</body></html>`
    return new NextResponse(Buffer.from(wordHtml, 'utf-8'), {
      headers: {
        'Content-Type':        'application/msword; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeName}.doc"`,
      },
    })
  }

  return new NextResponse(Buffer.from(html, 'utf-8'), {
    headers: {
      'Content-Type':        'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${safeName}.html"`,
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

  // Normalise content — handle both structured JSON and plain string
  let c: any = {}
  if (content && typeof content === 'object') {
    c = content
  } else if (typeof content === 'string') {
    c = { generatedContent: content }
  }

  const lessonTitle    = esc(title || c.title || topic || 'Lesson Plan')
  const lessonSubject  = esc(subject || c.subject || '')
  const lessonGrade    = esc(grade || c.grade || '')
  const lessonDuration = esc(duration || c.duration || 40)
  const strand         = esc(c.strand || '')
  const subStrand      = esc(c.subStrand || topic || '')
  const slos           = esc(c.specificLearningOutcomes || c.objectives || '')
  const keyQs          = c.keyInquiryQuestions || []
  const resources      = c.learningResources   || []
  const assessment     = esc(c.assessment || c.conclusion?.assessment || '')
  const homework       = esc(c.homework || '')
  const reflection     = esc(c.teacherReflection || c.reflection || '')

  const intro     = c.introduction  || null
  const mainAct   = c.mainActivity  || null
  const practAct  = c.practiceActivity || null
  const conc      = c.conclusion    || null
  const rawContent = c.generatedContent || ''

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
  <div class="subtitle">Kenya Competency-Based Curriculum (CBC) — KICD Format</div>

  <!-- ── Meta information table ────────────────────────────────── -->
  <table class="meta-table">
    <tr>
      <td class="lbl">School</td><td>&nbsp;</td>
      <td class="lbl">Teacher</td><td>${esc(teacherName)}</td>
      <td class="lbl">Date</td><td>${date}</td>
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
      <td class="lbl">Lesson Title</td><td colspan="5">${lessonTitle}</td>
    </tr>
  </table>

  <!-- ── Specific Learning Outcomes ────────────────────────────── -->
  <div class="section">
    <div class="section-header">Specific Learning Outcomes (SLOs)</div>
    <div class="section-body">
      ${slos ? `<p>${slos}</p>` : '<p>By the end of the lesson, the learner should be able to:</p>'}
    </div>
  </div>

  <!-- ── Key Inquiry Questions ─────────────────────────────────── -->
  <div class="section">
    <div class="section-header">Key Inquiry Questions</div>
    <div class="section-body">
      ${listHtml(keyQs, '—')}
    </div>
  </div>

  <!-- ── Lesson Development (3 phases) ─────────────────────────── -->
  <div class="section">
    <div class="section-header">Lesson Development</div>
    ${(intro || mainAct || conc) ? `
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
  ${homework ? `
  <div class="section">
    <div class="section-header">Homework / Extension Activity</div>
    <div class="section-body"><p>${homework}</p></div>
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
