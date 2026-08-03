import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'

// GET — fetch challenge history
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')
  const unitName = searchParams.get('unitName')

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const where: any = { studentId: student.id }
  if (subject) where.subject = subject
  if (unitName) where.unitName = unitName

  const challenges = await prisma.courseChallenge.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 20,
  })

  // Best score per unit
  const bestScores = await prisma.courseChallenge.groupBy({
    by: ['unitName'],
    where: { studentId: student.id, passed: true },
    _max: { score: true },
    _count: true,
  })

  return NextResponse.json({ challenges, bestScores })
})

// POST — start a new course challenge
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { subject, unitName, grade } = await request.json()

  if (!subject || !unitName) {
    return NextResponse.json({ error: 'subject and unitName required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Fetch mastery data for context
  const mastery = await prisma.unitMastery.findUnique({
    where: { studentId_subject_unitName: { studentId: student.id, subject, unitName } },
  })

  // Fetch recent study sessions for this topic
  const recentSessions = await prisma.studySession.findMany({
    where: { studentId: student.id, subject, topic: unitName },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Generate comprehensive challenge questions
  const contextParts = [
    `Unit: ${unitName} in ${subject}`,
    `Student mastery level: ${mastery?.masteryScore || 0}%`,
    `Quizzes taken: ${mastery?.quizzesTaken || 0}`,
    `Correct answers: ${mastery?.correctAnswers || 0}/${mastery?.totalQuestions || 0}`,
  ]
  if (recentSessions.length > 0) {
    contextParts.push(`Recent study topics: ${recentSessions.map(s => s.topic).filter(Boolean).join(', ')}`)
  }

  const prompt = `Generate a comprehensive course challenge quiz for a Kenyan student.

CONTEXT:
${contextParts.join('\n')}

REQUIREMENTS:
1. Generate exactly 10 questions covering ALL major concepts in "${unitName}" (${subject})
2. Mix of question types: 6 multiple choice (4 options A-D), 2 true/false, 2 open-ended
3. Questions should range from easy to hard (Bloom's taxonomy levels)
4. Include practical Kenyan examples and contexts
5. Each question needs: question, type, options (for MCQ), correct_answer index, model_answer (for open-ended), explanation
6. Label each MCQ option as A, B, C, D

Return JSON:
{
  "questions": [
    {
      "question": "string",
      "type": "multiple_choice" | "true_false" | "open_ended",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": 0,
      "model_answer": "string (for open-ended)",
      "explanation": "string"
    }
  ]
}`

  try {
    const response = await OpenAIService.generateText(
      [
        { role: 'system', content: 'You are an expert Kenyan curriculum assessment designer. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 4000, temperature: 0.7 }
    )

    // Parse response
    let questions: any[]
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      const parsed = JSON.parse(jsonMatch[0])
      questions = parsed.questions || []
    } catch {
      return NextResponse.json({ error: 'Failed to generate challenge questions' }, { status: 500 })
    }

    // Create challenge record
    const challenge = await prisma.courseChallenge.create({
      data: {
        studentId: student.id,
        subject,
        unitName,
        grade,
        totalQuestions: questions.length,
        questions,
        startedAt: new Date(),
      },
    })

    return NextResponse.json({ challengeId: challenge.id, questions })
  } catch (error) {
    console.error('[CourseChallenge] Generation error:', error)
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 })
  }
})

// PUT — submit challenge results
export const PUT = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { challengeId, correctAnswers, totalQuestions, timeTakenMins, answers } = await request.json()

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const passed = score >= 70

  const challenge = await prisma.courseChallenge.update({
    where: { id: challengeId },
    data: {
      correctAnswers,
      score,
      timeTakenMins: timeTakenMins || 0,
      passed,
      answers,
      completedAt: new Date(),
    },
  })

  // Update unit mastery with challenge results
  if (challenge.unitName) {
    const existing = await prisma.unitMastery.findUnique({
      where: { studentId_subject_unitName: { studentId: student.id, subject: challenge.subject, unitName: challenge.unitName } },
    })

    if (existing) {
      const newTotal = existing.totalQuestions + totalQuestions
      const newCorrect = existing.correctAnswers + correctAnswers
      const newMastery = Math.round((newCorrect / newTotal) * 100)

      await prisma.unitMastery.update({
        where: { id: existing.id },
        data: {
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          masteryScore: Math.max(existing.masteryScore, newMastery),
          masteryLevel: getMasteryLevel(Math.max(existing.masteryScore, newMastery)),
          lastPracticedAt: new Date(),
        },
      })
    } else {
      const initialScore = Math.round((correctAnswers / totalQuestions) * 100)
      await prisma.unitMastery.create({
        data: {
          studentId: student.id,
          subject: challenge.subject,
          unitName: challenge.unitName,
          masteryScore: initialScore,
          masteryLevel: getMasteryLevel(initialScore),
          totalQuestions,
          correctAnswers,
          quizzesTaken: 1,
          lastPracticedAt: new Date(),
        },
      })
    }
  }

  return NextResponse.json({ challenge, score, passed })
})

function getMasteryLevel(score: number): 'NOT_STARTED' | 'BEGINNER' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED' {
  if (score >= 90) return 'MASTERED'
  if (score >= 70) return 'PROFICIENT'
  if (score >= 50) return 'DEVELOPING'
  if (score > 0) return 'BEGINNER'
  return 'NOT_STARTED'
}
