'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Zap, Flame, Award, Target, Brain, Star, Trophy, BookOpen, Clock, CheckCircle } from 'lucide-react'

interface AchievementsProps {
  xp: number
  streak: number
  masteryScore: number
  totalStudyTime: number
  completedAssignments: number
  accuracy: number
  totalQuestions: number
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1600, 2400, 3400, 4600, 6000]

function getLevel(xp: number) {
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break }
  }
  return level
}

function getLevelProgress(xp: number) {
  const level = getLevel(xp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000
  return { level, progress: ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, currentXp: xp - currentThreshold, nextXp: nextThreshold - currentThreshold }
}

type Badge = {
  id: string
  name: string
  icon: typeof Zap
  description: string
  unlocked: boolean
  progress: number
  color: string
}

export function Achievements({ xp = 0, streak = 0, masteryScore = 0, totalStudyTime = 0, completedAssignments = 0, accuracy = 0, totalQuestions = 0 }: AchievementsProps) {
  const { level, progress: levelProgress, currentXp, nextXp } = getLevelProgress(xp)

  const badges: Badge[] = [
    { id: 'first_study', name: 'First Steps', icon: BookOpen, description: 'Complete your first study session', unlocked: totalStudyTime >= 10, progress: Math.min(100, (totalStudyTime / 10) * 100), color: 'from-blue-400 to-blue-600' },
    { id: 'streak_3', name: 'Getting Started', icon: Flame, description: '3-day study streak', unlocked: streak >= 3, progress: Math.min(100, (streak / 3) * 100), color: 'from-orange-400 to-red-500' },
    { id: 'streak_7', name: 'Week Warrior', icon: Flame, description: '7-day study streak', unlocked: streak >= 7, progress: Math.min(100, (streak / 7) * 100), color: 'from-orange-500 to-red-600' },
    { id: 'streak_30', name: 'Monthly Master', icon: Trophy, description: '30-day study streak', unlocked: streak >= 30, progress: Math.min(100, (streak / 30) * 100), color: 'from-yellow-400 to-orange-500' },
    { id: 'hours_5', name: 'Dedicated Learner', icon: Clock, description: '5 hours of study', unlocked: totalStudyTime >= 300, progress: Math.min(100, (totalStudyTime / 300) * 100), color: 'from-purple-400 to-purple-600' },
    { id: 'hours_20', name: 'Knowledge Seeker', icon: Clock, description: '20 hours of study', unlocked: totalStudyTime >= 1200, progress: Math.min(100, (totalStudyTime / 1200) * 100), color: 'from-purple-500 to-indigo-600' },
    { id: 'assignments_5', name: 'Task Completer', icon: CheckCircle, description: 'Complete 5 assignments', unlocked: completedAssignments >= 5, progress: Math.min(100, (completedAssignments / 5) * 100), color: 'from-green-400 to-green-600' },
    { id: 'assignments_20', name: 'Assignment Champ', icon: CheckCircle, description: 'Complete 20 assignments', unlocked: completedAssignments >= 20, progress: Math.min(100, (completedAssignments / 20) * 100), color: 'from-green-500 to-emerald-600' },
    { id: 'mastery_80', name: 'Subject Master', icon: Brain, description: 'Reach 80% mastery', unlocked: masteryScore >= 80, progress: Math.min(100, masteryScore), color: 'from-indigo-400 to-indigo-600' },
    { id: 'accuracy_90', name: 'Sharp Mind', icon: Target, description: '90% quiz accuracy on 50+ questions', unlocked: accuracy >= 90 && totalQuestions >= 50, progress: Math.min(100, accuracy), color: 'from-cyan-400 to-blue-500' },
    { id: 'level_5', name: 'Rising Star', icon: Star, description: 'Reach Level 5', unlocked: level >= 5, progress: Math.min(100, (level / 5) * 100), color: 'from-yellow-400 to-yellow-600' },
    { id: 'level_10', name: 'Legend', icon: Trophy, description: 'Reach Level 10', unlocked: level >= 10, progress: Math.min(100, (level / 10) * 100), color: 'from-amber-400 to-red-500' },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <div className="space-y-5">
      {/* Level Card */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Current Level</p>
              <p className="text-4xl font-black mt-1">Level {level}</p>
              <p className="text-amber-100 text-sm mt-1">{xp.toLocaleString()} total XP</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-yellow-300" />
              </div>
              <p className="text-xs text-amber-100">{unlockedCount}/{badges.length} badges</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-amber-200">
              <span>{currentXp.toLocaleString()} XP</span>
              <span>{nextXp.toLocaleString()} XP to Level {level + 1}</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-amber-300 rounded-full transition-all" style={{ width: `${Math.min(100, levelProgress)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map(badge => {
          const Icon = badge.icon
          return (
            <div
              key={badge.id}
              className={`rounded-2xl p-4 border transition-all ${badge.unlocked ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className={`text-sm font-semibold ${badge.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{badge.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 mb-2">{badge.description}</p>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${badge.color} transition-all`} style={{ width: `${Math.min(100, badge.progress)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
