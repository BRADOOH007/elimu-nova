/**
 * POST /api/ai/marking-scheme
 * Generate Marking Scheme from exam content
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'] }, async (request, { user }) => {
    const { examContent, subject, grade, totalMarks = 100, documentContext } = await request.json()
    if (!examContent) return NextResponse.json({ error: 'examContent required' }, { status: 400 })

    // Fetch teacher's exam template as marking scheme format reference
    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const t = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { examTemplate: true },
      })
      templateText = t?.examTemplate || null
    }
    const templateBlock = templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the marking scheme in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    const prompt = `You are a senior examiner creating a detailed marking scheme.${templateBlock}

Subject: ${subject || 'General'} | Grade: ${grade || 'Secondary'} | Total: ${totalMarks} marks

EXAM:
"""
${examContent.slice(0, 3000)}
"""

Generate a comprehensive marking scheme. Return ONLY a valid JSON object:
{
  "title": "Marking Scheme — ${subject || 'Subject'} | ${grade || 'Grade'}",
  "totalMarks": ${totalMarks},
  "instructions": "General instructions for markers",
  "sections": [
    {
      "section": "Section A",
      "marks": 30,
      "questions": [
        {
          "number": "1",
          "question": "Brief question text",
          "answer": "Model answer / correct option",
          "marks": 2,
          "markingPoints": ["Point 1 (1 mark)", "Point 2 (1 mark)"],
          "notes": "Accept any reasonable answer that..."
        }
      ]
    }
  ],
  "generalNotes": ["Note 1 for markers", "Note 2"],
  "gradeBoundaries": {
    "EE": "${Math.round(totalMarks * 0.8)}-${totalMarks}",
    "ME": "${Math.round(totalMarks * 0.6)}-${Math.round(totalMarks * 0.79)}",
    "AE": "${Math.round(totalMarks * 0.4)}-${Math.round(totalMarks * 0.59)}",
    "BE": "0-${Math.round(totalMarks * 0.39)}"
  }
}

Rules:
- For MCQ: state the correct letter (A/B/C/D) and why
- For calculations: show working steps with marks per step
- For essays: list key marking points with marks allocated
- Mark allocation must add up to ${totalMarks}`

    try {
    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: 'You are an examiner. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 3000, temperature: 0.3 })

    const json = cleanAiJson(raw)
    if (!json) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })
    const scheme = JSON.parse(json)

    const html = buildMarkingSchemeHTML(scheme, subject, grade)

    return NextResponse.json({ scheme, html, subject, grade })
  } catch (e: any) {
    console.error('[MarkingScheme] Failed:', e)
    return NextResponse.json({ error: 'Failed to generate marking scheme. Please try again.' }, { status: 500 })
  }
})

function esc(s: any) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function buildMarkingSchemeHTML(scheme: any, subject: string, grade: string): string {
  const sectionsHtml = (scheme.sections || []).map((sec: any) => `
    <div class="section">
      <h3>${esc(sec.section)} — ${esc(sec.marks)} marks</h3>
      <table>
        <thead><tr><th>Q</th><th>Question</th><th>Answer / Marking Points</th><th>Marks</th></tr></thead>
        <tbody>
          ${(sec.questions || []).map((q: any) => `
            <tr>
              <td class="center">${esc(q.number)}</td>
              <td>${esc(q.question)}</td>
              <td>
                <strong>${esc(q.answer)}</strong>
                ${(q.markingPoints || []).map((p: string) => `<div class="point">• ${esc(p)}</div>`).join('')}
                ${q.notes ? `<em class="note">${esc(q.notes)}</em>` : ''}
              </td>
              <td class="center bold">${esc(q.marks)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Marking Scheme</title>
<style>
  body { font-family: Arial; font-size: 9.5pt; margin: 15mm; color: #111; }
  h1 { text-align: center; color: #1a3a6c; font-size: 14pt; border-bottom: 3px solid #1a3a6c; padding-bottom: 6px; }
  .meta { text-align: center; margin: 8px 0 14px; font-size: 9pt; color: #555; }
  .section h3 { background: #1a3a6c; color: #fff; padding: 4px 8px; margin: 12px 0 0; font-size: 9.5pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th { background: #e8eef5; border: 1px solid #9dadc4; padding: 4px 6px; font-size: 8.5pt; }
  td { border: 1px solid #b0bbcc; padding: 3px 6px; vertical-align: top; font-size: 8.5pt; }
  .center { text-align: center; } .bold { font-weight: bold; }
  .point { color: #1a3a6c; } .note { color: #666; font-size: 8pt; }
  .boundaries { margin-top: 14px; border: 1px solid #1a3a6c; padding: 8px; }
  @media print { @page { size: A4; margin: 12mm; } }
</style>
</head><body>
<h1>MARKING SCHEME</h1>
<div class="meta">${esc(subject)} | ${esc(grade)} | Total: ${esc(scheme.totalMarks)} marks</div>
<p><strong>Markers' Instructions:</strong> ${esc(scheme.instructions)}</p>
${sectionsHtml}
<div class="boundaries">
  <strong>Grade Boundaries:</strong> EE (${esc(scheme.gradeBoundaries?.EE)}) | ME (${esc(scheme.gradeBoundaries?.ME)}) | AE (${esc(scheme.gradeBoundaries?.AE)}) | BE (${esc(scheme.gradeBoundaries?.BE)})
</div>
<script>if(new URLSearchParams(window.location.search).get('print')==='1')window.addEventListener('load',()=>setTimeout(()=>window.print(),400));</script>
</body></html>`
}
