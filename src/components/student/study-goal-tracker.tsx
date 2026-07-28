'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, BookOpen, Clock, TrendingUp, Loader2 } from 'lucide-react'

interface Goal { current: number; target: number }
interface GoalsData { assignmentsCompleted: Goal; studyHours: Goal; averageGrade: Goal }
interface WeeklyProgress { assignmentsDone: number; studyHours: number; pendingTotal: number }

export default function StudyGoalTracker() {
  const [goals, setGoals] = useState<GoalsData | null>(null)
  const [progress, setProgress] = useState<WeeklyProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/goals')
        if (res.ok) { const d = await res.json(); setGoals(d.goals); setProgress(d.weeklyProgress) }
      } catch (e) { console.warn('[StudyGoalTracker] Failed to fetch:', e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-indigo-600" />
          Weekly Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalBar icon={BookOpen} label="Assignments" current={progress?.assignmentsDone || 0} target={goals?.assignmentsCompleted.target || 5} suffix="done" color="bg-blue-500" />
        <GoalBar icon={Clock} label="Study Hours" current={progress?.studyHours || 0} target={goals?.studyHours.target || 10} suffix="hrs" color="bg-green-500" />
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span><BookOpen className="w-3 h-3 inline mr-1" />{progress?.pendingTotal || 0} pending</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> On track</span>
        </div>
      </CardContent>
    </Card>
  )
}

function GoalBar({ icon: Icon, label, current, target, suffix, color }: { icon: any; label: string; current: number; target: number; suffix: string; color: string }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xs font-bold text-gray-900">{current}/{target} {suffix}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
