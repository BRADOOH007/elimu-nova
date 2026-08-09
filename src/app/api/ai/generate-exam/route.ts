import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import {
  loadCurriculumOutcomes,
  buildAssessmentSystemPrompt,
  stripAnswerKeysFromContent,
  extractAnswerKeyFromMarkdown,
  buildFallbackExam,
  buildExamMarkdown,
  tryParseStructuredExam,
  toDualWriteContent,
} from '@/lib/smart-assessment'

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

    // Load curriculum outcomes for CBC grounding
    const outcomes = await loadCurriculumOutcomes(examData.gradeLevel, examData.subject, examData.topics)

    // Build smart system prompt with curriculum context
    const systemPrompt = buildAssessmentSystemPrompt({
      kind: 'exam',
      grade: examData.gradeLevel,
      subject: examData.subject,
      topic: examData.topics,
      outcomes,
      templateText,
      curriculum: examData.curriculum,
      country: examData.country,
    })

    const userPrompt = `Generate a complete ${examData.curriculum || 'CBC'} exam as structured JSON with this schema:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice" | "true_false" | "short_answer" | "essay",
      "text": "question text",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "marks": 1,
      "correctAnswer": "A",
      "section": "A" | "B" | "C",
      "bloomLevel": "remember|understand|apply|analyse|evaluate|create"
    }
  ],
  "answerKey": { "1": "A", "2": "B", ... },
  "markdown": "full exam markdown with sections",
  "totalMarks": 100,
  "title": "${examData.examTitle}"
}

Exam parameters:
- Title: ${examData.examTitle}
- Subject: ${examData.subject}
- Grade: ${examData.gradeLevel}
- Questions: ${examData.numberOfQuestions || 20}
- Difficulty: ${examData.difficulty || 'medium'}
- Total Marks: ${examData.totalMarks || 100}
- Duration: ${examData.duration || 60} minutes
- Topics: ${examData.topics || 'All relevant topics'}
- Focus: ${examData.focusAreas || 'General understanding and application'}
${outcomes.length ? `\nCURRICULUM OUTCOMES TO ASSESS:\n${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}
${examData.includeDiagrams ? '- Include diagram-based questions where appropriate' : ''}

IMPORTANT: Return ONLY valid JSON. No markdown fences, no commentary.`

    // Try AI generation with retry
    let structured = null
    const { stripLatex } = await import('@/lib/clean-ai-text')
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const raw = await OpenAIService.generateLongContent([
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ], { maxTokens: 4000, temperature: 0.7 })

        structured = tryParseStructuredExam(raw)
        if (structured) break
      } catch (err) {
        console.warn(`Exam generation attempt ${attempt + 1} failed:`, err)
      }
    }

    // Fallback if AI didn't produce structured JSON
    if (!structured) {
      structured = buildFallbackExam({
        title: examData.examTitle,
        subject: examData.subject,
        grade: examData.gradeLevel,
        topic: examData.topics || examData.subject,
        numberOfQuestions: examData.numberOfQuestions || 20,
        totalMarks: examData.totalMarks || 100,
        duration: examData.duration || 60,
        outcomes,
      })
    }

    // Clean markdown (strip LaTeX)
    structured.markdown = stripLatex(structured.markdown)

    // Dual-write: structured JSON as content (for programmatic use)
    const dualWrite = toDualWriteContent(structured)

    // Student-safe: no answer keys
    const studentContent = stripAnswerKeysFromContent(structured.markdown)

    // Teacher content: full markdown with answer key
    const teacherContent = structured.markdown

    return NextResponse.json({
      examContent: studentContent,        // student-facing (backward compat)
      examContentTeacher: teacherContent,  // teacher-facing (with answer key)
      structured,                          // structured data for UI consumption
      dualWrite,                           // dual-write payload
    })
})
