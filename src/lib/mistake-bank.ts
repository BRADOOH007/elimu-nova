import { prisma } from '@/lib/prisma'

const STORAGE_KEY = 'elimunova_mistakes'

interface Mistake {
  id: string
  question: string
  yourAnswer: string
  correctAnswer: string
  topic: string
  subject: string
  date: string
  reviewed: boolean
}

export function getMistakes(): Mistake[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export async function addMistake(
  question: string, yourAnswer: string, correctAnswer: string,
  topic: string, subject: string, userId?: string
) {
  const mistakes = getMistakes()
  mistakes.unshift({
    id: Date.now().toString(36),
    question: question.slice(0, 200),
    yourAnswer: String(yourAnswer).slice(0, 200),
    correctAnswer: String(correctAnswer).slice(0, 200),
    topic,
    subject,
    date: new Date().toISOString(),
    reviewed: false,
  })
  if (mistakes.length > 200) mistakes.length = 200
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes)) } catch {}

  // Also persist to DB for Hope AI to reference
  if (userId) {
    syncToDB(mistakes, userId)
  }
}

async function syncToDB(mistakes: Mistake[], userId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, teacherId: true },
    })
    if (!student) return
    // studentId is not unique on StudentProgress — resolve the row explicitly.
    const existing = await prisma.studentProgress.findFirst({
      where: { studentId: student.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    const data = { commonMistakes: JSON.stringify(mistakes.slice(0, 50)) }
    if (existing) {
      await prisma.studentProgress.update({ where: { id: existing.id }, data })
    } else if (student.teacherId) {
      // StudentProgress.teacherId is required — independent students without a
      // teacher skip DB sync (localStorage remains the primary mistake store).
      await prisma.studentProgress.create({
        data: { ...data, studentId: student.id, teacherId: student.teacherId, totalQuestions: 0, correctAnswers: 0 },
      })
    }
  } catch { /* non-critical */ }
}

export function markMistakeReviewed(id: string) {
  const mistakes = getMistakes()
  const idx = mistakes.findIndex(m => m.id === id)
  if (idx >= 0) {
    mistakes[idx].reviewed = true
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes)) } catch {}
  }
}

export function getUnreviewedMistakes(): Mistake[] {
  return getMistakes().filter(m => !m.reviewed)
}

export function getMistakeCount(): { total: number; unreviewed: number } {
  const m = getMistakes()
  return { total: m.length, unreviewed: m.filter(x => !x.reviewed).length }
}

export function clearMistakes() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
