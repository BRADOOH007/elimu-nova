import { prisma } from '@/lib/prisma'

export async function trackStudySession(params: {
  userId: string
  subject?: string
  topic?: string
  durationSeconds: number
}) {
  try {
    await prisma.studySession.create({
      data: {
        studentId: params.userId,
        subject: params.subject || 'General',
        topic: params.topic || '',
        duration: Math.round(params.durationSeconds / 60) || 1,
        startTime: new Date(),
        endTime: new Date(),
      },
    })
  } catch { /* non-critical background tracking */ }
}

export async function trackQuizSubmission(params: {
  userId: string
  subject: string
  topic?: string
  scorePercent: number
  correctCount: number
  totalQuestions: number
}) {
  try {
    await prisma.quizResult.create({
      data: {
        userId: params.userId,
        subject: params.subject,
        topic: params.topic || null,
        scorePercent: params.scorePercent,
        correctCount: params.correctCount,
        totalQuestions: params.totalQuestions,
      },
    })
  } catch { /* non-critical */ }
}

export async function trackPracticeAttempt(params: {
  userId: string
  topicId?: string
  subject?: string
  isCorrect: boolean
  answer?: string
}) {
  try {
    await prisma.practiceAttempt.create({
      data: {
        userId: params.userId,
        topicId: params.topicId || null,
        subject: params.subject || null,
        isCorrect: params.isCorrect,
        answer: params.answer || null,
      },
    })
  } catch { /* non-critical */ }
}
