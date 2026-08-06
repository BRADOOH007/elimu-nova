"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MasteryGates } from "@/components/student/mastery-gates"
import { KnowledgeMap } from "@/components/student/knowledge-map"
import PerformanceTrends from "@/components/student/performance-trends"
import {
  Trophy, Flame, Target, Clock, CheckCircle, TrendingUp, ArrowRight, BookOpen, Sparkles, Star, Repeat
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

  const a = analytics || { totalMinutes: 0, totalQuestions: 0, correctAnswers: 0, accuracy: 0, completedAssignments: 0, totalAssignments: 0, badges: [], studyChart: [], subjects: [], weakTopics: [], gradeTrend: [] }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Progress</h1>
          <p className="text-slate-500 text-sm">Track your learning journey</p>
        </div>
        <Link href="/student/learn"><Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"><BookOpen className="h-4 w-4 mr-2" />Study Now</Button></Link>
      </div>

      {/* Badges */}
      {a.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {a.badges.map((b, i) => (
            <span key={i} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full px-3 py-1.5 text-xs font-semibold text-purple-700 flex items-center gap-1.5"><Sparkles className="h-3 w-3" />{b}</span>
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

      {/* Performance Trends + Knowledge Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PerformanceTrends />
        <KnowledgeMap />
      </div>

      {/* Mastery Gates */}
      <MasteryGates />

      {/* Weak Topics + Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {a.weakTopics.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-rose-500" />Topics to Review</h2>
              <div className="space-y-2">
                {a.weakTopics.map((t, i) => (
                  <Link key={i} href={`/student/learn?subject=${encodeURIComponent(t.topic.split(' ')[0] || '')}`}
                    className="flex items-center justify-between bg-rose-50 rounded-xl p-2.5 border border-rose-100 hover:bg-rose-100 transition-colors">
                    <span className="text-xs font-medium text-slate-700 truncate">{t.topic}</span>
                    <span className="text-xs font-bold text-rose-600">{t.score}%</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Repeat className="h-5 w-5 text-orange-500" />Spaced Repetition</h2>
            <p className="text-xs text-slate-500 mb-3">Review topics at the optimal time to strengthen memory</p>
            <Link href="/student/learn?tab=reviews"><Button variant="outline" size="sm" className="w-full text-xs"><Repeat className="h-3.5 w-3.5 mr-1.5" />View Review Schedule</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
