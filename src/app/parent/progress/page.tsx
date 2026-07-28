"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  TrendingUp, TrendingDown, Minus, Brain,
  AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, Zap, Flame
} from "lucide-react"

interface Child { id: string; name: string }

interface Alert {
  id: string; studentName: string; title: string
  message: string; severity: "critical" | "warning" | "info"; subject?: string
}

interface SubjectProgress {
  subject: string; masteryScore: number; xp: number
  streak: number; correctAnswers: number; totalQuestions: number
  preferredDifficulty: string; status: string
}

interface StudentData {
  name: string; averageGrade: number | null
  completedAssignments: number; pendingAssignments: number
  streakDays: number; totalStudyTime: number
  subjects: SubjectProgress[]
}

function ProgressContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get("studentId") || ""

  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/parent/children")
      .then(r => r.json())
      .then(({ children: raw }) => {
        const mapped = raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` }))
        setChildren(mapped)
        if (!selectedId && mapped.length > 0) setSelectedId(mapped[0].id)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    Promise.all([
      fetch(`/api/parent/progress?studentId=${selectedId}`).then(r => r.json()),
      fetch("/api/parent/alerts").then(r => r.json()),
    ])
      .then(([progressRes, alertsRes]) => {
        const s = progressRes.student
        if (s) {
          const progress: SubjectProgress[] = (s.studentProgress || []).map((p: any) => ({
            subject: p.subject, masteryScore: p.masteryScore, xp: p.xp, streak: p.streak,
            correctAnswers: p.correctAnswers, totalQuestions: p.totalQuestions,
            preferredDifficulty: p.preferredDifficulty, status: p.status,
          }))
          setStudentData({
            name: `${s.user.firstName} ${s.user.lastName}`,
            averageGrade: s.analytics?.averageGrade ?? null,
            completedAssignments: s.analytics?.completedAssignments ?? 0,
            pendingAssignments: s.analytics?.pendingAssignments ?? 0,
            streakDays: s.analytics?.streakDays ?? 0,
            totalStudyTime: s.analytics?.totalStudyTime ?? 0,
            subjects: progress,
          })
        }
        setAlerts(alertsRes.alerts || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedId])

  const studentAlerts = alerts.filter(a => {
    const child = children.find(c => c.id === selectedId)
    return child && a.studentName === child.name
  })

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    if (s === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
    return <Info className="h-4 w-4 text-blue-500 shrink-0" />
  }

  const severityClass = (s: string) => {
    if (s === "critical") return "border-red-200 bg-red-50"
    if (s === "warning") return "border-amber-200 bg-amber-50"
    return "border-blue-200 bg-blue-50"
  }

  const masteryColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500"
    if (score >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  const trendIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    if (score >= 40) return <Minus className="h-3.5 w-3.5 text-amber-500" />
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Progress &amp; Grades</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI-powered insights into your child&apos;s learning</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center space-y-1">
                <div className="h-7 w-16 bg-slate-200 rounded mx-auto" />
                <div className="h-3 w-20 bg-slate-200 rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 bg-white">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 bg-slate-200 rounded" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded" />
                </div>
                <div className="h-3 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : !studentData ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No progress data yet</p>
          <p className="text-slate-400 text-sm mt-1">Data appears once your child starts using the AI tutor</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: studentData.averageGrade !== null ? `${Math.round(studentData.averageGrade)}%` : "—", label: "Average Grade", gradient: "from-blue-500 to-indigo-600" },
              { value: String(studentData.completedAssignments), label: "Completed", gradient: "from-emerald-500 to-teal-600" },
              { value: String(studentData.pendingAssignments), label: "Pending", gradient: "from-amber-500 to-orange-600" },
              { value: `${studentData.streakDays}d`, label: "Study Streak", gradient: "from-violet-500 to-purple-600" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Warnings */}
          {studentAlerts.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">AI Early Warnings</h2>
                <span className="ml-auto text-xs text-slate-400">{studentAlerts.length} detected</span>
              </div>
              <div className="space-y-2.5">
                {studentAlerts.map(alert => (
                  <div key={alert.id} className={`flex gap-3 p-3.5 rounded-lg border ${severityClass(alert.severity)}`}>
                    {severityIcon(alert.severity)}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">No concerns detected</p>
                <p className="text-emerald-700 text-xs mt-0.5">AI analysis shows {studentData.name.split(" ")[0]} is on track</p>
              </div>
            </div>
          )}

          {/* Subject Mastery */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Subject Mastery</h2>
              <span className="ml-auto text-[11px] font-medium text-slate-400">AI Tutor Data</span>
            </div>
            {studentData.subjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No AI tutor sessions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentData.subjects.map(s => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {trendIcon(s.masteryScore)}
                        <span className="text-sm font-semibold text-slate-700">{s.subject}</span>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{s.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">{s.correctAnswers}/{s.totalQuestions} correct</span>
                        <span className="text-sm font-bold text-slate-800">{s.masteryScore}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${masteryColor(s.masteryScore)}`} style={{ width: `${s.masteryScore}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function ParentProgress() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-56 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-44 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center space-y-1">
              <div className="h-7 w-16 bg-slate-200 rounded mx-auto" />
              <div className="h-3 w-20 bg-slate-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProgressContent />
    </Suspense>
  )
}
