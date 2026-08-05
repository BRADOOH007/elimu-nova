'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList, Brain, Save, RefreshCw, CheckCircle,
  TrendingUp, TrendingDown, AlertTriangle, Sparkles, Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ClassInfo { id: string; name: string; grade: string; subject: string; studentCount: number }
interface Submission { id: string; studentId: string; studentName: string; grade: number | null; status: string }
interface Assignment { id: string; title: string; subject: string; totalMarks: number; submissions: Submission[] }

interface AIAnalysis {
  summary: string; performanceLabel: string
  strengths: string[]; concerns: string[]; recommendations: string[]
  stats: { avg: string; max: number; min: number; below: number; above: number; total: number }
}

export default function MarksPage() {
  const { toast } = useToast()
  const [classes,      setClasses]      = useState<ClassInfo[]>([])
  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [selectedAsn,  setSelectedAsn]  = useState('')
  const [marks,        setMarks]        = useState<Record<string, string>>({})
  const [feedback,     setFeedback]     = useState<Record<string, string>>({})
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [analysing,    setAnalysing]    = useState(false)
  const [analysis,     setAnalysis]     = useState<AIAnalysis | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher/marks')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load marks')
        return r.json()
      })
      .then(d => {
        setClasses(d.classes || [])
        setAssignments(d.assignments || [])
        if (d.assignments?.length > 0) {
          setSelectedAsn(d.assignments[0].id)
          const existing: Record<string, string> = {}
          d.assignments[0].submissions.forEach((s: Submission) => {
            if (s.grade !== null) existing[s.studentId] = String(s.grade)
          })
          setMarks(existing)
        }
      })
      .catch(e => {
        console.error('[MARKS_LOAD]', e)
        setError('Failed to load marks. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  const currentAsn = assignments.find(a => a.id === selectedAsn)

  const handleSelectAsn = (id: string) => {
    setSelectedAsn(id)
    setAnalysis(null)
    setSaved(false)
    const asn = assignments.find(a => a.id === id)
    if (asn) {
      const existing: Record<string, string> = {}
      asn.submissions.forEach(s => { if (s.grade !== null) existing[s.studentId] = String(s.grade) })
      setMarks(existing)
    }
  }

  const saveFeedback = async (withAI = false) => {
    if (!selectedAsn) return
    if (withAI) setAnalysing(true); else setSaving(true)

    const marksArray = Object.entries(marks).map(([studentId, score]) => ({
      studentId,
      score: parseFloat(score) || 0,
      feedback: feedback[studentId] || '',
    }))

    try {
      const res  = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: selectedAsn, marks: marksArray, analyseWithAI: withAI }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save feedback' }))
        throw new Error(err.error || 'Failed to save feedback')
      }
      const data = await res.json()
      setSaved(true)
      if (data.analysis) setAnalysis(data.analysis)
      toast({ title: 'Feedback saved', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false); setAnalysing(false)
    }
  }

  const perfColor = (label: string) => {
    if (label === 'Excellent') return 'text-green-600 bg-green-50 border-green-200'
    if (label === 'Good')      return 'text-blue-600 bg-blue-50 border-blue-200'
    if (label === 'Average')   return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          Refresh page
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Results Review & Class Analysis</h1>
        <p className="text-slate-500 text-sm mt-0.5">All submissions are auto-graded by the system. Review scores and add feedback.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedAsn} onChange={e => handleSelectAsn(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-48">
          {assignments.length === 0 && <option value="">No assignments found</option>}
          {assignments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.subject})</option>)}
        </select>
      </div>

      {/* Marks table */}
      {currentAsn && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">{currentAsn.title}</p>
              <p className="text-xs text-slate-400">{currentAsn.subject} · {currentAsn.submissions.length} students · Max {currentAsn.totalMarks} marks</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveFeedback(false)} disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${saved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Feedback'}
              </button>
              <button onClick={() => saveFeedback(true)} disabled={analysing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all">
                {analysing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {analysing ? 'Analysing...' : 'Save Feedback + AI Analysis'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentAsn.submissions.map(sub => {
              const score = marks[sub.studentId]
              const numeric = parseFloat(score)
              return (
                <div key={sub.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">{sub.studentName.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{sub.studentName}</p>
                    <p className="text-xs text-slate-400">{sub.grade !== null ? 'Auto-graded' : sub.status}</p>
                  </div>
                  {sub.grade !== null && !isNaN(numeric) ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${numeric >= 80 ? 'bg-blue-100 text-blue-700' : numeric >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {numeric}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300 shrink-0">Pending auto-grade</span>
                  )}
                  <input
                    type="text"
                    value={feedback[sub.studentId] || ''}
                    onChange={e => setFeedback(p => ({ ...p, [sub.studentId]: e.target.value }))}
                    placeholder="Feedback (optional)"
                    className="w-48 h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 hidden sm:block"
                  />
                </div>
              )
            })}
            {currentAsn.submissions.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions for this assignment yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis results */}
      {analysis && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-slate-800">AI Exam Analysis</h3>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${perfColor(analysis.performanceLabel)}`}>
              {analysis.performanceLabel}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Average', value: `${analysis.stats.avg}%` },
              { label: 'Highest', value: `${analysis.stats.max}%` },
              { label: 'Lowest',  value: `${analysis.stats.min}%` },
              { label: 'Below 50%', value: `${analysis.stats.below}` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-slate-200">
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-slate-700 text-sm leading-relaxed">{analysis.summary}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Strengths
              </p>
              <ul className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Concerns
              </p>
              <ul className="space-y-1">
                {analysis.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" /> Recommendations
            </p>
            <ul className="space-y-1">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-purple-600 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
