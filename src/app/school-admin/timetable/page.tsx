'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, Sparkles, Loader2, Trash2, RefreshCw,
  CheckCircle, AlertTriangle, AlertCircle, Users,
  GraduationCap, TrendingUp, ArrowRight, Brain,
  Clock, BookOpen, Info
} from 'lucide-react'

/* ──────────────── Types ──────────────── */
interface Schedule {
  id: string; title: string; subject: string; grade: string
  startTime: string; endTime: string; location: string
  teacher: { user: { firstName: string; lastName: string } }
  class: { name: string }
}

interface TeacherProfile {
  id: string; name: string; email: string
  currentLoad: number; totalStudents: number
  subjects: string[]; isOverloaded: boolean; isUnderutilised: boolean
  avgMastery: number; lessonPlans: number
}

interface AllocationInsight {
  type: string; teacherId: string; teacherName: string
  message: string; severity: 'high' | 'medium' | 'low'
}

interface AllocationRec {
  type: string; toTeacherId: string; fromTeacherId: string | null
  classId: string; reason: string; priority: 'high' | 'medium' | 'low'
}

interface AllocationResult {
  summary: string; overallHealth: 'good' | 'warning' | 'critical'
  insights: AllocationInsight[]; recommendations: AllocationRec[]
  teacherProfiles: TeacherProfile[]
  stats: { avgClassesPerTeacher: number; avgStudentsPerTeacher: number; overloadedTeachers: number; underutilisedTeachers: number }
}

