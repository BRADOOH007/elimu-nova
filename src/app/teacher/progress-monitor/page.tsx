'use client'

import { useEffect, useState } from 'react'
import {
  Users, Brain, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertTriangle, BarChart3, RefreshCw, ChevronDown, ChevronUp,
  BookOpen, Target, Activity, Search, Eye, Award, Flame,
  GraduationCap, Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface StudentProgress {
  id: string; name: string; email: string; avatar?: string; grade: string
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
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: 'Failed to load' }))
          throw new Error(err.error || `HTTP ${r.status}`)
        }
        return r.json()
      })
      .then(d => setData(d))
      .catch(e => console.error('Progress monitor error:', e))
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
    if (g >= 75) return 'text-emerald-600'
    if (g >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const gradeBg = (g: number | null) => {
    if (g === null) return 'bg-slate-100'
    if (g >= 75) return 'bg-emerald-50 border-emerald-200'
    if (g >= 60) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  const gradeBar = (g: number | null) => {
    if (g === null) return 'w-0 bg-slate-200'
    if (g >= 75) return 'w-full bg-gradient-to-r from-emerald-400 to-emerald-500'
    if (g >= 60) return 'w-3/4 bg-gradient-to-r from-amber-400 to-amber-500'
    return 'w-1/2 bg-gradient-to-r from-red-400 to-red-500'
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-3 w-56 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-200" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded" />
            <div className="h-1.5 w-full bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>

      {/* AI insights skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1,2].map(i => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            {[1,2,3].map(j => (
              <div key={j} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200" />
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="h-9 w-full bg-slate-200 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-200 rounded" />
              </div>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-14 h-6 bg-slate-200 rounded-full" />
              <div className="w-16 h-4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div className="p-6 text-center text-slate-500">Could not load progress data.</div>
  )

  const { classOverview, aiInsights } = data

  const statCards = [
    { label: 'Total Students',    value: classOverview.totalStudents,    icon: Users,         color: 'text-blue-600',  gradient: 'from-blue-500/10 to-blue-600/5',   iconBg: 'bg-blue-100'  },
    { label: 'Active This Week',  value: classOverview.activeStudents,   icon: Activity,      color: 'text-emerald-600', gradient: 'from-emerald-500/10 to-emerald-600/5', iconBg: 'bg-emerald-100' },
    { label: 'Avg Class Grade',   value: classOverview.averageGrade > 0 ? `${classOverview.averageGrade}%` : '—', icon: TrendingUp, color: classOverview.averageGrade >= 60 ? 'text-emerald-600' : 'text-amber-600', gradient: 'from-amber-500/10 to-amber-600/5', iconBg: 'bg-amber-100' },
    { label: 'Completion Rate',   value: `${classOverview.completionRate}%`, icon: CheckCircle, color: 'text-purple-600', gradient: 'from-purple-500/10 to-purple-600/5',  iconBg: 'bg-purple-100' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Progress Monitor</h1>
            <p className="text-slate-500 text-xs">Live view of every student&apos;s learning activity and performance</p>
          </div>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/teacher/student-progress-monitor').then(r => r.json()).then(setData).finally(() => setLoading(false)) }}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Class overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 bg-gradient-to-br ${s.gradient}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shadow-sm`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            {s.label === 'Avg Class Grade' && (
              <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${classOverview.averageGrade >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : classOverview.averageGrade >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                  style={{ width: `${Math.min(classOverview.averageGrade, 100)}%` }} />
              </div>
            )}
            {s.label === 'Completion Rate' && (
              <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-500"
                  style={{ width: `${classOverview.completionRate}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Insights panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Needs attention */}
        <div className={`bg-red-50/80 border border-red-200 rounded-2xl p-5 ${aiInsights.needsAttention.length === 0 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h3 className="font-semibold text-red-800 text-sm">Needs Attention</h3>
            <span className="ml-auto text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{aiInsights.needsAttention.length}</span>
          </div>
          <div className="space-y-2">
            {aiInsights.needsAttention.length === 0 ? (
              <p className="text-sm text-red-600/70">All students are on track</p>
            ) : (
              aiInsights.needsAttention.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2.5 border border-red-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {s.overdueAssignments > 0 && (
                      <span className="flex items-center gap-1 text-red-600 font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        {s.overdueAssignments} overdue
                      </span>
                    )}
                    {s.averageGrade !== null && (
                      <span className={`font-bold ${gradeColor(s.averageGrade)}`}>{Math.round(s.averageGrade)}%</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top performers */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-emerald-800 text-sm">Top Performers</h3>
            <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{aiInsights.topPerformers.length}</span>
          </div>
          <div className="space-y-2">
            {aiInsights.topPerformers.length === 0 ? (
              <p className="text-sm text-emerald-600/70">No graded submissions yet</p>
            ) : (
              aiInsights.topPerformers.slice(0, 4).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2.5 border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-blue-400 to-blue-500'}`}>
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${gradeBar(s.averageGrade)}`}
                        style={{ width: `${s.averageGrade || 0}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${gradeColor(s.averageGrade)}`}>
                      {s.averageGrade !== null ? `${Math.round(s.averageGrade)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Most Active & AI Engagement second row */}
      {(aiInsights.mostActive.length > 0 || aiInsights.aiEngagement.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {aiInsights.mostActive.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800 text-sm">Most Active</h3>
              </div>
              <div className="space-y-2">
                {aiInsights.mostActive.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <span className="text-xs font-semibold text-blue-600">{fmtTime(s.weeklyStudyTime)}/week</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aiInsights.aiEngagement.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 border border-purple-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800 text-sm">AI Engagement</h3>
              </div>
              <div className="space-y-2">
                {aiInsights.aiEngagement.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2.5 border border-purple-100">
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <span className="text-xs font-semibold text-purple-600">{s.recentAIActivity} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Table controls */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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
          <p className="text-xs text-slate-400">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {filtered.map(student => (
            <div key={student.id}>
              <button
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setExpanded(expanded === student.id ? null : student.id)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {student.avatar ? (
                    <>
                      <img src={student.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
                      <span className="text-white text-xs font-bold hidden">{student.name.split(' ').map(n => n[0]).join('')}</span>
                    </>
                  ) : <span className="text-white text-xs font-bold">{student.name.split(' ').map(n => n[0]).join('')}</span>}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {student.grade}
                  </p>
                </div>

                {/* Grade mini bar */}
                <div className="hidden md:block w-20">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${student.averageGrade !== null ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-slate-200'}`}
                      style={{ width: `${student.averageGrade || 0}%` }} />
                  </div>
                </div>

                {/* Grade badge */}
                <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${gradeBg(student.averageGrade)}`}>
                  {student.averageGrade !== null ? `${Math.round(student.averageGrade)}%` : '—'}
                </div>

                {/* Study time */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-16">
                  <Clock className="h-3 w-3" />
                  {fmtTime(student.weeklyStudyTime)}
                </div>

                {/* Overdue */}
                {student.overdueAssignments > 0 ? (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    {student.overdueAssignments}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 w-10">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}

                {/* AI sessions */}
                <div className="hidden md:flex items-center gap-1 text-xs text-purple-600 w-14">
                  <Brain className="h-3 w-3" />
                  {student.recentAIActivity}
                </div>

                {expanded === student.id
                  ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {expanded === student.id && (
                <div className="px-5 pb-5 pt-2 bg-gradient-to-br from-slate-50 to-white border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Weekly Study',      value: fmtTime(student.weeklyStudyTime),     icon: Clock,       color: 'blue'    },
                      { label: 'Completed Work',    value: student.completedAssignments,          icon: CheckCircle, color: 'emerald' },
                      { label: 'Pending',           value: student.pendingAssignments,            icon: BookOpen,    color: 'amber'   },
                      { label: 'AI Tutor Sessions', value: student.recentAIActivity,              icon: Brain,       color: 'purple'  },
                    ].map(m => (
                      <div key={m.label} className={`bg-white rounded-xl border border-${m.color}-100 p-3 text-center shadow-sm`}>
                        <div className={`w-8 h-8 rounded-lg bg-${m.color}-100 flex items-center justify-center mx-auto mb-1.5`}>
                          <m.icon className={`h-4 w-4 text-${m.color}-600`} />
                        </div>
                        <p className="text-lg font-bold text-slate-800">{m.value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-5 text-xs text-slate-500 flex-wrap bg-white rounded-xl border border-slate-100 p-3">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                      Last active: <strong className="text-slate-700">{fmtDate(student.lastStudySession)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-purple-400" />
                      Last AI: <strong className="text-slate-700">{fmtDate(student.lastAISession)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      Last submission: <strong className="text-slate-700">{fmtDate(student.lastSubmission)}</strong>
                    </span>
                    {student.overdueAssignments > 0 && (
                      <span className="flex items-center gap-1.5 text-red-600 font-medium ml-auto">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {student.overdueAssignments} overdue assignment{student.overdueAssignments > 1 ? 's' : ''}
                      </span>
                    )}
                    {student.monthlyStudyTime > 0 && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <strong className="text-slate-700">{fmtTime(student.monthlyStudyTime)}</strong> this month
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs mt-0.5">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
