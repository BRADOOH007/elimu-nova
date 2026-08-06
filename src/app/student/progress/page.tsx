"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MasteryGates } from "@/components/student/mastery-gates"
import { KnowledgeMap } from "@/components/student/knowledge-map"
import PerformanceTrends from "@/components/student/performance-trends"
import {
  Trophy, Flame, Target, MessagesSquare, Clock, CheckCircle,
  TrendingUp, ArrowRight, Loader2, BookOpen, RefreshCw, Sparkles,
} from "lucide-react"

interface Skill {
  name: string
  mastery: number
  category: string
}

interface Topic {
  name: string
  mastery: number
  subject: string
}

interface ProgressPageData {
  xp: number
  streak: number
  consecutiveCorrect: number
  totalQuestions: number
  correctAnswers: number
  skills: Skill[]
  topics: Topic[]
}

interface DashboardData {
  student?: {
    name: string
    school: string
    class: string
  }
  stats?: {
    completedAssignments: number
    averageGrade: number | null
    overdueAssignments: number
  }
  progress?: {
    xp: number
    streak: number
    masteryScore: number
  }
  analytics?: {
    totalStudyTime: number
    weeklyGoal: number
    monthlyGoal: number
  }
}

interface MasteryPayload {
  masteries: any[]
  subjectSummary: Array<{ subject: string; averageMastery: number; totalUnits: number; masteredUnits: number }>
  dueForReview: any[]
}

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", "Social Studies",
  "CRE", "Physics", "Chemistry", "Biology", "History", "Geography",
  "Agriculture", "Business Studies", "Computer Studies",
  "Coding", "Programming", "Web Development", "Python",
]

function masteryColor(score: number): string {
  if (score >= 75) return "bg-gradient-to-r from-emerald-500 to-green-500"
  if (score >= 40) return "bg-gradient-to-r from-amber-500 to-orange-500"
  return "bg-gradient-to-r from-red-500 to-rose-500"
}

function masteryLabel(score: number): string {
  if (score >= 75) return "text-emerald-600"
  if (score >= 40) return "text-amber-600"
  return "text-red-600"
}

