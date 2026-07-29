import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {
    const examData = await request.json()
    const { documentContext } = examData
    if (!examData.examTitle || !examData.subject || (!examData.gradeLevel && !examData.grade)) {
      return NextResponse.json({ error: 'Exam title, subject, and grade level are required' }, { status: 400 })
    }

    // Normalize grade field
    if (!examData.gradeLevel) examData.gradeLevel = examData.grade

    // Fetch teacher's saved exam template if no explicit context provided
    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { examTemplate: true },
      })
      templateText = teacher?.examTemplate || null
    }
    const templateBlock = templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the exam in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    const systemPrompt = `You are an expert educational exam creator for ElimuNova AI — Kenya CBC curriculum.${templateBlock}
Always generate content in English unless the subject is Kiswahili.
Structure exams with: Cover Page, Student Instructions, Section A (MCQ), Section B (Short Answer), Section C (Long Answer/Essay), Marking Scheme.

CRITICAL FORMATTING RULES — follow exactly:
- Do NOT use LaTeX, MathJax or any TeX notation. No \\frac, \\underline, \\qquad, \\textbf, $...$ or \\(...\\) — ever.
- Write ALL mathematics in plain readable English/text: use "/" for fractions (e.g. 1/3 not \\frac{1}{3}), "x^2" for powers, "_____" for fill-in-the-blank lines.
- Do NOT wrap any words in curly braces {}.
- Use standard Markdown only: ## headings, **bold**, numbered lists, bullet points.
- Answer blanks: write "_____________" (underscores), never LaTeX underline commands.`

    const userPrompt = `Generate a complete ${examData.curriculum || 'CBC'} exam:
- Title: ${examData.examTitle}
- Subject: ${examData.subject}
- Grade: ${examData.gradeLevel}
- Questions: ${examData.numberOfQuestions || 20}
- Difficulty: ${examData.difficulty || 'medium'}
- Total Marks: ${examData.totalMarks || 100}
- Duration: ${examData.duration || 60} minutes
- Topics: ${examData.topics || 'All relevant topics'}
- Focus: ${examData.focusAreas || 'General understanding and application'}
${examData.includeDiagrams ? '- Include diagram-based questions where appropriate' : ''}

Format the exam as Markdown for easy reading and printing.`

    const examContent = await OpenAIService.generateLongContent([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ], { maxTokens: 4000, temperature: 0.7 })

    // Strip any LaTeX the AI may have included despite the instruction
    const { stripLatex } = await import('@/lib/clean-ai-text')
    const cleanContent = stripLatex(examContent)

    return NextResponse.json({ examContent: cleanContent })
})
