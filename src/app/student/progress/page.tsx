"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Trophy, Flame, Target, Clock, CheckCircle, TrendingUp, ArrowRight, BookOpen, Sparkles, Repeat, Zap, Star
} from "lucide-react"

interface Analytics {
  totalMinutes: number; totalQuestions: number; correctAnswers: number; accuracy: number
  completedAssignments: number; totalAssignments: number
  badges: string[]
  studyChart: { date: string; minutes: number }[]
  subjects: { name: string; mastery: number }[]
  weakTopics: { topic: string; score: number }[]
  gradeTrend: { date: string; minutes: number }[]
}

const MASTERY_COLORS: Record<string, string> = {
  'Not Started': 'bg-slate-300',
  'Developing': 'bg-amber-400',
  'Proficient': 'bg-blue-500',
  'Mastered': 'bg-purple-600',
}

const MASTERY_THRESHOLDS = [
  { max: 0, label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-100' },
  { max: 40, label: 'Developing', color: 'text-amber-600', bg: 'bg-amber-100' },
  { max: 75, label: 'Proficient', color: 'text-blue-600', bg: 'bg-blue-100' },
  { max: 101, label: 'Mastered', color: 'text-purple-600', bg: 'bg-purple-100' },
]

function getMasteryLevel(score: number) {
  for (const t of MASTERY_THRESHOLDS) { if (score <= t.max) return t }
  return MASTERY_THRESHOLDS[MASTERY_THRESHOLDS.length - 1]
}

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/progress-analytics')
        if (res.ok) setAnalytics(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full" /></div>
  if (!analytics) return <div className="text-center py-16 text-slate-500">Could not load analytics. <button onClick={() => window.location.reload()} className="text-purple-600 underline">Retry</button></div>

  const a = analytics
  const maxDailyMinutes = Math.max(1, ...a.studyChart.map(s => s.minutes))

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Progress</h1>
          <p className="text-slate-500 text-sm">Track your learning journey</p>
        </div>
        <Link href="/student/learn"><Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"><BookOpen className="h-4 w-4 mr-2" />Study Now</Button></Link>
      </div>

      {/* Badge ribbons */}
      {a.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {a.badges.map((b, i) => (
            <span key={i} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full px-3 py-1.5 text-xs font-semibold text-purple-700 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />{b}
            </span>
          ))}
        </div>
      )}

      {/* Stats tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: 'Study Time', value: a.totalMinutes > 0 ? `${Math.round(a.totalMinutes / 60)}h` : '0h', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Target, label: 'Accuracy', value: `${a.accuracy}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: CheckCircle, label: 'Questions', value: `${a.correctAnswers}/${a.totalQuestions}`, color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Trophy, label: 'Assignments', value: `${a.completedAssignments}/${a.totalAssignments}`, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border border-slate-100 shadow-sm p-4 bg-gradient-to-br ${s.bg} to-white`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Subject Mastery */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" />Subject Mastery</h2>
          <div className="space-y-3">
            {a.subjects.length > 0 ? a.subjects.map(s => {
              const level = getMasteryLevel(s.mastery)
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{s.name}</span><span className={level.color}>{s.mastery}%</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={`h-full rounded-full transition-all ${level.bg.replace('bg-', 'bg-')}`} style={{ width: `${s.mastery}%`, background: s.mastery >= 75 ? '#7c3aed' : s.mastery >= 40 ? '#3b82f6' : '#f59e0b' }} /></div>
                </div>
              )
            }) : <p className="text-xs text-slate-400">Complete study sessions to see subject mastery</p>}
          </div>
        </div>

        {/* Study Time Chart (CSS bars) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" />Study Time (30d)</h2>
          {a.studyChart.length > 0 ? (
            <div className="flex items-end gap-0.5 h-32">
              {a.studyChart.slice(-20).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t transition-all" style={{ height: `${Math.max(4, (d.minutes / maxDailyMinutes) * 100)}%`, minHeight: '2px' }} title={`${d.date}: ${d.minutes} min`} />
                  {i % 5 === 0 && <span className="text-[9px] text-slate-400 mt-1">{d.date}</span>}
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">No study data yet</p>}
        </div>

        {/* Weak Topics + Review */}
        <div className="space-y-5">
          {a.weakTopics.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-rose-500" />Needs Review</h2>
              <div className="space-y-2">
                {a.weakTopics.map((t, i) => (
                  <Link key={i} href={`/student/learn?subject=${encodeURIComponent(t.topic.split(' ')[0] || '')}`}
                    className="flex items-center justify-between bg-rose-50 rounded-xl p-2.5 border border-rose-100 hover:bg-rose-100 transition-colors">
                    <span className="text-xs font-medium text-slate-700 truncate">{t.topic}</span>
                    <span className="text-xs font-bold text-rose-600">{t.score}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Repeat className="h-5 w-5 text-orange-500" />Review Queue</h2>
            <p className="text-xs text-slate-500 mb-3">Topics due for spaced repetition review</p>
            <Link href="/student/learn?tab=reviews"><Button variant="outline" size="sm" className="w-full text-xs"><Repeat className="h-3.5 w-3.5 mr-1.5" />View Review Schedule</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
