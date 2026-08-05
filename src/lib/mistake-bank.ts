// Mistake Bank — stores wrong answers for later review

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

export function addMistake(question: string, yourAnswer: string, correctAnswer: string, topic: string, subject: string) {
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
}

export function markMistakeReviewed(id: string) {
  const mistakes = getMistakes()
  const idx = mistakes.findIndex(m => m.id === id)
  if (idx >= 0) { mistakes[idx].reviewed = true; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes)) } catch {} }
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
