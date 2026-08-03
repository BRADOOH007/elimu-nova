'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2, GraduationCap, ChevronDown, ChevronUp, CheckCircle, Copy, Download,
  Brain, Sparkles, Filter, RotateCcw, Settings2, Eye, EyeOff, Check,
  AlertCircle, Hash, BookOpen, Layers, ChevronRight, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const SUBJECTS = [
  'Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE',
  'Agriculture','Physics','Chemistry','Biology','History','Geography',
  'Business Studies','Computer Studies','Home Science','Art & Design'
]
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

// Fallback topic suggestions when DB is empty
const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Mathematics: ['Whole Numbers','Fractions','Decimals','Percentages','Measurement','Geometry','Algebra','Data Handling','Money','Time','Length, Area & Volume','Mass & Capacity','Position & Direction','Tables & Graphs','Number Patterns','Ratios & Proportions','Scale Drawing','Circles'],
  English: ['Listening & Speaking','Reading Comprehension','Grammar','Writing Composition','Vocabulary Development','Spelling','Punctuation','Poetry','Oral Narratives','Letter Writing','Creative Writing','Functional Writing'],
  Kiswahili: ['Kusikiliza na Kuzungumza','Sarufi','Msamiati','Ufahamu','Insha','Matumizi ya Lugha','Fasihi Simulizi','Ushairi'],
  Science: ['Living Things','Plants','Animals','Human Body','Energy','Light','Sound','Forces & Motion','Materials','Weather','Water','Soil','Food & Nutrition','Health Education','Simple Machines','Electricity'],
  'Social Studies': ['Our Country','Our Environment','Resources','Transport','Communication','Culture','Government','Citizenship','History of Kenya','Map Reading','Population','Trade'],
  Agriculture: ['Crop Farming','Animal Keeping','Soil Preparation','Planting','Harvesting','Farm Tools'],
  Physics: ['Forces','Motion','Energy','Waves','Light','Electricity','Magnetism','Heat Transfer','Fluids','Sound'],
  Chemistry: ['States of Matter','Mixtures','Atoms & Elements','Chemical Reactions','Acids & Bases','Water & Solutions','Periodic Table'],
  Biology: ['Cells','Classification','Nutrition','Respiration','Transport Systems','Reproduction','Ecology','Genetics','Human Health'],
  History: ['Early Man','Agriculture in Kenya','Trade','Colonial Administration','Struggle for Independence','Constitution & Governance'],
  Geography: ['Map Work','Weather & Climate','Vegetation','Soils','Mining','Forestry','Fishing','Tourism','Population','Urbanization'],
  'Computer Studies': ['Computer Basics','Operating Systems','Word Processing','Spreadsheets','Internet','Programming Concepts','Database','Networking','Data Security'],
  CRE: ['Creation','The Bible','Jesus Christ','The Early Church','Christian Values','Faith & Prayer','Community Service'],
  'Business Studies': ['Business & Its Environment','Office Practice','Entrepreneurship','Money & Banking','Trade','Consumer Protection','Financial Records'],
}

