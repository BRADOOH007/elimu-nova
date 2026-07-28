'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3, Save, Download, Loader2, CheckCircle, Users, BookOpen, ClipboardList,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Keyboard
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface Student { id: string; firstName: string; lastName: string }
interface Submission { id: string; studentId: string; grade: number | null; student: { user: { firstName: string; lastName: string } } }
interface Assignment { id: string; title: string; subject: string; totalMarks: number; submissions: Submission[] }
interface ClassInfo { id: string; name: string; grade: string; subject: string; studentCount: number }

const DIST_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4']

export default function GradebookPage() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedAsn, setSelectedAsn] = useState('')
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [focusIndex, setFocusIndex] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch('/api/teacher/gradebook')
      .then(r => r.json())
      .then(d => {
        setClasses(d.classes || [])
        setAssignments(d.assignments || [])
        setStats(d.stats)
        if (d.assignments?.length > 0) {
          setSelectedAsn(d.assignments[0].id)
          const existing: Record<string, string> = {}
          d.assignments[0].submissions.forEach((s: Submission) => {
            if (s.grade !== null) existing[s.studentId] = String(s.grade)
          })
          setMarks(existing)
        }
      })
      .catch(() => toast({ title: 'Failed to load gradebook', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  const currentAsn = assignments.find(a => a.id === selectedAsn)
  const submissions = currentAsn?.submissions || []

  const handleSelect = (id: string) => {
    setSelectedAsn(id)
    setSaved(false)
    const asn = assignments.find(a => a.id === id)
    if (asn) {
      const existing: Record<string, string> = {}
      asn.submissions.forEach(s => { if (s.grade !== null) existing[s.studentId] = String(s.grade) })
      setMarks(existing)
    }
    setFocusIndex(0)
  }

  const setGrade = (studentId: string, value: string) => {
    setMarks(p => ({ ...p, [studentId]: value }))
    setSaved(false)
  }

  const saveMarks = async () => {
    if (!selectedAsn) return
    setSaving(true)
    try {
      const marksArray = Object.entries(marks).map(([studentId, score]) => ({
        studentId,
        score: parseFloat(score) || 0,
      }))
      const res = await fetch('/api/teacher/gradebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: selectedAsn, marks: marksArray }),
      })
      if (res.ok) {
        setSaved(true)
        toast({ title: 'Grades saved successfully' })
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error saving grades', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const next = Math.min(idx + 1, submissions.length - 1)
      setFocusIndex(next)
      inputRefs.current[submissions[next]?.studentId]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(idx - 1, 0)
      setFocusIndex(prev)
      inputRefs.current[submissions[prev]?.studentId]?.focus()
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (idx === submissions.length - 1) {
        e.preventDefault()
        inputRefs.current[submissions[0]?.studentId]?.focus()
        setFocusIndex(0)
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (idx === 0) {
        e.preventDefault()
        const last = submissions.length - 1
        inputRefs.current[submissions[last]?.studentId]?.focus()
        setFocusIndex(last)
      }
    }
  }

  const exportCSV = () => {
    if (!currentAsn) return
    const rows = [
      ['Student', 'Score'],
      ...submissions.map(s => [
        `${s.student.user.firstName} ${s.student.user.lastName}`,
        marks[s.studentId] || '',
      ]),
      [],
      ['Grade Distribution'],
      ...((stats?.gradeDistribution || []).map((d: any) => [d.range, String(d.count)])),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${currentAsn.title.replace(/\s+/g, '_')}_grades.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const applyCurve = (points: number) => {
    setMarks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => {
        const v = parseFloat(next[id])
        if (!isNaN(v)) next[id] = String(Math.min(100, Math.max(0, v + points)))
      })
      return next
    })
    setSaved(false)
  }

  const bulkPass = () => {
    const threshold = 50
    setMarks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => {
        const v = parseFloat(next[id])
        if (!isNaN(v) && v < threshold) next[id] = String(threshold)
      })
      return next
    })
    setSaved(false)
  }

  const graded = submissions.filter(s => marks[s.studentId] && marks[s.studentId] !== '')
  const numericGrades = graded.map(s => parseFloat(marks[s.studentId])).filter(v => !isNaN(v))
  const avg = numericGrades.length > 0 ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1) : '—'
  const maxGrade = numericGrades.length > 0 ? Math.max(...numericGrades) : 0
  const minGrade = numericGrades.length > 0 ? Math.min(...numericGrades) : 0
  const passed = numericGrades.filter(v => v >= 50).length
  const failed = numericGrades.length - passed
  const passingRate = numericGrades.length > 0 ? Math.round((passed / numericGrades.length) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Gradebook</h1>
          <p className="text-sm text-gray-500">Keyboard-navigable grade entry with live stats and analysis</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
          <Keyboard className="w-4 h-4 mr-2" /> Shortcuts
        </Button>
      </div>

      {showGuide && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4 text-sm space-y-1">
            <p><kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border">Tab</kbd> Next student</p>
            <p><kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border">Shift+Tab</kbd> Previous student</p>
            <p><kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border">↓</kbd> Navigate students</p>
            <p><kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border">Enter</kbd> Move to next student</p>
          </CardContent>
        </Card>
      )}

      {/* Grade Distribution + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.gradeDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats?.gradeDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Live Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Average', value: avg !== '—' ? `${avg}%` : avg, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Highest', value: maxGrade !== 0 ? `${maxGrade}%` : '—', icon: ChevronUp, color: 'text-green-600' },
              { label: 'Lowest', value: minGrade !== 0 ? `${minGrade}%` : '—', icon: ChevronDown, color: 'text-red-600' },
              { label: 'Passing Rate', value: numericGrades.length > 0 ? `${passingRate}%` : '—', icon: CheckCircle, color: passingRate >= 50 ? 'text-green-600' : 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{s.label}</span>
                <div className="flex items-center gap-1">
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="font-bold text-sm text-gray-900">{s.value}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t flex justify-between text-xs text-gray-500">
              <span><Users className="w-3 h-3 inline mr-1" />{numericGrades.length} graded</span>
              <span className="text-green-600">{passed} passed</span>
              <span className="text-red-600">{failed} failed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={selectedAsn} onChange={e => handleSelect(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-48">
          {assignments.length === 0 && <option value="">No assignments</option>}
          {assignments.map(a => (
            <option key={a.id} value={a.id}>{a.title} ({a.subject}) · {a.submissions.length} students · Max {a.totalMarks}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => applyCurve(5)} title="Add 5 points to all grades">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Curve +5
          </Button>
          <Button variant="outline" size="sm" onClick={bulkPass} title="Set all below 50 to 50">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Min 50
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
          <Button onClick={saveMarks} disabled={saving || !selectedAsn}
            className={`${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'} text-white`}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save All'}
          </Button>
        </div>
      </div>

      {/* Grade Table */}
      {currentAsn && (
        <Card className="border-0 shadow-lg">
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="w-8" />
              <div className="flex-1">Student</div>
              <div className="w-20 text-center">Score / {currentAsn.totalMarks}</div>
              <div className="w-24 text-center">Status</div>
              <div className="w-16 text-center">%</div>
            </div>
            {submissions.map((sub, idx) => {
              const score = marks[sub.studentId]
              const numeric = parseFloat(score)
              const pct = !isNaN(numeric) && currentAsn.totalMarks > 0 ? Math.round((numeric / currentAsn.totalMarks) * 100) : 0
              const name = `${sub.student.user.firstName} ${sub.student.user.lastName}`
              const isFocused = idx === focusIndex

              return (
                <div key={sub.id}
                  className={`flex items-center gap-4 px-5 py-2.5 transition-colors ${isFocused ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => { setFocusIndex(idx); inputRefs.current[sub.studentId]?.focus() }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">{name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{name}</p>
                  </div>
                  <input
                    ref={el => { inputRefs.current[sub.studentId] = el }}
                    type="number"
                    min={0} max={currentAsn.totalMarks}
                    value={score || ''}
                    onChange={e => setGrade(sub.studentId, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    onFocus={() => setFocusIndex(idx)}
                    placeholder="—"
                    className={`w-20 h-9 px-2 text-center border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 shrink-0 ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
                  />
                  <div className="w-24 text-center">
                    {score && !isNaN(numeric) ? (
                      <Badge className={`border-0 text-xs ${pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {pct >= 80 ? 'Excellent' : pct >= 50 ? 'Pass' : 'Fail'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                  <div className="w-16 text-center font-bold text-sm text-gray-800">
                    {score && !isNaN(numeric) ? `${pct}%` : '—'}
                  </div>
                </div>
              )
            })}
            {submissions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions for this assignment</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Overall summary */}
      {assignments.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-gray-600" />
              Overview — {assignments.length} assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Submissions', value: stats?.totalSubmissions || 0, icon: ClipboardList, color: 'text-blue-600' },
              { label: 'Graded', value: stats?.gradedSubmissions || 0, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Pending', value: stats?.pendingGrading || 0, icon: Loader2, color: 'text-amber-600' },
              { label: 'Overall Avg', value: stats?.averageGrade ? `${stats.averageGrade}%` : '—', icon: TrendingUp, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
