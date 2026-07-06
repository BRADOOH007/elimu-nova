'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Loader2, GraduationCap, ChevronDown, ChevronUp, CheckCircle, Copy, Download } from 'lucide-react'

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies']
const GRADES   = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  REMEMBER:   { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-300'   },
  UNDERSTAND: { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-300'  },
  APPLY:      { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
  ANALYZE:    { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  EVALUATE:   { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-300'    },
  CREATE:     { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
}

interface BloomQuestion {
  level: string
  levelNumber: number
  cognitive_skill: string
  question: string
  type: string
  options?: string[]
  correct_answer?: number
  model_answer?: string
  explanation: string
}

export default function BloomsQuizGenerator() {
  const { toast } = useToast()
  const [subject,    setSubject]    = useState('')
  const [grade,      setGrade]      = useState('')
  const [strand,     setStrand]     = useState('')
  const [subStrand,  setSubStrand]  = useState('')
  const [topic,      setTopic]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [questions,  setQuestions]  = useState<BloomQuestion[]>([])
  const [expanded,   setExpanded]   = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({})

  const generate = async () => {
    if (!subject || !grade) { toast({ variant: 'destructive', title: 'Select subject and grade first' }); return }
    setLoading(true)
    setQuestions([])
    try {
      const res  = await fetch('/api/ai/bloom-quiz', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject, grade, strand, subStrand, topic, concepts: topic ? [topic] : [] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setQuestions(data.questions || [])
      setExpanded(0)
      toast({ title: `✅ Generated ${data.questions.length} Bloom's questions` })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally { setLoading(false) }
  }

  const copyAll = () => {
    const text = questions.map(q => `[${q.level}] ${q.question}\n${q.type === 'multiple_choice' ? (q.options || []).join('\n') + `\nAnswer: ${q.options?.[q.correct_answer ?? 0]}` : `Model Answer: ${q.model_answer}`}\nExplanation: ${q.explanation}`).join('\n\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!' })
  }

  const downloadQuiz = () => {
    const text = `BLOOM'S TAXONOMY QUIZ\n${subject} | ${grade} | ${topic || strand || subStrand}\n${'='.repeat(50)}\n\n` +
      questions.map((q, i) => `Q${i+1}. [${q.level} — ${q.cognitive_skill}]\n${q.question}\n${q.type === 'multiple_choice' ? (q.options || []).map((o, j) => `  ${String.fromCharCode(65+j)}. ${o}`).join('\n') + `\n  ✓ Answer: ${q.options?.[q.correct_answer ?? 0]}` : `Model Answer: ${q.model_answer}`}\n\nExplanation: ${q.explanation}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `blooms_quiz_${subject.replace(/\s/g,'_')}_${grade.replace(/\s/g,'_')}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bloom's Taxonomy Quiz Generator</h2>
          <p className="text-slate-500 text-sm">Generate 6 questions across all cognitive levels — CBC aligned</p>
        </div>
      </div>

      {/* Bloom's level legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(LEVEL_COLORS).map(([lvl, c]) => (
          <span key={lvl} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
            {lvl}
          </span>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject *</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select subject</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grade *</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select grade</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Strand (optional)</label>
            <input value={strand} onChange={e => setStrand(e.target.value)} placeholder="e.g. Numbers"
              className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sub-Strand / Topic *</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions"
              className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <button onClick={generate} disabled={loading || !subject || !grade}
          className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><GraduationCap className="h-4 w-4" /> Generate Bloom's Questions</>}
        </button>
      </div>

      {/* Results */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{questions.length} Questions Generated</h3>
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <Copy className="h-3.5 w-3.5" /> Copy All
              </button>
              <button onClick={downloadQuiz} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>

          {questions.map((q, i) => {
            const c = LEVEL_COLORS[q.level] || LEVEL_COLORS.REMEMBER
            const isOpen = expanded === i
            return (
              <div key={i} className={`border rounded-2xl overflow-hidden ${c.border}`}>
                {/* Header */}
                <button onClick={() => setExpanded(isOpen ? null : i)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left ${c.bg} hover:opacity-90 transition-opacity`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                      L{q.levelNumber} {q.level}
                    </span>
                    <span className={`text-xs ${c.text} opacity-75`}>{q.cognitive_skill}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium">
                      {q.type === 'multiple_choice' ? 'MCQ' : 'Open'}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Question preview (always visible) */}
                <div className="px-5 py-3 bg-white border-t border-slate-100">
                  <p className="font-medium text-slate-800 text-sm">{q.question}</p>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-4 bg-white space-y-3">
                    {/* MCQ options */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-1.5">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${j === q.correct_answer ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                            <span className={`font-bold shrink-0 ${j === q.correct_answer ? 'text-green-600' : 'text-slate-500'}`}>
                              {String.fromCharCode(65+j)}.
                            </span>
                            <span>{opt}</span>
                            {j === q.correct_answer && <CheckCircle className="h-4 w-4 text-green-500 ml-auto shrink-0 mt-0.5" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Open-ended model answer (toggle) */}
                    {q.type !== 'multiple_choice' && (
                      <div>
                        <button onClick={() => setShowAnswer(p => ({ ...p, [i]: !p[i] }))}
                          className="text-xs font-semibold text-blue-600 hover:underline">
                          {showAnswer[i] ? 'Hide' : 'Show'} Model Answer
                        </button>
                        {showAnswer[i] && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                            {q.model_answer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-200">
                      <span className="font-semibold text-slate-700">Why this level: </span>{q.explanation}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
