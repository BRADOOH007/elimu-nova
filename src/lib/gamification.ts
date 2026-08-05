// XP & Levels gamification
// Stored in localStorage, synced to backend when possible

const STORAGE_KEY = 'elimunova_gamification'

interface GameState {
  xp: number
  level: number
  streak: number
  lastActiveDate: string
  lessonsCompleted: number
  quizzesTaken: number
  totalCorrect: number
  totalQuestions: number
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000]
const LEVEL_NAMES = ['Beginner', 'Learner', 'Scholar', 'Thinker', 'Explorer', 'Master', 'Expert', 'Genius', 'Prodigy', 'Legend', 'Sage', 'Champion', 'Virtuoso', 'Einstein', 'Genius Supreme']

export function getGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const today = new Date().toISOString().split('T')[0]
  return { xp: 0, level: 1, streak: 0, lastActiveDate: today, lessonsCompleted: 0, quizzesTaken: 0, totalCorrect: 0, totalQuestions: 0 }
}

function saveGameState(state: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] || 'Beginner'
}

export function getXpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevel(xp)
  const current = xp - (LEVEL_THRESHOLDS[level - 1] || 0)
  const needed = (LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[level - 1] + 1000) - (LEVEL_THRESHOLDS[level - 1] || 0)
  return { current, needed, progress: needed > 0 ? Math.min(100, Math.round((current / needed) * 100)) : 100 }
}

export function awardXP(state: GameState, amount: number): GameState {
  const newXp = state.xp + amount
  const oldLevel = state.level
  const newLevel = getLevel(newXp)
  return { ...state, xp: newXp, level: newLevel, lastActiveDate: new Date().toISOString().split('T')[0] }
}

export function completeLesson(state: GameState): GameState {
  const updated = awardXP(state, 50)
  return { ...updated, lessonsCompleted: state.lessonsCompleted + 1 }
}

export function completeQuiz(state: GameState, correct: number, total: number): GameState {
  const updated = awardXP(state, correct * 20)
  return { ...updated, quizzesTaken: state.quizzesTaken + 1, totalCorrect: state.totalCorrect + correct, totalQuestions: state.totalQuestions + total }
}

export function updateStreak(state: GameState): GameState {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let newStreak = state.streak
  if (state.lastActiveDate === today) return state
  if (state.lastActiveDate === yesterday) newStreak = state.streak + 1
  else newStreak = 1
  const updated = { ...state, streak: newStreak, lastActiveDate: today }
  saveGameState(updated)
  return updated
}

export function persistGameState(state: GameState) {
  saveGameState(state)
}

export const XP_REWARDS = {
  lessonComplete: 50,
  quizCorrect: 20,
  quickQuizComplete: 30,
  streakBonus: 15,
  reviewComplete: 25,
  dailyChallenge: 40,
}