export default function ProgressPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [data, setData] = useState<ProgressPageData | null>(null)
  const [mastery, setMastery] = useState<MasteryPayload | null>(null)
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([
      fetch("/api/student/dashboard").then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/student/progress-page").then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/student/mastery").then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([dash, prog, mast]) => {
        if (!active) return
        setDashboard(dash as DashboardData | null || null)
        setData((prog as ProgressPageData) || null)
        setMastery((mast as MasteryPayload) || null)
      })
      .catch(() => { if (active) { setDashboard(null); setData(null); setMastery(null) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Loading your learning dashboard...</p>
        </div>
      </div>
    )
  }

  // Never show error page â€” use zeroed fallback data so UI always renders
  const d = data || {} as ProgressPageData
  const dash = dashboard || {} as DashboardData
  const mast = mastery || {} as MasteryPayload

  const accuracy = (d.totalQuestions || 0) > 0
    ? Math.round(((d.correctAnswers || 0) / (d.totalQuestions || 1)) * 100)
    : 0

  const firstName = dash?.student?.name?.split(" ")[0] || ""
  const xp = dash?.progress?.xp ?? d.xp ?? 0
  const streak = dash?.progress?.streak ?? d.streak ?? 0
  const masteryScore = dash?.progress?.masteryScore ?? 0
  const avgGrade = dash?.stats?.averageGrade
  const completedAssignments = dash?.stats?.completedAssignments ?? 0
  const totalStudyTime = dash?.analytics?.totalStudyTime ?? 0
  const weeklyGoal = dash?.analytics?.weeklyGoal ?? 300
  const weeklyPct = weeklyGoal > 0 ? Math.min(100, Math.round((totalStudyTime / weeklyGoal) * 100)) : 0
  const dueReviews = mast?.dueForReview?.length ?? 0
  const subjectSummary = mast?.subjectSummary ?? []

  const stats = [
    { label: "Accuracy", value: `${accuracy}%`, icon: Target, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-700", hint: `${d.correctAnswers || 0}/${d.totalQuestions || 0} correct` },
    { label: "Questions", value: (d.totalQuestions || 0).toLocaleString(), icon: MessagesSquare, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-700", hint: `${d.consecutiveCorrect || 0} in a row` },
    { label: "Study Time", value: totalStudyTime >= 60 ? `${Math.round(totalStudyTime / 60)}h` : `${totalStudyTime}m`, icon: Clock, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", text: "text-violet-700", hint: `Weekly goal ${Math.round(weeklyGoal / 60)}h` },
    { label: "Average Grade", value: avgGrade != null ? `${avgGrade}%` : "â€”", icon: TrendingUp, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-700", hint: `${completedAssignments} assignments done` },
  ]

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-indigo-300 font-semibold mb-1">Dashboard Overview</p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">My Progress</h1>
                <p className="text-slate-300 text-sm mt-1">
                  Welcome back{firstName ? `, ${firstName}` : ""}. Here's how your learning is going.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/10 backdrop-blur rounded-xl">
                  <div className="text-center"><p className="text-amber-400 text-lg font-bold">{xp.toLocaleString()}</p><p className="text-white/60 text-[10px]">XP</p></div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center"><p className="text-orange-400 text-lg font-bold flex items-center gap-1"><Flame className="h-4 w-4" />{streak}</p><p className="text-white/60 text-[10px]">Day Streak</p></div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center"><p className="text-emerald-400 text-lg font-bold">{masteryScore}%</p><p className="text-white/60 text-[10px]">Mastery</p></div>
                </div>
                <Button onClick={() => router.push("/student/learn")}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/40 border-0">
                  <BookOpen className="h-4 w-4 mr-1.5" />Continue Learning <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Weekly goal */}
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-300" />Weekly Study Goal</p>
                <span className="text-xs font-bold text-white">{weeklyPct}%</span>
              </div>
              <Progress value={weeklyPct} className="h-2 bg-white/20" />
              <p className="text-[11px] text-slate-400 mt-2">
                {totalStudyTime} min studied this week Â· {Math.max(0, weeklyGoal - totalStudyTime)} min to go
              </p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-800 leading-tight">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">{stat.hint}</p>
            </div>
          ))}
        </div>

        {/* Mastery section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mastery Gates</h2>
                <p className="text-sm text-slate-500">Track your progress across units and knowledge areas.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dueReviews > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200"><RefreshCw className="h-3 w-3 mr-1" />{dueReviews} due for review</Badge>
              )}
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="h-9 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">All subjects</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {subjectSummary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subjectSummary.map(s => (
                <div key={s.subject} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs">
                  <span className="font-semibold text-slate-700">{s.subject}</span>
                  <span className={`font-bold ${masteryLabel(s.averageMastery)}`}>{s.averageMastery}%</span>
                  <span className="text-slate-400">{s.masteredUnits}/{s.totalUnits} mastered</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <MasteryGates subject={subject || undefined} />
            </div>
            <div className="lg:col-span-3">
              <KnowledgeMap subject={subject || "Mathematics"} />
            </div>
          </div>
        </div>

        {/* Performance trends */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Performance Trends</h2>
              <p className="text-sm text-slate-500">Grades, study time, and subject performance over the last 30 days.</p>
            </div>
          </div>
          <PerformanceTrends />
        </div>

        {/* Skill mastery breakdown */}
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                <Target className="h-4 w-4 text-white" />
              </div>
              Skill Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(d.skills || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No skills tracked yet. Complete quizzes and study sessions to build skill mastery.</p>
            ) : (
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                {d.skills || [].slice(0, 12).map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate mr-2">{skill.name}</span>
                      <span className={`text-sm font-semibold whitespace-nowrap ${masteryLabel(skill.mastery)}`}>{skill.mastery}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full transition-all duration-500 ${masteryColor(skill.mastery)}`} style={{ width: `${skill.mastery}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent topics */}
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              Recent Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(d.topics || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No topics studied yet. Head to the Learning Hub to get started.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {d.topics || [].slice(0, 9).map((topic, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{topic.name}</p>
                        <p className="text-xs text-slate-400 truncate">{topic.subject}</p>
                      </div>
                      <span className={`text-sm font-bold ml-2 ${masteryLabel(topic.mastery)}`}>{topic.mastery}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${masteryColor(topic.mastery)}`} style={{ width: `${topic.mastery}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
