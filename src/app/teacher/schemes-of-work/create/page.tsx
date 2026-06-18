'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, ChevronRight, ChevronLeft, CheckCircle, Loader2,
  FileText, Presentation, Download, Sparkles, Plus, Trash2,
  Calendar, Settings, Zap
} from 'lucide-react'

// Import CBC curriculum data
import { grades1to9CurriculumByTerm } from '@/data/grades1-9CurriculumByTerm'

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE',
  'Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies',
  'Computer Studies','Music','Art & Craft','Physical Education','Home Science','Pre-Technical Studies']

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

const TERMS = ['Term 1','Term 2','Term 3']

interface SelectedTopic { strand: string; subStrand: string }

interface KICDRow {
  week: number; lesson: number; strand: string; subStrand: string
  specificLearningOutcomes: string; keyInquiryQuestions: string[]
  learningExperiences: string[]; learningResources: string[]
  assessment: string; reflection: string; durationMinutes: number
}

export default function CreateSchemePage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=Setup, 2=Topics, 3=Generate, 4=View

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

  // Per-row actions
  const [generatingLesson, setGeneratingLesson] = useState<number | null>(null)
  const [generatingPptx, setGeneratingPptx]     = useState<number | null>(null)
  const [lessonPlanIds, setLessonPlanIds]        = useState<Record<number, string>>({})

  // Load CBC strands when subject+grade changes
  useEffect(() => {
    if (!subject || !grade) return
    const gradeData = grades1to9CurriculumByTerm.find(
      g => g.grade === grade && g.term === 1
    )
    const subjectData = gradeData?.learningAreas.find(
      la => la.name.toLowerCase().includes(subject.toLowerCase()) ||
            subject.toLowerCase().includes(la.name.toLowerCase().split(' ')[0])
    )
    if (subjectData) {
      setAvailableStrands(subjectData.strands || [])
    } else {
      setAvailableStrands([])
    }
    setTitle(`${subject} - ${grade} - ${term}`)
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

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res  = await fetch('/api/ai/generate-scheme-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, grade, term, weeksCount, lessonsPerWeek, selectedTopics }),
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
      alert(`✅ Lesson plan created: "${data.lessonPlan.title}"`)
    } catch (e: any) {
      alert(`❌ ${e.message}`)
    } finally {
      setGeneratingLesson(null)
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
      alert(`❌ ${e.message}`)
    } finally {
      setGeneratingPptx(null)
    }
  }

  const downloadScheme = async () => {
    if (!schemeId) return
    window.open(`/api/export/scheme-pdf?id=${schemeId}`, '_blank')
  }

  const totalLessons = weeksCount * lessonsPerWeek

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade *</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Weeks in Term</label>
              <select value={weeksCount} onChange={e => setWeeksCount(Number(e.target.value))}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[10,11,12,13,14].map(n => <option key={n} value={n}>{n} weeks</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lessons Per Week</label>
              <select value={lessonsPerWeek} onChange={e => setLessonsPerWeek(Number(e.target.value))}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[3,4,5,6].map(n => <option key={n} value={n}>{n} lessons/week</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheme Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Auto-generated from selections"
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <strong>{totalLessons} lessons</strong> will be generated across {weeksCount} weeks
          </div>
          <button onClick={() => setStep(2)} disabled={!subject || !grade}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
            Next: Select Topics <ChevronRight className="h-4 w-4" />
          </button>
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
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all">
              Next: Generate <ChevronRight className="h-4 w-4" />
            </button>
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
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={generate} disabled={generating}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-60 transition-all">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Zap className="h-4 w-4" /> Generate Scheme</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: View & Export ── */}
      {step === 4 && rows.length > 0 && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-slate-500">{rows.length} lessons generated</p>
            <div className="flex gap-2">
              <button onClick={downloadScheme}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <Download className="h-4 w-4" /> Download Scheme (HTML/PDF)
              </button>
              <button onClick={() => router.push('/teacher/schemes-of-work')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">
                View All Schemes
              </button>
            </div>
          </div>

          {/* KICD Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {['Wk','Lsn','Strand','Sub-Strand','Specific Learning Outcomes','Resources','Assessment','Generate'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
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
                        <div className="flex gap-1">
                          {/* Generate Lesson Plan */}
                          <button
                            onClick={() => generateLesson(row, i)}
                            disabled={generatingLesson === i}
                            title="Generate Lesson Plan"
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors ${
                              lessonPlanIds[i]
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } disabled:opacity-50`}>
                            {generatingLesson === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                            {lessonPlanIds[i] ? 'Done' : 'Plan'}
                          </button>
                          {/* Generate PowerPoint */}
                          <button
                            onClick={() => generatePptx(row, i)}
                            disabled={generatingPptx === i || !lessonPlanIds[i]}
                            title={lessonPlanIds[i] ? 'Generate PowerPoint' : 'Generate lesson plan first'}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-40 transition-colors">
                            {generatingPptx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Presentation className="h-3 w-3" />}
                            PPTX
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Click <strong>Plan</strong> to generate a detailed lesson plan for any row, then <strong>PPTX</strong> to create a PowerPoint with AI images.
          </p>
        </div>
      )}
    </div>
  )
}