const BLOOM_LEVELS = [
  { level: 'REMEMBER',   number: 1, icon: '🧠', color: 'blue',   skill: 'Recall facts and basic concepts' },
  { level: 'UNDERSTAND', number: 2, icon: '💡', color: 'emerald', skill: 'Explain ideas or concepts' },
  { level: 'APPLY',      number: 3, icon: '🔧', color: 'amber',  skill: 'Use information in new situations' },
  { level: 'ANALYZE',    number: 4, icon: '🔍', color: 'orange', skill: 'Draw connections among ideas' },
  { level: 'EVALUATE',   number: 5, icon: '⚖️', color: 'red',    skill: 'Justify a decision or course of action' },
  { level: 'CREATE',     number: 6, icon: '🎨', color: 'purple', skill: 'Produce new or original work' },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; gradient: string }> = {
  blue:   { bg: 'bg-blue-500',   text: 'text-blue-600',   border: 'border-blue-300',   light: 'bg-blue-50',   gradient: 'from-blue-500 to-blue-600' },
  emerald:{ bg: 'bg-emerald-500',text: 'text-emerald-600',border: 'border-emerald-300',light: 'bg-emerald-50',gradient: 'from-emerald-500 to-emerald-600' },
  amber:  { bg: 'bg-amber-500',  text: 'text-amber-600',  border: 'border-amber-300',  light: 'bg-amber-50',  gradient: 'from-amber-500 to-amber-600' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', light: 'bg-orange-50', gradient: 'from-orange-500 to-orange-600' },
  red:    { bg: 'bg-red-500',    text: 'text-red-600',    border: 'border-red-300',    light: 'bg-red-50',    gradient: 'from-red-500 to-red-600' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', light: 'bg-purple-50', gradient: 'from-purple-500 to-purple-600' },
}

interface BloomQuestion {
  level: string; levelNumber: number; cognitive_skill: string; question: string
  type: string; options?: string[]; correct_answer?: number; model_answer?: string; explanation: string
}

interface Strand { id: string; name: string }
interface SubStrand { id: string; name: string; learningOutcomes?: string[] }

export default function BloomsQuizGenerator() {
  const { toast } = useToast()

  // Form state
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [strand, setStrand] = useState('')
  const [strandId, setStrandId] = useState('')
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(6)
  const [questionType, setQuestionType] = useState<'mixed' | 'mcq' | 'open'>('mixed')

  // Cascading dropdown data
  const [strands, setStrands] = useState<Strand[]>([])
  const [substrands, setSubStrands] = useState<SubStrand[]>([])
  const [loadingStrands, setLoadingStrands] = useState(false)
  const [loadingSubStrands, setLoadingSubStrands] = useState(false)
  const [strandSource, setStrandSource] = useState<'db' | 'fallback'>('fallback')

  // Generation state
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<BloomQuestion[]>([])
  const [editedQuestions, setEditedQuestions] = useState<Record<number, Partial<BloomQuestion>>>({})

  // UI state
  const [activeTab, setActiveTab] = useState('all')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})
  const [showForm, setShowForm] = useState(true)

  // Fetch strands when grade + subject change
  useEffect(() => {
    if (!grade || !subject) { setStrands([]); setStrand(''); setStrandId(''); setSubStrands([]); setTopic(''); return }
    setLoadingStrands(true)
    fetch(`/api/curriculum/strands?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      .then(r => r.ok ? r.json() : { strands: [] })
      .then(d => {
        const db = (d.strands || []).map((s: any) => ({ id: s.id, name: s.name }))
        const fallback = (TOPIC_SUGGESTIONS[subject] || []).map((t, i) => ({ id: `fb-${i}`, name: t }))
        // Merge: DB first, then fallback topics that aren't already present
        const all = [...db]
        fallback.forEach(f => { if (!all.some(a => a.name.toLowerCase() === f.name.toLowerCase())) all.push(f) })
        setStrands(all)
        setStrandSource(db.length > 0 ? 'db' : 'fallback')
        setStrand(''); setStrandId(''); setSubStrands([]); setTopic('')
      })
      .catch(() => {
        // Use fallback only
        const fallback = (TOPIC_SUGGESTIONS[subject] || []).map((t, i) => ({ id: `fb-${i}`, name: t }))
        setStrands(fallback)
        setStrandSource('fallback')
        setStrand(''); setStrandId(''); setSubStrands([]); setTopic('')
      })
      .finally(() => setLoadingStrands(false))
  }, [grade, subject])

  // Fetch substrands when strand changes (only for DB strands)
  useEffect(() => {
    if (!strandId || strandId.startsWith('fb-')) { setSubStrands([]); setTopic(''); return }
    let cancelled = false
    setLoadingSubStrands(true)
    fetch(`/api/curriculum/substrands?strandId=${strandId}`)
      .then(r => r.ok ? r.json() : { substrands: [] })
      .then(d => {
        if (cancelled) return
        const ss = (d.substrands || []).map((s: any) => ({ id: s.id, name: s.name, learningOutcomes: s.learningOutcomes }))
        setSubStrands(ss)
        setTopic('')
      })
      .catch(() => { if (!cancelled) { setSubStrands([]); setTopic('') } })
      .finally(() => { if (!cancelled) setLoadingSubStrands(false) })
    return () => { cancelled = true }
  }, [strandId])

  const handleStrandChange = useCallback((val: string) => {
    setStrand(val)
    const found = strands.find(s => s.name === val)
    setStrandId(found?.id || '')
    setTopic('')
    setSubStrands([])
  }, [strands])

  // Stats
  const stats = useMemo(() => {
    if (questions.length === 0) return null
    const mcq = questions.filter(q => q.type === 'multiple_choice').length
    return { total: questions.length, mcq, open: questions.length - mcq }
  }, [questions])

  const filteredQuestions = useMemo(() => {
    if (activeTab === 'all') return questions
    if (activeTab === 'mcq') return questions.filter(q => q.type === 'multiple_choice')
    if (activeTab === 'open') return questions.filter(q => q.type !== 'multiple_choice')
    return questions.filter(q => q.level === activeTab.toUpperCase())
  }, [questions, activeTab])

  const generate = async () => {
    if (!subject || !grade) { toast({ variant: 'destructive', title: 'Select subject and grade' }); return }
    setLoading(true); setQuestions([]); setEditedQuestions({}); setShowForm(false)
    try {
      const res = await fetch('/api/ai/bloom-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, strand, subStrand: topic, topic, concepts: topic ? [topic] : [], numQuestions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setQuestions(data.questions || []); setActiveTab('all')
      toast({ title: `Generated ${data.questions.length} Bloom's questions` })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message }); setShowForm(true)
    } finally { setLoading(false) }
  }

  const getQuestion = (i: number): BloomQuestion => ({ ...questions[i], ...editedQuestions[i] } as BloomQuestion)

  const copyAll = () => {
    const text = filteredQuestions.map((q) => {
      const origIdx = questions.indexOf(q)
      const qn = getQuestion(origIdx)
      const body = qn.type === 'multiple_choice'
        ? (qn.options || []).map((o, j) => `  ${String.fromCharCode(65+j)}. ${o}`).join('\n') + `\n  ✓ Answer: ${String.fromCharCode(65 + (qn.correct_answer ?? 0))}`
        : `Model Answer: ${qn.model_answer}`
      return `[${qn.level}]\n${qn.question}\n${body}\nExplanation: ${qn.explanation}`
    }).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!' })
  }

  const downloadQuiz = () => {
    const header = `BLOOM'S TAXONOMY QUIZ\n${subject} | ${grade}${topic ? ` | ${topic}` : ''}\n${'═'.repeat(50)}\n\n`
    const body = filteredQuestions.map((q, idx) => {
      const origIdx = questions.indexOf(q)
      const qn = getQuestion(origIdx)
      const opts = qn.type === 'multiple_choice' && qn.options
        ? qn.options.map((o, j) => `  ${String.fromCharCode(65+j)}. ${o}${j === qn.correct_answer ? ' ✓' : ''}`).join('\n')
        : `Model Answer: ${qn.model_answer}`
      return `Q${idx+1}. [${qn.level} — ${qn.cognitive_skill}]\n${qn.question}\n${opts}\nExplanation: ${qn.explanation}`
    }).join('\n\n')
    const blob = new Blob([header + body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `blooms_quiz_${subject.replace(/\s/g, '_')}_${grade.replace(/\s/g, '_')}.txt`
    a.click(); URL.revokeObjectURL(url)
    toast({ title: 'Downloaded!' })
  }

  // ── Loading State ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-xl">
                <Brain className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Generating Bloom's Quiz</h3>
              <p className="text-slate-500">Creating {numQuestions} questions across all cognitive levels…</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {BLOOM_LEVELS.map((l, i) => (
                <div key={l.level} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLOR_MAP[l.color].gradient} flex items-center justify-center text-white text-xs font-bold animate-bounce`}
                    style={{ animationDelay: `${i * 0.12}s` }}>{l.number}</div>
                  <span className="text-[9px] text-gray-400 font-medium">{l.level.slice(0, 4)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 justify-center">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-1.5 w-8 rounded-full bg-purple-200 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Form State ────────────────────────────────────────────────────────
  if (showForm || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Bloom's Taxonomy Quiz Generator</h1>
                <p className="text-purple-200 text-sm">Create assessment questions across all 6 cognitive levels</p>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-center gap-1.5">
              {BLOOM_LEVELS.map((l) => (
                <div key={l.level} className="flex flex-col items-center gap-1">
                  <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2 text-center transition-all hover:bg-white/25 hover:scale-105 cursor-default"
                    style={{ width: `${70 + (6 - l.number) * 14}px` }}>
                    <span className="text-lg">{l.icon}</span>
                    <p className="text-[10px] font-bold mt-0.5">{l.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-purple-600" /> Quiz Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1: Subject + Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grade *</label>
                <select value={grade} onChange={e => setGrade(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Status hint */}
            {subject && grade && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                {loadingStrands ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Loading curriculum strands…</span>
                ) : strands.length > 0 ? (
                  <span>Found <strong>{strands.length}</strong> strands for {subject} — {grade} {strandSource === 'db' ? '(from curriculum)' : '(suggested topics)'}</span>
                ) : (
                  <span>No strands found for this combination. Type a topic manually below.</span>
                )}
              </div>
            )}

            {/* Row 2: Strand (auto-populated) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Strand / Topic Area {subject && grade ? '' : '(select subject & grade first)'}
              </label>
              {strands.length > 0 ? (
                <div className="relative">
                  <select value={strand} onChange={e => handleStrandChange(e.target.value)}
                    disabled={!subject || !grade || loadingStrands}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50">
                    <option value="">— Choose a strand —</option>
                    {strands.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  {loadingStrands && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
                </div>
              ) : (
                <input value={strand} onChange={e => setStrand(e.target.value)}
                  placeholder="e.g. Numbers, Algebra, Living Things"
                  disabled={!subject || !grade}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50" />
              )}
            </div>

            {/* Row 3: Sub-strand (auto-populated from DB strands) */}
            {strand && !strandId.startsWith('fb-') && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sub-strand (optional)</label>
                {loadingSubStrands ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading sub-strands…
                  </div>
                ) : substrands.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <select value={topic} onChange={e => setTopic(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                        <option value="">— All sub-strands —</option>
                        {substrands.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700">
                      <Layers className="h-3 w-3 shrink-0" />
                      Found <strong>{substrands.length}</strong> sub-strands in curriculum
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    No sub-strands found in curriculum for this strand. Type a specific topic below.
                  </div>
                )}
              </div>
            )}

            {/* Row 4: Specific Topic (always shown as fallback/extra specificity) */}
            {strand && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Specific Topic {substrands.length > 0 ? '(optional — narrow down further)' : ''}
                </label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder={strand ? `e.g. specific topic within ${strand}` : 'e.g. Fractions, Photosynthesis'}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
              </div>
            )}

            {/* Options row */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <label className="text-xs font-semibold text-slate-600">Questions:</label>
                <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                  className="h-7 px-2 border border-slate-200 rounded-lg text-xs bg-white">
                  {[3,6,9,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <label className="text-xs font-semibold text-slate-600">Type:</label>
                <div className="flex gap-1">
                  {(['mixed', 'mcq', 'open'] as const).map(t => (
                    <button key={t} onClick={() => setQuestionType(t)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${questionType === t ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                      {t === 'mixed' ? 'Mixed' : t === 'mcq' ? 'MCQ Only' : 'Open Only'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={generate} disabled={!subject || !grade}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all text-sm">
              <Sparkles className="h-4 w-4 mr-2" /> Generate Bloom's Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Results State ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setQuestions([]); setEditedQuestions({}); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> New Quiz
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{subject} — {grade}</h2>
            <p className="text-xs text-slate-500">{topic || strand || 'All topics'} · {questions.length} questions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={copyAll} className="text-xs h-8"><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
          <Button size="sm" variant="outline" onClick={downloadQuiz} className="text-xs h-8"><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs h-8"><span className="mr-1">🖨️</span> Print</Button>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="grid grid-cols-6 gap-2">
        {BLOOM_LEVELS.map(l => {
          const c = COLOR_MAP[l.color]
          const count = questions.filter(q => q.level === l.level).length
          return (
            <div key={l.level} className={`${c.light} border ${c.border} rounded-xl p-2.5 text-center transition-all hover:shadow-md`}>
              <span className="text-lg">{l.icon}</span>
              <p className={`text-xs font-bold ${c.text} mt-1`}>{l.level}</p>
              <p className="text-lg font-black text-slate-900">{count}</p>
            </div>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1 h-auto bg-slate-100/80 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">All ({questions.length})</TabsTrigger>
          <TabsTrigger value="mcq" className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">MCQ ({stats?.mcq || 0})</TabsTrigger>
          <TabsTrigger value="open" className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Open ({stats?.open || 0})</TabsTrigger>
          {BLOOM_LEVELS.map(l => (
            <TabsTrigger key={l.level} value={l.level.toLowerCase()} className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {l.icon} L{l.number}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-3 space-y-3">
          {filteredQuestions.map((q) => {
            const origIdx = questions.indexOf(q)
            const qn = getQuestion(origIdx)
            const bloom = BLOOM_LEVELS.find(l => l.level === qn.level) || BLOOM_LEVELS[0]
            const c = COLOR_MAP[bloom.color]
            const isOpen = expandedQ === origIdx

            return (
              <div key={origIdx} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? `border-2 ${c.border} shadow-lg` : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                <button onClick={() => setExpandedQ(isOpen ? null : origIdx)} className="w-full text-left">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>{bloom.number}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${c.light} ${c.text} ${c.border} text-[10px] font-bold border`}>{qn.level}</Badge>
                        <Badge variant="outline" className="text-[10px] font-medium">{qn.type === 'multiple_choice' ? '✏️ MCQ' : '📝 Open'}</Badge>
                        <span className="text-[10px] text-gray-400">Q{origIdx + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{qn.question}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setShowAnswers(p => ({ ...p, [origIdx]: !p[origIdx] })) }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Toggle answer">
                        {showAnswers[origIdx] ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                      </button>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {(isOpen || showAnswers[origIdx]) && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="flex items-center gap-2 pt-3">
                      <span className="text-lg">{bloom.icon}</span>
                      <span className="text-xs font-semibold text-slate-500">{qn.cognitive_skill}</span>
                    </div>
                    {qn.type === 'multiple_choice' && qn.options && (
                      <div className="space-y-2">
                        {qn.options.map((opt, j) => {
                          const isCorrect = j === qn.correct_answer
                          return (
                            <div key={j} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${isCorrect ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isCorrect ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + j)}</span>
                              <span className={`flex-1 ${isCorrect ? 'font-semibold text-green-800' : 'text-slate-700'}`}>{opt}</span>
                              {isCorrect && <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {qn.type !== 'multiple_choice' && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-green-600" /><span className="text-xs font-bold text-green-700">MODEL ANSWER</span></div>
                        <p className="text-sm text-green-800 leading-relaxed">{qn.model_answer}</p>
                      </div>
                    )}
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-blue-600" /><span className="text-xs font-bold text-blue-700">WHY THIS LEVEL</span></div>
                      <p className="text-sm text-blue-800 leading-relaxed">{qn.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-400"><AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No questions match this filter</p></div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
