/**
 * POST /api/ai/exam-versions
 * Exam Version Generator — A/B/C/D versions to prevent cheating
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'] }, async (request, { user }) => {
    const { originalExam, subject, grade, versionsCount = 2, documentContext } = await request.json()
    if (!originalExam) return NextResponse.json({ error: 'originalExam content required' }, { status: 400 })

    // Fetch teacher's exam template as format reference
    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const t = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { examTemplate: true },
      })
      templateText = t?.examTemplate || null
    }
    const templateBlock = templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the exam versions in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    const versionLabels = ['A', 'B', 'C', 'D'].slice(0, Math.min(versionsCount, 4))

    const prompt = `You are an experienced Kenyan exam setter. Create ${versionLabels.length} versions of this exam to prevent cheating.${templateBlock}

ORIGINAL EXAM:
"""
${originalExam.slice(0, 3000)}
"""

Subject: ${subject || 'General'} | Grade: ${grade || 'Secondary'}

For each version (${versionLabels.join(', ')}):
1. Reorder multiple choice questions (different sequence)
2. Shuffle answer options within each MCQ (change which letter is correct)
3. Rephrase questions slightly but keep same difficulty and content
4. Keep section structure (Section A, B, C) but shuffle within sections
5. For calculation questions: change numbers/values only

Return ONLY a valid JSON object:
{
  "versions": {
    ${versionLabels.map(v => `"${v}": { "label": "Version ${v}", "content": "full exam text with VERSION ${v} header", "answerKey": "A:(1)C,(2)A... B:(1)B,(2)D..." }`).join(',\n    ')}
  },
  "metadata": {
    "subject": "${subject || ''}",
    "grade": "${grade || ''}",
    "totalVersions": ${versionLabels.length}
  }
}`

    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: 'You are a CBC exam setter. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 4000, temperature: 0.5 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    const result = JSON.parse(raw.slice(start, end + 1))
    return NextResponse.json(result)
})
