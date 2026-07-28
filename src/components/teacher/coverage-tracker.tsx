'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, XCircle, BarChart3, Layers, BookOpen } from 'lucide-react'

interface CoverageProps {
  onClose: () => void
}

export default function CoverageTracker({ onClose }: CoverageProps) {
  const [schemes, setSchemes] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [curriculumTopics, setCurriculumTopics] = useState<any[]>([])
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)

  // Fetch all schemes
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes-of-work')
        if (res.ok) {
          const data = await res.json()
          setSchemes(data.schemesOfWork || [])
        }
      } catch (e) { console.warn('[Coverage] Failed to fetch schemes:', e) } finally { setLoadingSchemes(false) }
    }
    fetchSchemes()
  }, [])

  // Extract unique subjects + grades from schemes
  const subjectOptions = [...new Set(schemes.map(s => s.subject).filter(Boolean))].sort()
  const gradeOptions = [...new Set(schemes.map(s => s.grade).filter(Boolean))].sort()

  // Fetch curriculum topics when subject+grade selected
  useEffect(() => {
    if (!subject || !grade) { setCurriculumTopics([]); return }
    const fetchCurriculum = async () => {
      setLoadingCurriculum(true)
      try {
        const res = await fetch('/api/curriculum/auto-populate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, subject, term: 1 }),
        })
        if (res.ok) {
          const data = await res.json()
          setCurriculumTopics(data.topics || [])
        }
      } catch (e) { console.warn('[Coverage] Failed to fetch curriculum:', e) } finally { setLoadingCurriculum(false) }
    }
    fetchCurriculum()
  }, [subject, grade])

  // Flatten all covered substrand names from matching schemes
  const matchingSchemes = schemes.filter(s => s.subject === subject && s.grade === grade)
  const coveredTopics = new Set<string>()
  matchingSchemes.forEach(scheme => {
    try {
      const content = typeof scheme.content === 'string' ? JSON.parse(scheme.content) : scheme.content
      if (content.weeks) {
        content.weeks.forEach((w: any) => {
          w.lessons?.forEach((l: any) => {
            if (l.topic) coveredTopics.add(l.topic.trim().toLowerCase())
            if (l.subStrand) coveredTopics.add(l.subStrand.trim().toLowerCase())
          })
        })
      }
      if (content.topics) {
        content.topics.forEach((t: any) => {
          if (typeof t === 'string') coveredTopics.add(t.trim().toLowerCase())
          else if (t.subStrand) coveredTopics.add(t.subStrand.trim().toLowerCase())
        })
      }
    } catch (e) { console.warn('[Coverage] Failed to parse scheme content:', e) }
  })
  // Also check SchemeTopic records
  const schemeTopics = matchingSchemes.flatMap(s => (s as any).topics || [])
  schemeTopics.forEach((t: any) => {
    if (t.title) coveredTopics.add(t.title.trim().toLowerCase())
  })

  // Flatten curriculum into covered/uncovered
  const allSubstrands = curriculumTopics.flatMap((strand: any) =>
    strand.substrands?.map((ss: any) => ({
      strandName: strand.strandName,
      name: ss.name,
      covered: coveredTopics.has(ss.name.trim().toLowerCase()),
      learningOutcomesCount: ss.learningOutcomes?.length || 0,
    })) || []
  )

  const covered = allSubstrands.filter(s => s.covered)
  const uncovered = allSubstrands.filter(s => !s.covered)
  const total = allSubstrands.length
  const pct = total > 0 ? Math.round((covered.length / total) * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Topic Coverage Analysis</h2>
        <p className="text-sm text-slate-500">
          See which CBC topics you&apos;ve covered with schemes of work and which still need attention
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Subject</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Grade</label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>
              {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Schemes Found</label>
          <div className="h-10 flex items-center px-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
            {loadingSchemes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {matchingSchemes.length} schemes for {subject && grade ? `${subject} ${grade}` : 'selected filters'}
          </div>
        </div>
      </div>

      {/* Results */}
      {subject && grade && (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
              <Layers className="h-4 w-4 mr-1" /> {total} total substrands
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 mr-1" /> {covered.length} covered
            </Badge>
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 px-3 py-1.5">
              <XCircle className="h-4 w-4 mr-1" /> {uncovered.length} uncovered
            </Badge>
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5">
              <BarChart3 className="h-4 w-4 mr-1" /> {pct}% coverage
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {loadingCurriculum ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : total === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No CBC curriculum data available for {subject} {grade}.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 border rounded-2xl p-4">
              {curriculumTopics.map((strand: any) => (
                <div key={strand.strandName}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{strand.strandName}</p>
                  <div className="grid gap-1.5">
                    {strand.substrands?.map((ss: any) => {
                      const isCovered = coveredTopics.has(ss.name.trim().toLowerCase())
                      return (
                        <div
                          key={ss.name}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            isCovered ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {isCovered
                            ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            : <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                          }
                          <span className={isCovered ? 'text-green-800 font-medium' : 'text-slate-500'}>
                            {ss.name}
                          </span>
                          <Badge variant="outline" className="ml-auto text-[10px] bg-white">
                            {ss.learningOutcomes?.length || 0} outcomes
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </>
      )}
    </div>
  )
}
