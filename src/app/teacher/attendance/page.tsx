'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, CheckCircle, X, Save, RefreshCw, Download, ChevronLeft, ChevronRight, BarChart3, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from 'lucide-react'

interface Student { id: string; name: string; class: string }
interface ClassInfo { id: string; name: string; grade: string }
interface AttendanceSummaryItem { id: string; name: string; present: number; absent: number; total: number; rate: number }
interface AttendanceStats { totalStudents: number; totalSessions: number; averageRate: number; above90: number; below75: number }

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
type Session = 'am' | 'pm'
type AttendanceGrid = Record<string, Record<string, boolean>> // studentId -> "mon_am" -> bool

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday'    },
  { key: 'tue', label: 'Tuesday'   },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday'  },
  { key: 'fri', label: 'Friday'    },
]

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AttendancePage() {
  const [students, setStudents]   = useState<Student[]>([])
  const [classes, setClasses]     = useState<ClassInfo[]>([])
  const [classId, setClassId]     = useState('')
  const [weekDate, setWeekDate]   = useState(getMonday(new Date()))
  const [grid, setGrid]           = useState<AttendanceGrid>({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [summary, setSummary]     = useState<AttendanceSummaryItem[]>([])
  const [summaryStats, setSummaryStats] = useState<AttendanceStats | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryWeeks, setSummaryWeeks] = useState(0)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ weekDate: weekDate.toISOString() })
      if (classId) params.set('classId', classId)
      const res  = await fetch(`/api/teacher/attendance?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
      if (!classId && data.classes?.length > 0) {
        setClasses(data.classes)
        setClassId(data.classes[0].id)
      } else {
        setClasses(data.classes || [])
      }
      // Load existing records into grid
      const existingGrid: AttendanceGrid = {}
      data.records?.forEach((r: any) => {
        const meta = r.metadata || {}
        Object.entries(meta).forEach(([sid, sessions]: any) => {
          existingGrid[sid] = sessions
        })
      })
      // Initialise grid for all students (absent by default)
      data.students?.forEach((s: Student) => {
        if (!existingGrid[s.id]) {
          existingGrid[s.id] = {}
          DAYS.forEach(d => {
            existingGrid[s.id][`${d.key}_am`] = false
            existingGrid[s.id][`${d.key}_pm`] = false
          })
        }
      })
      setGrid(existingGrid)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [classId, weekDate.toISOString()])

  const toggle = (studentId: string, key: string) => {
    setGrid(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [key]: !prev[studentId]?.[key] }
    }))
    setSaved(false)
  }

  const toggleAll = (key: string, value: boolean) => {
    setGrid(prev => {
      const next = { ...prev }
      students.forEach(s => { next[s.id] = { ...(next[s.id] || {}), [key]: value } })
      return next
    })
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, weekDate: weekDate.toISOString(), attendance: grid }),
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const loadSummary = async () => {
    if (!classId) return
    setSummaryLoading(true)
    try {
      const params = new URLSearchParams({ classId })
      const res = await fetch(`/api/teacher/attendance/summary?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary || [])
        setSummaryStats(data.stats || null)
        setSummaryWeeks(data.weeks || 0)
      }
    } catch (e) { console.warn('[Attendance] Failed to load summary:', e) }
    finally { setSummaryLoading(false) }
  }

  const toggleSummary = () => {
    if (!showSummary) loadSummary()
    setShowSummary(!showSummary)
  }

  const prevWeek = () => { const d = new Date(weekDate); d.setDate(d.getDate() - 7); setWeekDate(d) }
  const nextWeek = () => { const d = new Date(weekDate); d.setDate(d.getDate() + 7); setWeekDate(d) }

  const weekEnd = new Date(weekDate)
  weekEnd.setDate(weekEnd.getDate() + 4)

  // Summary counts
  const presentToday = (key: string) => students.filter(s => grid[s.id]?.[key]).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Register</h1>
          <p className="text-slate-500 text-sm mt-0.5">Mark AM and PM attendance for each school day</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving || saved}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'}`}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Register'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Class selector */}
        <select value={classId} onChange={e => setClassId(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
          {classes.length === 0 && <option value="">No classes</option>}
        </select>

        {/* Week navigator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={prevWeek} className="p-2 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 px-2">
            {fmtDate(weekDate)} – {fmtDate(weekEnd)}
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-slate-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" />
          {students.length} students
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No students in this class</p>
          <p className="text-slate-400 text-sm mt-1">Enroll students from the Students page first</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-48">Student</th>
                {DAYS.map(d => (
                  <th key={d.key} colSpan={2} className="px-2 py-3 text-center font-semibold text-slate-600 border-l border-slate-200">
                    <div>{d.label}</div>
                    <div className="flex gap-1 justify-center mt-1">
                      {(['am', 'pm'] as Session[]).map(s => (
                        <div key={s} className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 uppercase">{s}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            <button onClick={() => toggleAll(`${d.key}_${s}`, true)}
                              className="text-[9px] px-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">All</button>
                            <button onClick={() => toggleAll(`${d.key}_${s}`, false)}
                              className="text-[9px] px-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">None</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{student.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <span className="font-medium text-slate-800 truncate max-w-[120px]">{student.name}</span>
                    </div>
                  </td>
                  {DAYS.map(d => (
                    ['am', 'pm'].map(s => {
                      const key = `${d.key}_${s}`
                      const present = grid[student.id]?.[key] || false
                      return (
                        <td key={key} className="px-1 py-2 text-center border-l border-slate-100">
                          <button
                            onClick={() => toggle(student.id, key)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              present
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-red-50 text-red-400 hover:bg-red-100'
                            }`}
                          >
                            {present ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </button>
                        </td>
                      )
                    })
                  ))}
                </tr>
              ))}
            </tbody>
            {/* Summary row */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-200">
                <td className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide">Present count</td>
                {DAYS.map(d => (
                  ['am', 'pm'].map(s => {
                    const key = `${d.key}_${s}`
                    const count = presentToday(key)
                    const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0
                    return (
                      <td key={key} className="px-1 py-2 text-center border-l border-slate-200">
                        <div className={`text-xs font-bold ${pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                          {count}/{students.length}
                        </div>
                        <div className="text-[10px] text-slate-400">{pct}%</div>
                      </td>
                    )
                  })
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {/* Term Summary */}
      {classId && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <button onClick={toggleSummary} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-800">Term Attendance Summary</span>
              {summaryWeeks > 0 && <span className="text-xs text-slate-400">({summaryWeeks} weeks)</span>}
            </div>
            {showSummary ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showSummary && (
            <div className="border-t border-slate-100">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              ) : summary.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance records yet. Start marking weekly attendance above.</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Stats cards */}
                  {summaryStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Avg Attendance', value: `${summaryStats.averageRate}%`, icon: TrendingUp, color: `text-${summaryStats.averageRate >= 80 ? 'green' : summaryStats.averageRate >= 60 ? 'amber' : 'red'}-600` },
                        { label: 'Students ≥90%', value: summaryStats.above90.toString(), icon: CheckCircle, color: 'text-green-600' },
                        { label: 'Students <75%', value: summaryStats.below75.toString(), icon: AlertTriangle, color: 'text-red-600' },
                        { label: 'Total Sessions', value: summaryStats.totalSessions.toString(), icon: Calendar, color: 'text-blue-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                            <span className="text-xs text-slate-500">{s.label}</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">Student</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-600">Present</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-600">Absent</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-600">Total</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-600">Rate</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-600">Bar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((s, i) => (
                          <tr key={s.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                  <span className="text-white text-[10px] font-bold">{s.name.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                                <span className="font-medium text-slate-800">{s.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-green-700">{s.present}</td>
                            <td className="px-3 py-2 text-center font-medium text-red-600">{s.absent}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{s.total}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-sm font-bold ${s.rate >= 90 ? 'text-green-700' : s.rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                                {s.rate}%
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="w-24 h-2.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    s.rate >= 90 ? 'bg-green-500' : s.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${s.rate}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
