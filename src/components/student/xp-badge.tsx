"use client"

import { Zap, Flame, Target, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SkillMasteryItem {
  skillName: string
  skillCategory: string
  masteryScore: number
  timesCorrect: number
  timesTested: number
}

interface ProgressData {
  xp: number
  streak: number
  consecutiveCorrect: number
  masteryScore: number
  preferredDifficulty: string
  commonMistakes: any
  totalQuestions: number
  correctAnswers: number
  skillMastery: SkillMasteryItem[]
}

interface XpBadgeProps {
  progress: ProgressData | null
}

function getLevel(xp: number): { level: number; title: string; nextAt: number } {
  const levels = [
    { level: 1, title: "Beginner", xpNeeded: 0 },
    { level: 2, title: "Curious Learner", xpNeeded: 200 },
    { level: 3, title: "Knowledge Seeker", xpNeeded: 500 },
    { level: 4, title: "Smart Thinker", xpNeeded: 1000 },
    { level: 5, title: "Bright Scholar", xpNeeded: 2000 },
    { level: 6, title: "Star Student", xpNeeded: 3500 },
    { level: 7, title: "Math Wizard", xpNeeded: 5000 },
    { level: 8, title: "Science Genius", xpNeeded: 7500 },
    { level: 9, title: "Top Achiever", xpNeeded: 10000 },
    { level: 10, title: "Grandmaster", xpNeeded: 15000 },
  ]
  let title = levels[0].title
  let nextAt = levels[1].xpNeeded
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xpNeeded) {
      title = levels[i].title
      nextAt = levels[i + 1]?.xpNeeded ?? Infinity
      return { level: levels[i].level, title, nextAt }
    }
  }
  return { level: 1, title: "Beginner", nextAt: 200 }
}

export default function XpBadge({ progress }: XpBadgeProps) {
  if (!progress) return null

  const { level, title, nextAt } = getLevel(progress.xp)
  const xpProgress = nextAt === Infinity ? 100 : Math.min(100, Math.round((progress.xp / nextAt) * 100))
  const accuracy = progress.totalQuestions > 0 ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) : 0

  const xpMultiplier = progress.consecutiveCorrect >= 10 ? "5×" : progress.consecutiveCorrect >= 5 ? "3×" : progress.consecutiveCorrect >= 3 ? "2×" : "1×"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-violet-200 text-xs font-medium">Level {level} — {title}</p>
            <Zap className="w-5 h-5 text-yellow-300" />
          </div>
          <p className="text-3xl font-bold">{progress.xp.toLocaleString()}</p>
          <p className="text-violet-200 text-xs">XP · Next level at {nextAt === Infinity ? "MAX" : nextAt.toLocaleString()}</p>
          {nextAt !== Infinity && (
            <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-yellow-300 h-1.5 rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 text-xs font-medium">Study Streak</p>
            <Flame className="w-5 h-5 text-orange-200" />
          </div>
          <p className="text-3xl font-bold">{progress.streak}</p>
          <p className="text-orange-200 text-xs">days · {progress.consecutiveCorrect} correct streak</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-emerald-100 text-xs font-medium">Mastery Score</p>
            <Target className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">{progress.masteryScore}%</p>
          <p className="text-emerald-200 text-xs">Overall · {accuracy}% accuracy</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-emerald-300 h-1.5 rounded-full transition-all" style={{ width: `${progress.masteryScore}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cyan-100 text-xs font-medium">XP Multiplier</p>
            <Brain className="w-5 h-5 text-cyan-200" />
          </div>
          <p className="text-3xl font-bold">{xpMultiplier}</p>
          <p className="text-cyan-200 text-xs">{progress.consecutiveCorrect} streak · {progress.totalQuestions} total Qs</p>
        </CardContent>
      </Card>
    </div>
  )
}
