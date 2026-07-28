'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookMarked, BookOpen, Layers, CheckCircle, GraduationCap, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
const TERMS = ['Term 1','Term 2','Term 3']

export default function StudentCurriculum() {
  const [grade, setGrade] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [curriculumData, setCurriculumData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [expandedStrand, setExpandedStrand] = useState<string | null>(null)

  // Fetch subjects when grade changes
  useEffect(() => {
    if (!grade) { setSubjects([]); return }
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      try {
        const res = await fetch(`/api/curriculum/subjects?grade=${encodeURIComponent(grade)}`)
        if (res.ok) {
          const data = await res.json()
          setSubjects(data.subjects || [])
        }
      } catch (e) { console.warn('[StudentCurriculum] fetch subjects error:', e) } finally { setLoadingSubjects(false) }
    }
    fetchSubjects()
  }, [grade])

  // Fetch full curriculum when subject changes
  useEffect(() => {
    if (!grade || !selectedSubject) { setCurriculumData([]); return }
    const fetchData = async () => {
      setLoading(true)
      try {
        const termNum = parseInt(term.replace('Term ', ''))
        const res = await fetch('/api/curriculum/auto-populate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, subject: selectedSubject, term: termNum }),
        })
        if (res.ok) {
          const data = await res.json()
          setCurriculumData(data.topics || [])
        }
      } catch (e) { console.warn('[StudentCurriculum] fetch curriculum error:', e) } finally { setLoading(false) }
    }
    fetchData()
  }, [grade, selectedSubject, term])

  const totalSubstrands = curriculumData.reduce((acc: number, s: any) =>
    acc + (s.substrands?.length || 0), 0
  )
  const totalLearningOutcomes = curriculumData.reduce((acc: number, s: any) =>
    acc + (s.substrands?.reduce((a: number, ss: any) => a + (ss.learningOutcomes?.length || 0), 0) || 0), 0
  )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <BookMarked className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Curriculum Browser</h1>
          <p className="text-slate-500 text-sm">Explore the CBC curriculum — strands, substrands, and learning outcomes</p>
        </div>
      </div>

      {/* Grade + Term + Subject selector */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Grade</label>
              <Select value={grade} onValueChange={(v) => { setGrade(v); setSelectedSubject(null); setCurriculumData([]) }}>
                <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Term</label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Subject</label>
              {loadingSubjects ? (
                <div className="flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-lg border text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <Select value={selectedSubject || ''} onValueChange={setSelectedSubject} disabled={!grade}>
                  <SelectTrigger><SelectValue placeholder={grade ? 'Select subject...' : 'Pick a grade first'} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Curriculum view */}
      {!grade && (
        <div className="text-center py-16 text-slate-400">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Select a grade to start exploring</p>
          <p className="text-sm mt-1">Browse the full CBC curriculum organized by subject, strand, and substrand</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && selectedSubject && curriculumData.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No curriculum data found for {selectedSubject} {grade} {term}.</p>
        </div>
      )}

      {!loading && curriculumData.length > 0 && (
        <>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5 text-sm">
              <Layers className="h-4 w-4 mr-1" /> {curriculumData.length} Strands
            </Badge>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1.5 text-sm">
              <BookOpen className="h-4 w-4 mr-1" /> {totalSubstrands} Substrands
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> {totalLearningOutcomes} Learning Outcomes
            </Badge>
          </div>

          {/* Strands */}
          <div className="space-y-4">
            {curriculumData.map((strand: any) => (
              <Card key={strand.strandName} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSubject(expandedSubject === strand.strandName ? null : strand.strandName)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Layers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{strand.strandName}</h3>
                      <p className="text-xs text-slate-400">{strand.substrands?.length || 0} substrands</p>
                    </div>
                  </div>
                  {expandedSubject === strand.strandName ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {expandedSubject === strand.strandName && (
                  <div className="px-4 md:px-5 pb-5 space-y-3">
                    {strand.substrands?.map((sub: any) => {
                      const isSubExpanded = expandedStrand === sub.name
                      return (
                        <div key={sub.name} className="border border-slate-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedStrand(isSubExpanded ? null : sub.name)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                              <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                {sub.learningOutcomes?.length || 0} outcomes
                              </Badge>
                              {isSubExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>
                          </button>

                          {isSubExpanded && (
                            <div className="px-3 pb-3 space-y-2">
                              {sub.learningOutcomes?.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Learning Outcomes</p>
                                  <ul className="space-y-1">
                                    {sub.learningOutcomes.map((lo: string, li: number) => (
                                      <li key={li} className="text-xs text-slate-600 flex gap-2">
                                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                                        <span>{lo}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {sub.activities?.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 mt-3">Learning Activities</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sub.activities.map((act: string, ai: number) => (
                                      <Badge key={ai} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                        {act}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
