'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, ChevronDown, ChevronUp, Clock, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface PendingItem {
  id: string
  studentId: string
  studentName: string
  assignmentId: string
  assignmentTitle: string
  subject: string
  totalMarks: number
  submittedAt: string
}

export default function QuickGradeWidget() {
  const { toast } = useToast()
  const [pending, setPending] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/teacher/pending-grading')
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending || [])
        const existing: Record<string, string> = {}
        setGrades(existing)
      }
    } catch (e) { console.warn('[QuickGrade] Failed to fetch pending:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  const submitGrade = async (submissionId: string, studentId: string) => {
    const score = grades[studentId]
    if (!score || isNaN(parseFloat(score))) return

    try {
      const res = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: pending.find(p => p.id === submissionId)?.assignmentId,
          marks: [{ studentId, score: parseFloat(score), feedback: '' }],
        }),
      })
      if (res.ok) {
        setPending(prev => prev.filter(p => p.id !== submissionId))
        setGrades(prev => { const next = { ...prev }; delete next[studentId]; return next })
        toast({ title: 'Grade saved' })
      }
    } catch {
      toast({ title: 'Failed to save grade', variant: 'destructive' })
    }
  }

  const saveAll = async () => {
    setSaving(true)
    const entries = Object.entries(grades).filter(([, v]) => v && !isNaN(parseFloat(v)))
    if (entries.length === 0) { setSaving(false); return }

    try {
      const byAssignment: Record<string, { studentId: string; score: number }[]> = {}
      entries.forEach(([studentId, score]) => {
        const item = pending.find(p => p.studentId === studentId)
        if (item) {
          const key = item.assignmentId
          if (!byAssignment[key]) byAssignment[key] = []
          byAssignment[key].push({ studentId, score: parseFloat(score) })
        }
      })

      for (const [assignmentId, marks] of Object.entries(byAssignment)) {
        await fetch('/api/teacher/gradebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignmentId, marks }),
        })
      }

      setPending(prev => prev.filter(p => !grades[p.studentId]))
      setGrades({})
      setSaved(true)
      toast({ title: `${entries.length} grades saved` })
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast({ title: 'Failed to save grades', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent, idx: number, studentId: string, submissionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitGrade(submissionId, studentId)
      const next = pending.filter(p => !grades[p.studentId] || !grades[p.studentId]!.trim())
      if (next.length > 0 && idx < next.length - 1) {
        setFocusedIdx(idx + 1)
        inputRefs.current[next[idx + 1].studentId]?.focus()
      }
    }
  }

  if (loading) return null
  if (pending.length === 0) return null

  const visible = expanded ? pending : pending.slice(0, 5)
  const gradedCount = Object.values(grades).filter(v => v && !isNaN(parseFloat(v))).length

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5 text-amber-500" />
          Quick Grade
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs ml-1">{pending.length} pending</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {gradedCount > 0 && (
            <Button size="sm" onClick={saveAll} disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8">
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
              Grade {gradedCount}
            </Button>
          )}
          <Link href="/teacher/gradebook">
            <Button variant="ghost" size="sm" className="text-xs">
              Full Gradebook <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {visible.map((item, idx) => {
          const isFocused = idx === focusedIdx
          return (
            <div key={item.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isFocused ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => { setFocusedIdx(idx); inputRefs.current[item.studentId]?.focus() }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.studentName}</p>
                <p className="text-xs text-gray-400 truncate">{item.assignmentTitle} · Max {item.totalMarks}</p>
              </div>
              <input
                ref={el => { inputRefs.current[item.studentId] = el }}
                type="number"
                min={0} max={item.totalMarks}
                value={grades[item.studentId] || ''}
                onChange={e => setGrades(p => ({ ...p, [item.studentId]: e.target.value }))}
                onKeyDown={e => handleKeyDown(e, idx, item.studentId, item.id)}
                onFocus={() => setFocusedIdx(idx)}
                placeholder="—"
                className={`w-16 h-8 px-2 text-center border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 shrink-0 ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
              />
              {grades[item.studentId] && !isNaN(parseFloat(grades[item.studentId])) && (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600" onClick={() => submitGrade(item.id, item.studentId)} title="Submit grade">
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          )
        })}
        {pending.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 mt-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {expanded ? 'Show less' : `Show ${pending.length - 5} more`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
