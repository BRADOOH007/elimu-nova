'use client'

import { useEffect, useState } from 'react'
import {
  Users, Brain, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertTriangle, BarChart3, RefreshCw, ChevronDown, ChevronUp,
  Zap, BookOpen, Target, Activity, Search, Eye
} from 'lucide-react'
import Link from 'next/link'

interface StudentProgress {
  id: string; name: string; email: string; grade: string
  weeklyStudyTime: number; monthlyStudyTime: number
  averageGrade: number | null; completedAssignments: number
  pendingAssignments: number; overdueAssignments: number
  recentAIActivity: number; lastAISession: string | null
  lastStudySession: string | null; lastSubmission: string | null
}

interface MonitorData {
  classOverview: {
    totalStudents: number; activeStudents: number; totalStudyTime: number
    averageGrade: number; totalAssignments: number; completedAssignments: number
    completionRate: number
  }
  studentProgress: StudentProgress[]
  aiInsights: {
    topPerformers: StudentProgress[]; needsAttention: StudentProgress[]
    mostActive: StudentProgress[]; aiEngagement: StudentProgress[]
  }
  teacher: { name: string; email: string }
}

export default function ProgressMonitorPage() {
  const [data, setData]         = useState<MonitorData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState<'grade' | 'activity' | 'overdue'>('grade')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher/student-progress-monitor')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = (data?.studentProgress || [])
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'grade')    return (b.averageGrade || 0) - (a.averageGrade || 0)
      if (sortBy === 'activity') return b.weeklyStudyTime - a.weeklyStudyTime
      return b.overdueAssignments - a.overdueAssignments
    })

  const gradeColor = (g: number | null) => {
    if (g === null) return 'text-slate-400'
    if (g >= 75) return 'text-green-600'
    if (g >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const gradeBg = (g: number | null) => {
    if (g === null) return 'bg-slate-100'
    if (g >= 75) return 'bg-green-50 border-green-200'
    if (g >= 60) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  const fmtTime = (min: number) => min >= 60 ? `${Math.round(min / 60)}h` : `${min}m`
  const fmtDate = (iso: string | null) => {
    if (!iso) return 'Never'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff}d ago`
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="p-6 text-center text-slate-500">Could not load progress data.</div>
  )

  const { classOverview, aiInsights } = data

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Progress Monitor</h1>
          <p className="text-slate-500 text-sm mt-0.5">Live view of every student's learning activity and performance</p>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/teacher/student-progress-monitor').then(r => r.json()).then(setData).finally(() => setLoading(false)) }}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Class overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',    value: classOverview.totalStudents,    icon: Users,        color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Active This Week',  value: classOverview.activeStudents,   icon: Activity,     color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Class Grade',   value: classOverview.averageGrade > 0 ? `${classOverview.averageGrade}%` : '—', icon: TrendingUp, color: classOverview.averageGrade >= 60 ? 'text-green-600' : 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completion Rate',   value: `${classOverview.completionRate}%`, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI Insights panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Needs attention */}
        {aiInsights.needsAttention.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-red-800 text-sm">Needs Attention ({aiInsights.needsAttention.length})</h3>
            </div>
            <div className="space-y-2">
              {aiInsights.needsAttention.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {s.overdueAssignments > 0 && <span className="text-red-600 font-medium">{s.overdueAssignments} overdue</span>}
                    {s.averageGrade !== null && <span className={gradeColor(s.averageGrade)}>{Math.round(s.averageGrade)}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top performers */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold text-green-800 text-sm">Top Performers</h3>
          </div>
          <div className="space-y-2">
            {aiInsights.topPerformers.slice(0, 4).map((s, i) => (
              <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-600">#{i + 1}</span>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                </div>
                <span className={`text-sm font-bold ${gradeColor(s.averageGrade)}`}>
                  {s.averageGrade !== null ? `${Math.round(s.averageGrade)}%` : '—'}
                </span>
              </div>
            ))}
            {aiInsights.topPerformers.length === 0 && <p className="text-sm text-green-700">No graded submissions yet</p>}
          </div>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Table controls */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['grade', 'activity', 'overdue'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${sortBy === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {s === 'grade' ? 'By Grade' : s === 'activity' ? 'By Activity' : 'By Overdue'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{filtered.length} students</p>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {filtered.map(student => (
            <div key={student.id}>
              <button
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setExpanded(expanded === student.id ? null : student.id)}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{student.name.split(' ').map(n => n[0]).join('')}</span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.grade}</p>
                </div>

                {/* Grade */}
                <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${gradeBg(student.averageGrade)}`}>
                  {student.averageGrade !== null ? `${Math.round(student.averageGrade)}%` : 'No grade'}
                </div>

                {/* Study time */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 w-16">
                  <Clock className="h-3 w-3" />
                  {fmtTime(student.weeklyStudyTime)}
                </div>

                {/* Overdue */}
                {student.overdueAssignments > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {student.overdueAssignments}
                  </div>
                )}

                {/* AI sessions */}
                <div className="hidden md:flex items-center gap-1 text-xs text-purple-600 w-10">
                  <Brain className="h-3 w-3" />
                  {student.recentAIActivity}
                </div>

                {expanded === student.id
                  ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {expanded === student.id && (
                <div className="px-5 pb-4 pt-1 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: 'Weekly Study',      value: fmtTime(student.weeklyStudyTime),     icon: Clock       },
                      { label: 'Completed Work',    value: student.completedAssignments,          icon: CheckCircle },
                      { label: 'Pending',           value: student.pendingAssignments,            icon: BookOpen    },
                      { label: 'AI Tutor Sessions', value: student.recentAIActivity,              icon: Brain       },
                    ].map(m => (
                      <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                        <m.icon className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-slate-800">{m.value}</p>
                        <p className="text-[11px] text-slate-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>Last active: <strong className="text-slate-700">{fmtDate(student.lastStudySession)}</strong></span>
                    <span>Last AI session: <strong className="text-slate-700">{fmtDate(student.lastAISession)}</strong></span>
                    <span>Last submission: <strong className="text-slate-700">{fmtDate(student.lastSubmission)}</strong></span>
                    {student.overdueAssignments > 0 && (
                      <span className="text-red-600 font-medium">{student.overdueAssignments} overdue assignment{student.overdueAssignments > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