/* ──────────────── Helpers ──────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function groupByDay(schedules: Schedule[]) {
  const map: Record<string, Schedule[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }
  schedules.forEach(s => {
    const d = new Date(s.startTime).getDay()
    const key = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d]
    if (key) map[key].push(s)
  })
  return map
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/* ──────────────── Page ──────────────── */
export default function TimetablePage() {
  const [tab, setTab] = useState<'timetable' | 'allocation'>('timetable')

  // Timetable state
  const [schedules, setSchedules]       = useState<Schedule[]>([])
  const [ttLoading, setTtLoading]       = useState(false)
  const [ttGenerating, setTtGenerating] = useState(false)
  const [ttClearing, setTtClearing]     = useState(false)
  const [ttMessage, setTtMessage]       = useState('')
  const [periodsPerDay, setPeriodsPerDay] = useState(8)
  const [clearExisting, setClearExisting] = useState(true)

  // Allocation state
  const [alloc, setAlloc]           = useState<AllocationResult | null>(null)
  const [allocLoading, setAllocLoading] = useState(false)
  const [applying, setApplying]     = useState(false)

  // Load existing timetable
  const loadSchedules = async () => {
    setTtLoading(true)
    try {
      const res = await fetch('/api/school-admin/timetable')
      if (res.ok) {
        const { schedules: data } = await res.json()
        setSchedules(data || [])
      }
    } finally { setTtLoading(false) }
  }

  useEffect(() => { loadSchedules() }, [])

  const generateTimetable = async () => {
    setTtGenerating(true)
    setTtMessage('')
    try {
      const res = await fetch('/api/school-admin/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodsPerDay, clearExisting, startHour: 8 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTtMessage(data.message)
      await loadSchedules()
    } catch (e: any) {
      setTtMessage(e.message || 'Failed to generate timetable')
    } finally { setTtGenerating(false) }
  }

  const clearTimetable = async () => {
    if (!confirm('Clear the entire timetable? This cannot be undone.')) return
    setTtClearing(true)
    try {
      await fetch('/api/school-admin/timetable', { method: 'DELETE' })
      setSchedules([])
      setTtMessage('Timetable cleared.')
    } finally { setTtClearing(false) }
  }

  const analyseAllocation = async () => {
    setAllocLoading(true)
    try {
      const res = await fetch('/api/school-admin/teacher-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyRecommendations: false }),
      })
      const data = await res.json()
      setAlloc(data)
    } finally { setAllocLoading(false) }
  }

  const applyRecommendations = async () => {
    if (!confirm('Apply the AI recommendations? This will reassign some classes.')) return
    setApplying(true)
    try {
      const res = await fetch('/api/school-admin/teacher-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyRecommendations: true }),
      })
      const data = await res.json()
      setAlloc(data)
    } finally { setApplying(false) }
  }

  const healthColor = (h: string) => {
    if (h === 'good')     return 'text-green-600 bg-green-50 border-green-200'
    if (h === 'warning')  return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const severityIcon = (s: string) => {
    if (s === 'high')   return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    if (s === 'medium') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
    return <Info className="h-4 w-4 text-blue-500 shrink-0" />
  }

  const daySchedules = groupByDay(schedules)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">AI-powered timetable generation and teacher allocation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['timetable', 'Auto Timetable', Calendar], ['allocation', 'Teacher Allocation', Users]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── TIMETABLE TAB ── */}
      {tab === 'timetable' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">AI Timetable Generator</h2>
                <p className="text-xs text-slate-500">Automatically schedule all classes conflict-free across the week</p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Periods per day</label>
                <select
                  value={periodsPerDay}
                  onChange={e => setPeriodsPerDay(Number(e.target.value))}
                  className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} periods</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={clearExisting} onChange={e => setClearExisting(e.target.checked)} className="rounded" />
                Clear existing timetable first
              </label>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={generateTimetable}
                disabled={ttGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
              >
                {ttGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {ttGenerating ? 'Generating...' : 'Generate AI Timetable'}
              </button>
              <button
                onClick={loadSchedules}
                disabled={ttLoading}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${ttLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              {schedules.length > 0 && (
                <button
                  onClick={clearTimetable}
                  disabled={ttClearing}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors ml-auto"
                >
                  <Trash2 className="h-4 w-4" /> Clear All
                </button>
              )}
            </div>

            {ttMessage && (
              <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${ttMessage.includes('Failed') || ttMessage.includes('No active') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <CheckCircle className="h-4 w-4 shrink-0" />
                {ttMessage}
              </div>
            )}
          </div>

          {/* Timetable grid */}
          {ttLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <Calendar className="h-14 w-14 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No timetable yet</p>
              <p className="text-slate-400 text-sm mt-1">Click "Generate AI Timetable" to create one automatically</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-slate-800">{schedules.length} lessons scheduled</p>
                <p className="text-xs text-slate-400">Current week</p>
              </div>
              <div className="grid grid-cols-5 divide-x divide-slate-100">
                {DAYS.map(day => (
                  <div key={day}>
                    <div className="bg-slate-50 px-3 py-2 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{day}</p>
                      <p className="text-xs text-slate-400">{daySchedules[day].length} lessons</p>
                    </div>
                    <div className="p-2 space-y-2 min-h-[200px]">
                      {daySchedules[day].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(s => (
                        <div key={s.id} className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                          <p className="font-semibold text-blue-800 truncate">{s.subject}</p>
                          <p className="text-blue-600 truncate">{s.class?.name}</p>
                          <p className="text-blue-400 flex items-center gap-1 mt-1">
                            <Clock className="h-2.5 w-2.5" />
                            {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                          </p>
                          <p className="text-slate-400 truncate">{s.teacher?.user ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ALLOCATION TAB ── */}
      {tab === 'allocation' && (
        <div className="space-y-5">
          {/* Analyse button */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Smart Teacher Allocation</h2>
                <p className="text-xs text-slate-500">AI analyses workload, subject expertise and student ratios to recommend optimal teacher assignments</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={analyseAllocation}
                disabled={allocLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
              >
                {allocLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {allocLoading ? 'Analysing...' : 'Analyse Allocation'}
              </button>
              {alloc?.recommendations?.length > 0 && (
                <button
                  onClick={applyRecommendations}
                  disabled={applying}
                  className="flex items-center gap-2 px-5 py-2.5 border border-purple-300 text-purple-700 text-sm font-semibold rounded-xl hover:bg-purple-50 disabled:opacity-60 transition-colors"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Apply Recommendations
                </button>
              )}
            </div>
          </div>

          {alloc && (
            <>
              {/* Health summary */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Classes / Teacher', value: alloc.stats?.avgClassesPerTeacher?.toFixed(1) || '—' },
                  { label: 'Avg Students / Teacher', value: alloc.stats?.avgStudentsPerTeacher?.toFixed(0) || '—' },
                  { label: 'Overloaded Teachers',    value: alloc.stats?.overloadedTeachers ?? 0 },
                  { label: 'Underutilised',          value: alloc.stats?.underutilisedTeachers ?? 0 },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${healthColor(alloc.overallHealth)}`}>
                {alloc.overallHealth === 'good' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-sm capitalize">{alloc.overallHealth} allocation health</p>
                  <p className="text-sm mt-0.5">{alloc.summary}</p>
                </div>
              </div>

              {/* Insights */}
              {alloc.insights?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" /> Insights
                  </h3>
                  <div className="space-y-3">
                    {alloc.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        {severityIcon(insight.severity)}
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{insight.teacherName}</p>
                          <p className="text-slate-500 text-sm">{insight.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {alloc.recommendations?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600" /> Recommendations
                  </h3>
                  <div className="space-y-3">
                    {alloc.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl">
                        <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rec.priority.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 text-sm font-medium capitalize">{rec.type.replace('_', ' ')}</p>
                          <p className="text-slate-500 text-sm">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher profiles */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" /> Teacher Workload Overview
                </h3>
                <div className="space-y-3">
                  {alloc.teacherProfiles?.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-4 rounded-xl border ${t.isOverloaded ? 'border-red-200 bg-red-50' : t.isUnderutilised ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {t.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.subjects.join(', ') || 'No subjects'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="text-center">
                          <p className="font-bold text-slate-800">{t.currentLoad}</p>
                          <p className="text-xs text-slate-400">Classes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-slate-800">{t.totalStudents}</p>
                          <p className="text-xs text-slate-400">Students</p>
                        </div>
                        {t.isOverloaded && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Overloaded</span>}
                        {t.isUnderutilised && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Under-utilised</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!alloc && !allocLoading && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <Brain className="h-14 w-14 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No analysis yet</p>
              <p className="text-slate-400 text-sm mt-1">Click "Analyse Allocation" to get AI recommendations</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
