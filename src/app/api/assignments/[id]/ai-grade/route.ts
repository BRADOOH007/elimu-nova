import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { generateAIContent } from '@/lib/openrouter-ai'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user, params }) => {
  const assignmentId = params.id
  const { submissionId } = await req.json()

  if (!submissionId) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId }
  })

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: { include: { user: true } } }
  })

  if (!assignment || !submission) {
    return NextResponse.json({ error: 'Assignment or submission not found' }, { status: 404 })
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })
    if (!teacher || teacher.id !== assignment.teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } else if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let prompt = `You are a warm, encouraging expert teacher grading a student assignment. Please grade the following submission carefully and fairly.

Assignment Title: ${assignment.title}
Assignment Description: ${assignment.description}
${assignment.answerKey ? `Answer Key: ${assignment.answerKey}` : ''}
${assignment.rubricId ? `Please use the provided rubric for grading.` : ''}

Student Submission:
${submission.content}

Please provide:
1. A numerical grade (0-100)
2. Encouraging, detailed feedback for the student (acknowledge their effort, highlight a strength, give 1-2 kind suggestions, and end with motivation)
3. A breakdown of scores by question (if applicable)
4. Specific suggestions for improvement

Format your response as a JSON object with the following structure:
{
  "grade": number,
  "feedback": string,
  "confidence": number (0-1),
  "questionScores": [
    {
      "questionId": string,
      "score": number,
      "feedback": string
    }
  ],
  "needsRevision": boolean,
  "revisionNotes": string
}

Make sure your response is valid JSON without any markdown formatting.`

  const aiResponse = await generateAIContent(prompt, {
    maxTokens: 2000,
    temperature: 0.5
  })

  let gradingResult
  try {
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7)
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3)
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3)
    }

    gradingResult = JSON.parse(cleanedResponse.trim())
  } catch (parseError) {
    console.error('Failed to parse AI grading response:', parseError)
    gradingResult = {
      grade: 0,
      feedback: 'Your work is being reviewed carefully. Please check back soon — keep up the great effort!',
      confidence: 0,
      questionScores: [],
      needsRevision: true,
      revisionNotes: 'AI grading could not be completed'
    }
  }

  const safeGrade = Math.max(0, Math.min(100, Number(gradingResult.grade) || 0))
  const safeFeedback = String(gradingResult.feedback || 'Good effort!')

  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: safeGrade,
      feedback: safeFeedback,
      status: 'GRADED',
      gradedAt: new Date(),
      isAiGraded: true,
      aiGradingMetadata: gradingResult,
      aiConfidence: gradingResult.confidence,
      questionScores: gradingResult.questionScores,
      needsRevision: gradingResult.needsRevision,
      revisionNotes: gradingResult.revisionNotes
    },
    include: {
      student: { include: { user: true } },
      assignment: true
    }
  })

  return NextResponse.json({
    success: true,
    submission: updatedSubmission,
    message: 'Submission graded successfully by AI'
  })
})
