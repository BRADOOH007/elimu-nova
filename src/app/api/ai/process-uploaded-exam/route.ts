/**
 * POST /api/ai/process-uploaded-exam
 * Process Uploaded Exam — AI extracts questions from PDF text into editable format
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { user }) => {
    const { rawText, subject, grade } = await request.json()
    if (!rawText) return NextResponse.json({ error: 'rawText required' }, { status: 400 })

    const prompt = `You are an expert at extracting and structuring exam questions from raw text.

Extract ALL questions from this text and structure them. Raw text may contain OCR errors — fix obvious ones.

Subject: ${subject || 'General'} | Grade: ${grade || 'Secondary'}

RAW EXAM TEXT:
"""
${rawText.slice(0, 4000)}
"""

Return ONLY a valid JSON object:
{
  "title": "Detected exam title or 'Untitled Exam'",
  "subject": "${subject || 'detected subject'}",
  "grade": "${grade || 'detected grade'}",
  "totalMarks": <detected or estimated>,
  "sections": [
    {
      "name": "Section A",
      "instructions": "Answer ALL questions",
      "questions": [
        {
          "number": "1",
          "text": "Full question text (cleaned up)",
          "type": "multiple_choice|short_answer|long_answer|fill_blank|true_false",
          "marks": <number>,
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "answer": "correct answer if visible in text, else null",
          "subQuestions": []
        }
      ]
    }
  ],
  "cleanedIssues": ["OCR issues found and fixed", "..."]
}

Rules:
- Preserve original question numbering
- For MCQ: include all options in the options array
- Fix obvious OCR errors (0 vs O, 1 vs l, etc.)
- If answer key is present in the text, include answers
- Separate into sections if section headers present`

    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: 'You are an exam digitizer. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 3000, temperature: 0.2 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Could not parse exam structure' }, { status: 500 })

    const extracted = JSON.parse(raw.slice(start, end + 1))
    const questionCount = (extracted.sections || []).reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0)

    return NextResponse.json({ extracted, questionCount, subject, grade })
})
