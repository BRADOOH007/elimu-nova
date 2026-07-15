'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Flame, Target, Clock, TrendingUp } from 'lucide-react'

interface Analytics {
  totalStudyTime: number
  completedAssignments: number
  streakDays: number
  longestStreak: number
  weeklyGoal: number
  monthlyGoal: number
}

interface Props {
  analytics: Analytics
  studyTimeThisWeek: number
}

export default function StudyStreak({ analytics, studyTimeThisWeek }: Props) {
  const weeklyProgress = Math.min(100, Math.round((studyTimeThisWeek / analytics.weeklyGoal) * 100))
  const monthlyProgress = Math.min(100, Math.round((analytics.totalStudyTime / analytics.monthlyGoal) * 100))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 text-xs font-medium">Study Streak</p>
            <Flame className="w-5 h-5 text-orange-200" />
          </div>
          <p className="text-3xl font-bold">{analytics.streakDays}</p>
          <p className="text-orange-200 text-xs">days · Best: {analytics.longestStreak}</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-xs font-medium">Weekly Goal</p>
            <Target className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{weeklyProgress}%</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${weeklyProgress}%` }} />
          </div>
          <p className="text-blue-200 text-xs mt-1">{Math.round(studyTimeThisWeek / 60)}h / {Math.round(analytics.weeklyGoal / 60)}h</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-xs font-medium">Monthly Progress</p>
            <TrendingUp className="w-5 h-5 text-green-200" />
          </div>
          <p className="text-3xl font-bold">{monthlyProgress}%</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${monthlyProgress}%` }} />
          </div>
          <p className="text-green-200 text-xs mt-1">{Math.round(analytics.totalStudyTime / 60)}h / {Math.round(analytics.monthlyGoal / 60)}h</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-xs font-medium">Completed</p>
            <Clock className="w-5 h-5 text-purple-200" />
          </div>
          <p className="text-3xl font-bold">{analytics.completedAssignments}</p>
          <p className="text-purple-200 text-xs">assignments done</p>
        </CardContent>
      </Card>
    </div>
  )
}
