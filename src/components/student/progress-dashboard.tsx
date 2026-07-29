'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Brain, Clock, Flame, Target, Zap, Award, TrendingUp, BookOpen, CheckCircle, BarChart3 } from 'lucide-react'

interface ProgressData {
  xp: number
  streak: number
  longestStreak: number
  totalStudyTime: number
  weeklyStudyTime: number
  averageGrade: number
  totalQuestions: number
  correctAnswers: number
  masteryScore: number
  completedAssignments: number
  pendingAssignments: number
  subjectPerformance: Array<{ subject: string; averageGrade: number; totalAssignments: number; completedAssignments: number }>
  recentSessions: Array<{ subject: string; topic: string; duration: number; date: string }>
  weeklyGoal: number
  monthlyGoal: number
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
  return { level, currentXp: xp - currentThreshold, nextXp: nextThreshold - currentThreshold, progress: ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 }
}

export function ProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dashRes, progressRes, sessionsRes] = await Promise.all([
        fetch('/api/student/dashboard'),
        fetch('/api/student/progress'),
        fetch('/api/student/study-sessions?period=month'),
      ])
      const dash = dashRes.ok ? await dashRes.json() : null
      const progress = progressRes.ok ? await progressRes.json() : null
      const sessions = sessionsRes.ok ? await sessionsRes.json() : null

      setData({
        xp: dash?.progress?.xp || progress?.xp || 0,
        streak: dash?.progress?.streak || progress?.studyStreak || 0,
        longestStreak: dash?.analytics?.longestStreak || 0,
        totalStudyTime: progress?.totalStudyTime || dash?.analytics?.totalStudyTime || 0,
        weeklyStudyTime: progress?.weeklyStudyTime || 0,
        averageGrade: progress?.averageGrade || dash?.stats?.averageGrade || 0,
        totalQuestions: dash?.progress?.totalQuestions || 0,
        correctAnswers: dash?.progress?.correctAnswers || 0,
        masteryScore: dash?.progress?.masteryScore || 0,
        completedAssignments: progress?.completedAssignments || dash?.stats?.completedAssignments || 0,
        pendingAssignments: progress?.pendingAssignments || dash?.stats?.activeAssignments || 0,
        subjectPerformance: progress?.subjectPerformance || [],
        recentSessions: (sessions?.sessions || []).slice(0, 5).map((s: any) => ({
          subject: s.subject, topic: s.topic || '', duration: s.duration, date: s.startTime
        })),
        weeklyGoal: dash?.analytics?.weeklyGoal || 300,
        monthlyGoal: dash?.analytics?.monthlyGoal || 1200,
      })
    } catch (e) { console.error('Failed to load progress:', e) }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
      </div>
    )
  }

  if (!data) return <p className="text-sm text-slate-400 text-center py-8">Could not load progress data.</p>

  const { level, currentXp, nextXp, progress: levelProgress } = getLevelProgress(data.xp)
  const accuracy = data.totalQuestions > 0 ? Math.round((data.correctAnswers / data.totalQuestions) * 100) : 0
  const weeklyProgress = data.weeklyGoal > 0 ? Math.min(100, Math.round((data.weeklyStudyTime / data.weeklyGoal) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Level & XP Card */}
      <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-xl shadow-emerald-200/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Level {level}</p>
              <p className="text-3xl font-black mt-0.5">{data.xp.toLocaleString()} XP</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Zap className="h-7 w-7 text-yellow-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-emerald-100">
              <span>{currentXp.toLocaleString()} XP earned</span>
              <span>{nextXp.toLocaleString()} XP to next level</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all" style={{ width: `${Math.min(100, levelProgress)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Streak</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.streak} <span className="text-sm font-normal text-slate-400">days</span></p>
          {data.longestStreak > 0 && <p className="text-[10px] text-slate-400 mt-0.5">Best: {data.longestStreak} days</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Study Time</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{Math.round(data.totalStudyTime / 60)} <span className="text-sm font-normal text-slate-400">hrs</span></p>
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Weekly goal</span>
              <span>{Math.round(data.weeklyStudyTime)}/{data.weeklyGoal} min</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${weeklyProgress}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Accuracy</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{accuracy}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{data.correctAnswers}/{data.totalQuestions} correct</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Mastery</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.masteryScore}%</p>
          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.masteryScore}%` }} />
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      {data.subjectPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.subjectPerformance.map(subj => (
              <div key={subj.subject}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{subj.subject}</span>
                  <span className="font-semibold text-slate-900">{Math.round(subj.averageGrade)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${subj.averageGrade >= 80 ? 'bg-green-500' : subj.averageGrade >= 60 ? 'bg-blue-500' : subj.averageGrade >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${subj.averageGrade}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Study Sessions */}
      {data.recentSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-600" />
              Recent Study Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.subject}{s.topic ? ` — ${s.topic}` : ''}</p>
                  <p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{s.duration} min</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tasks Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase">Completed</span>
          </div>
          <p className="text-xl font-black text-green-800">{data.completedAssignments}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 uppercase">Pending</span>
          </div>
          <p className="text-xl font-black text-amber-800">{data.pendingAssignments}</p>
        </div>
      </div>
    </div>
  )
}
