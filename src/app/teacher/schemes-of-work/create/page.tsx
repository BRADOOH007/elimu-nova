'use client'

import { useToast } from '@/hooks/use-toast'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES, getCurriculaByCountry, getSubjectsForCurriculum, getGradesForCurriculum } from '@/lib/curricula'
import DocumentUploadButton from '@/components/teacher/document-upload-button'
import {
  BookOpen, ChevronRight, ChevronLeft, CheckCircle, Loader2,
  FileText, Presentation, Download, Sparkles, Plus, Trash2,
  Calendar, Settings, Zap, NotebookPen, Upload
} from 'lucide-react'

// Import CBC curriculum data
import { grades1to9CurriculumByTerm } from '@/data/grades1-9CurriculumByTerm'

const TERMS = ['Term 1','Term 2','Term 3']

interface SelectedTopic { strand: string; subStrand: string }

interface KICDRow {
  week: number; lesson: number; strand: string; subStrand: string
  specificLearningOutcomes: string; keyInquiryQuestions: string[]
  learningExperiences: string[]; learningResources: string[]
  assessment: string; reflection: string; durationMinutes: number
}

export default function CreateSchemePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=Setup, 2=Topics, 3=Generate, 4=View
  const [schemeCountry, setSchemeCountry] = useState('KE')
  const [schemeCurriculum, setSchemeCurriculum] = useState('cbc')

  const SUBJECTS = getSubjectsForCurriculum(schemeCurriculum)
  const GRADES = getGradesForCurriculum(schemeCurriculum)

  // Step 1 — Setup
  const [subject, setSubject]         = useState('')
  const [grade, setGrade]             = useState('')
  const [term, setTerm]               = useState('Term 1')
  const [weeksCount, setWeeksCount]   = useState(13)
  const [lessonsPerWeek, setLessonsPerWeek] = useState(5)
  const [title, setTitle]             = useState('')

  // Step 2 — Topics
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopic[]>([])
  const [availableStrands, setAvailableStrands] = useState<any[]>([])

  // Step 3/4 — Generation
  const [generating, setGenerating]   = useState(false)
  const [schemeId, setSchemeId]       = useState<string | null>(null)
  const [rows, setRows]               = useState<KICDRow[]>([])
  const [error, setError]             = useState('')
  const [documentContext, setDocumentContext] = useState<string | null>(null)

  // Per-row actions
  const [generatingLesson, setGeneratingLesson] = useState<number | null>(null)
  const [generatingPptx, setGeneratingPptx]     = useState<number | null>(null)
  const [generatingNotes, setGeneratingNotes]   = useState<number | null>(null)
  const [lessonPlanIds, setLessonPlanIds]        = useState<Record<number, string>>({})
  const [notesReady, setNotesReady]             = useState<Record<number, boolean>>({})

  // Batch generation
  const [generatingAll, setGeneratingAll] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })
  // Load CBC strands when subject+grade changes — try API first, fall back to local data
  useEffect(() => {
    if (!subject || !grade) { setAvailableStrands([]); setTitle(''); return }

    const termNum = parseInt(term.replace('Term ', '')) as 1 | 2 | 3
    setTitle(`${subject} - ${grade} - ${term}`)

    const loadFromApi = async () => {
      try {
        const res = await fetch('/api/curriculum/auto-populate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, subject, term: termNum }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.topics && data.topics.length > 0) {
            // Convert API response to the strand format the UI expects
            const strands = data.topics.map((t: any) => ({
              name: t.strandName,
              subStrands: t.substrands.map((s: any) => ({ name: s.name })),
            }))
            setAvailableStrands(strands)
            return
          }
        }
      } catch (e) { console.warn('[SchemeCreate] Failed to fetch curriculum:', e) }
      // Fallback: local data file for Grades 1-9
      const gradeData = grades1to9CurriculumByTerm.find(
        g => g.grade === grade && g.term === termNum
      ) || grades1to9CurriculumByTerm.find(g => g.grade === grade)

      const subjectLower = subject.toLowerCase()
      const subjectData = gradeData?.learningAreas.find(la => {
        const laName = la.name.toLowerCase()
        return laName === subjectLower ||
               laName.includes(subjectLower) ||
               (subjectLower.includes(laName.split(' ')[0]) && laName.split(' ')[0].length > 3)
      })
      setAvailableStrands(subjectData?.strands || [])
    }
    loadFromApi()
  }, [subject, grade, term])

  const toggleSubStrand = (strand: string, subStrand: string) => {
    setSelectedTopics(prev => {
      const exists = prev.some(t => t.strand === strand && t.subStrand === subStrand)
      if (exists) return prev.filter(t => !(t.strand === strand && t.subStrand === subStrand))
      return [...prev, { strand, subStrand }]
    })
  }

  const selectAllStrands = () => {
    const all: SelectedTopic[] = []
    availableStrands.forEach(s => {
      s.subStrands?.forEach((ss: any) => all.push({ strand: s.name, subStrand: ss.name }))
    })
    setSelectedTopics(all)
  }

  const handleDocUploaded = (doc: { name: string; url: string; docType: string; extractedText?: string | null }) => {
    if (doc.extractedText) setDocumentContext(doc.extractedText)
  }

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res  = await fetch('/api/ai/generate-scheme-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, grade, term, weeksCount, lessonsPerWeek, selectedTopics, documentContext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setRows(data.rows)
      setSchemeId(data.scheme?.id || null)
      setStep(4)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateLesson = async (row: KICDRow, rowIndex: number) => {
    setGeneratingLesson(rowIndex)
    try {
      const res  = await fetch('/api/ai/generate-lesson-from-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeId, row, subject, grade }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLessonPlanIds(prev => ({ ...prev, [rowIndex]: data.lessonPlan.id }))
      toast({ title: "✅ Lesson plan created!" })
    } catch (e: any) {
      toast({ variant:"destructive", title: e.message })
    } finally {
      setGeneratingLesson(null)
    }
  }

  const generateAllLessons = async () => {
    const teachingRows = rows.filter(r => (r as any).type !== 'break' && (r as any).type !== 'revision' && (r as any).type !== 'exam')
    setGeneratingAll(true)
    setBatchProgress({ done: 0, total: teachingRows.length })
    let success = 0
    let failed = 0
    for (let i = 0; i < teachingRows.length; i++) {
      const originalIndex = rows.indexOf(teachingRows[i])
      try {
        const res = await fetch('/api/ai/generate-lesson-from-scheme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schemeId, row: teachingRows[i], subject, grade }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setLessonPlanIds(prev => ({ ...prev, [originalIndex]: data.lessonPlan.id }))
        success++
      } catch {
        failed++
      }
      setBatchProgress({ done: i + 1, total: teachingRows.length })
    }
    setGeneratingAll(false)
    if (failed > 0 && success === 0) {
      toast({ variant: 'destructive', title: 'Something went wrong' })
    }
  }

  const generatePptx = async (row: KICDRow, rowIndex: number) => {
    setGeneratingPptx(rowIndex)
    try {
      const lessonId = lessonPlanIds[rowIndex]
      const res = await fetch('/api/ai/generate-pptx-from-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlanId: lessonId, subject, grade, lessonContent: row }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${subject}_${row.subStrand.replace(/[^a-z0-9]/gi, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast({ variant:"destructive", title: e.message })
    } finally {
      setGeneratingPptx(null)
    }
  }

  const generateNotes = async (row: KICDRow, rowIndex: number) => {
    const lessonId = lessonPlanIds[rowIndex]
    if (!lessonId) { toast({ variant:'destructive', title:'Generate lesson plan first' }); return }
    setGeneratingNotes(rowIndex)
    try {
      // Fetch the lesson plan content first
      const planRes = await fetch(`/api/lesson-plans/${lessonId}`)
      if (!planRes.ok) throw new Error('Could not load lesson plan')
      const lessonPlan = await planRes.json()

      const res = await fetch('/api/ai/generate-lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlan, noteType: 'detailed' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Build text from structured notes
      const notes = data.notes
      const lines: string[] = []
      if (notes.title)   lines.push(notes.title, '')
      if (notes.summary) lines.push('SUMMARY', notes.summary, '')
      ;(notes.sections || []).forEach((s: any) => {
        lines.push(`\n${s.heading.toUpperCase()}`)
        if (s.content) lines.push(s.content)
        ;(s.keyPoints || []).forEach((p: string) => lines.push(`• ${p}`))
      })
      if (notes.importantPoints?.length) {
        lines.push('\nIMPORTANT POINTS')
        notes.importantPoints.forEach((p: string) => lines.push(`• ${p}`))
      }
      if (notes.studyTips?.length) {
        lines.push('\nSTUDY TIPS')
        notes.studyTips.forEach((t: string) => lines.push(`• ${t}`))
      }
      if (notes.nextSteps) lines.push(`\nNEXT STEPS\n${notes.nextSteps}`)
      if (notes.rawResponse) lines.push(notes.rawResponse)

      const text = lines.join('\n')
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${subject}_${row.subStrand.replace(/[^a-z0-9]/gi, '_')}_notes.txt`
      a.click()
      URL.revokeObjectURL(url)
      setNotesReady(prev => ({ ...prev, [rowIndex]: true }))
    } catch (e: any) {
      toast({ variant:"destructive", title: e.message })
    } finally {
      setGeneratingNotes(null)
    }
  }

  const downloadScheme = async () => {
    if (!schemeId) {
      toast({ variant:'destructive', title:'Generate scheme first' })
      return
    }
    // Open in new tab — teacher clicks Print / Save as PDF from the browser
    window.open(`/api/export/scheme-pdf?id=${schemeId}`, '_blank')
  }

  const totalLessons = weeksCount * lessonsPerWeek

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Scheme of Work</h1>
          <p className="text-slate-500 text-sm">CBC-aligned KICD format with AI-powered lesson generation</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {['Setup', 'Topics', 'Generate', 'View & Export'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' :
              'bg-slate-200 text-slate-400'
            }`}>
              {step > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
            {i < 3 && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Setup ── */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Settings className="h-4 w-4" /> Scheme Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={schemeCountry} onValueChange={(v) => { setSchemeCountry(v); setSchemeCurriculum(''); setSubject(''); setGrade('') }}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Curriculum</Label>
              <Select value={schemeCurriculum} onValueChange={(v) => { setSchemeCurriculum(v); setSubject(''); setGrade('') }}>
                <SelectTrigger><SelectValue placeholder="Select curriculum" /></SelectTrigger>
                <SelectContent>
                  {getCurriculaByCountry(schemeCountry).map(cur => <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grade *</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue placeholder="Term 1" /></SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Weeks in Term</Label>
              <Select value={String(weeksCount)} onValueChange={v => setWeeksCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10,11,12,13,14].map(n => <SelectItem key={n} value={String(n)}>{n} weeks</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lessons Per Week</Label>
              <Select value={String(lessonsPerWeek)} onValueChange={v => setLessonsPerWeek(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n} lessons/week</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Scheme Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto-generated from selections" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <strong>{totalLessons} lessons</strong> will be generated across {weeksCount} weeks
          </div>
          <Button onClick={() => setStep(2)} disabled={!subject || !grade}
            className="bg-gradient-to-r from-blue-600 to-purple-600">
            Next: Select Topics <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Topic Picker ── */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Select Topics</h2>
            <div className="flex gap-2">
              <button onClick={selectAllStrands} className="text-xs text-blue-600 hover:underline">Select All</button>
              <button onClick={() => setSelectedTopics([])} className="text-xs text-slate-400 hover:underline">Clear</button>
            </div>
          </div>

          <p className="text-xs text-slate-400">{selectedTopics.length} topics selected</p>

          {availableStrands.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableStrands.map(strand => (
                <div key={strand.name}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{strand.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {strand.subStrands?.map((ss: any) => {
                      const isSelected = selectedTopics.some(t => t.strand === strand.name && t.subStrand === ss.name)
                      return (
                        <button key={ss.name} onClick={() => toggleSubStrand(strand.name, ss.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected ? 'bg-blue-600 text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}>
                          {ss.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No CBC topic data available for {subject} {grade}.</p>
              <p className="text-xs mt-1">The AI will generate appropriate topics automatically.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Next: Generate <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Generate ── */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-bold text-slate-800 text-xl">Ready to Generate</h2>
          <div className="text-left bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 space-y-2 max-w-sm mx-auto">
            {[
              { label: 'Subject', value: subject },
              { label: 'Grade', value: grade },
              { label: 'Term', value: term },
              { label: 'Total lessons', value: `${totalLessons} (${weeksCount} weeks × ${lessonsPerWeek}/week)` },
              { label: 'Topics selected', value: selectedTopics.length > 0 ? `${selectedTopics.length} sub-strands` : 'AI will select' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-medium text-slate-800">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            <DocumentUploadButton
              docType="scheme-of-work"
              label="Upload Reference"
              onUploaded={handleDocUploaded}
            />
            {documentContext && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Reference loaded
              </span>
            )}
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={generate} disabled={generating} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...</> : <><Zap className="h-4 w-4 mr-1" /> Generate Scheme</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: View & Export ── */}
      {step === 4 && rows.length > 0 && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-slate-500">{rows.length} lessons generated</p>
            <div className="flex items-center gap-2">
              {generatingAll && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {batchProgress.done}/{batchProgress.total} lesson plans
                </span>
              )}
              <Button onClick={generateAllLessons} disabled={generatingAll} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {generatingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                {generatingAll ? 'Generating...' : 'Generate All Plans'}
              </Button>
              <Button onClick={downloadScheme} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-1" /> Download Scheme (HTML/PDF)
              </Button>
              <Button variant="outline" onClick={() => router.push('/teacher/schemes-of-work')}>
                View All Schemes
              </Button>
            </div>
          </div>

          {/* KICD Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {['Wk','Lsn','Strand','Sub-Strand','Specific Learning Outcomes','Resources','Assessment','Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => {
                    // Break / holiday / exam row — spans full width
                    if ((row as any).type === 'break' || (row as any).type === 'revision' || (row as any).type === 'exam') {
                      return (
                        <tr key={i} className="bg-amber-50 border-l-4 border-amber-400">
                          <td className="px-3 py-2 font-bold text-amber-700">{row.week}</td>
                          <td colSpan={7} className="px-3 py-2 text-center font-semibold text-amber-700 tracking-wide uppercase text-xs">
                            {(row as any).breakReason || row.specificLearningOutcomes}
                          </td>
                        </tr>
                      )
                    }
                    return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 font-bold text-slate-700">{row.week}</td>
                      <td className="px-3 py-2 text-slate-600">{row.lesson}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[100px]">{row.strand}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[120px]">{row.subStrand}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[200px]">{row.specificLearningOutcomes}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-[100px]">
                        {Array.isArray(row.learningResources) ? row.learningResources.slice(0,2).join(', ') : row.learningResources}
                      </td>
                      <td className="px-3 py-2 text-slate-500 max-w-[100px]">{row.assessment}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          {/* 1. Generate Lesson Plan */}
                          <Button
                            onClick={() => generateLesson(row, i)}
                            disabled={generatingLesson === i}
                            title="Generate Lesson Plan"
                            size="sm"
                            className={`text-[10px] h-6 px-2 ${
                              lessonPlanIds[i]
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } shadow-none`}>
                            {generatingLesson === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                            {lessonPlanIds[i] ? '✓ Plan' : 'Plan'}
                          </Button>
                          {/* 2. Generate PowerPoint */}
                          <Button
                            onClick={() => generatePptx(row, i)}
                            disabled={generatingPptx === i || !lessonPlanIds[i]}
                            title={lessonPlanIds[i] ? 'Generate PowerPoint' : 'Generate lesson plan first'}
                            size="sm"
                            className="text-[10px] h-6 px-2 bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-none">
                            {generatingPptx === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Presentation className="h-3 w-3 mr-1" />}
                            PPTX
                          </Button>
                          {/* 3. Generate Student Notes */}
                          <Button
                            onClick={() => generateNotes(row, i)}
                            disabled={generatingNotes === i || !lessonPlanIds[i]}
                            title={lessonPlanIds[i] ? 'Generate Student Notes' : 'Generate lesson plan first'}
                            size="sm"
                            className={`text-[10px] h-6 px-2 ${
                              notesReady[i]
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            } shadow-none`}>
                            {generatingNotes === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <NotebookPen className="h-3 w-3 mr-1" />}
                            {notesReady[i] ? '✓ Notes' : 'Notes'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Click <strong>Plan</strong> to generate a detailed lesson plan → <strong>PPTX</strong> to create a PowerPoint with AI images → <strong>Notes</strong> to generate downloadable student notes.
          </p>
        </div>
      )}
    </div>
  )
}
