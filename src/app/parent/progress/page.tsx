'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  TrendingUp, TrendingDown, Minus, Brain,
  AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw
} from 'lucide-react'

interface Child { id: string; name: string }

interface Alert {
  id: string; studentName: string; title: string
  message: string; severity: 'critical' | 'warning' | 'info'; subject?: string
}

interface SubjectProgress {
  subject: string; masteryScore: number; xp: number
  streak: number; correctAnswers: number; totalQuestions: number
  preferredDifficulty: string; status: string
}

interface StudentData {
  name: string
  averageGrade: number | null
  completedAssignments: number
  pendingAssignments: number
  streakDays: number
  totalStudyTime: number
  subjects: SubjectProgress[]
}

function ProgressContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('studentId') || ''

  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  // Load children list
  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(({ children: raw }) => {
        const mapped = raw.map((c: any) => ({
          id: c.id,
          name: `${c.user.firstName} ${c.user.lastName}`,
        }))
        setChildren(mapped)
        if (!selectedId && mapped.length > 0) setSelectedId(mapped[0].id)
      })
      .catch(console.error)
  }, [])

  // Load selected child progress + alerts
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)

    Promise.all([
      fetch(`/api/parent/progress?studentId=${selectedId}`).then(r => r.json()),
      fetch('/api/parent/alerts').then(r => r.json()),
    ])
      .then(([progressRes, alertsRes]) => {
        const s = progressRes.student
        if (s) {
          const progress: SubjectProgress[] = (s.studentProgress || []).map((p: any) => ({
            subject:             p.subject,
            masteryScore:        p.masteryScore,
            xp:                  p.xp,
            streak:              p.streak,
            correctAnswers:      p.correctAnswers,
            totalQuestions:      p.totalQuestions,
            preferredDifficulty: p.preferredDifficulty,
            status:              p.status,
          }))
          setStudentData({
            name:                 `${s.user.firstName} ${s.user.lastName}`,
            averageGrade:         s.analytics?.averageGrade ?? null,
            completedAssignments: s.analytics?.completedAssignments ?? 0,
            pendingAssignments:   s.analytics?.pendingAssignments ?? 0,
            streakDays:           s.analytics?.streakDays ?? 0,
            totalStudyTime:       s.analytics?.totalStudyTime ?? 0,
            subjects:             progress,
          })
        }
        // Filter alerts for this student
        const childAlerts = (alertsRes.alerts || []).filter(
          (a: Alert) => children.find(c => c.id === selectedId)?.name === a.studentName ||
                        (alertsRes.alerts || []).some((al: Alert) => al.studentName)
        )
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
    if (s === 'critical') return <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
    if (s === 'warning')  return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
    return <Info className="h-4 w-4 text-blue-400 shrink-0" />
  }

  const severityClass = (s: string) => {
    if (s === 'critical') return 'border-red-200 bg-red-50'
    if (s === 'warning')  return 'border-amber-200 bg-amber-50'
    return 'border-blue-200 bg-blue-50'
  }

  const masteryColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const trendIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (score >= 40) return <Minus className="h-3 w-3 text-amber-500" />
    return <TrendingDown className="h-3 w-3 text-red-500" />
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progress & Grades</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-powered insights into your child's learning</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !studentData ? (
        <div className="text-center py-16 text-slate-500">No data available</div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Average Grade',    value: studentData.averageGrade !== null ? `${Math.round(studentData.averageGrade)}%` : '—' },
              { label: 'Completed',        value: studentData.completedAssignments },
              { label: 'Pending',          value: studentData.pendingAssignments },
              { label: 'Study Streak',     value: `${studentData.streakDays}d` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Early Warnings for this child */}
          {studentAlerts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-purple-600" />
                <h2 className="font-semibold text-slate-800">AI Early Warnings</h2>
                <span className="ml-auto text-xs text-slate-500">{studentAlerts.length} detected</span>
              </div>
              <div className="space-y-3">
                {studentAlerts.map(alert => (
                  <div key={alert.id} className={`flex gap-3 p-3 rounded-xl border ${severityClass(alert.severity)}`}>
                    {severityIcon(alert.severity)}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No alerts */}
          {studentAlerts.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">No concerns detected</p>
                <p className="text-green-700 text-xs">AI analysis shows {studentData.name.split(' ')[0]} is on track</p>
              </div>
            </div>
          )}

          {/* Subject mastery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Subject Mastery (AI Tutor Data)</h2>
            {studentData.subjects.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No AI tutor sessions yet</p>
            ) : (
              <div className="space-y-4">
                {studentData.subjects.map(s => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {trendIcon(s.masteryScore)}
                        <span className="text-sm font-medium text-slate-700">{s.subject}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{s.correctAnswers}/{s.totalQuestions} correct</span>
                        <span className="text-sm font-bold text-slate-800">{s.masteryScore}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${masteryColor(s.masteryScore)}`}
                        style={{ width: `${s.masteryScore}%` }}
                      />
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProgressContent />
    </Suspense>
  )
}
