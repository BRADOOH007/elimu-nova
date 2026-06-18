'use client'

import { useState } from 'react'
import { Brain, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

const LEVELS = [
  { level: 1, name: 'Remember',   color: 'bg-red-100 text-red-700 border-red-200',    verbs: ['Define','List','Recall','Identify','Name','State'] },
  { level: 2, name: 'Understand', color: 'bg-orange-100 text-orange-700 border-orange-200', verbs: ['Explain','Describe','Summarise','Classify','Compare'] },
  { level: 3, name: 'Apply',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', verbs: ['Use','Solve','Demonstrate','Calculate','Implement'] },
  { level: 4, name: 'Analyse',    color: 'bg-green-100 text-green-700 border-green-200',  verbs: ['Differentiate','Examine','Organise','Question','Test'] },
  { level: 5, name: 'Evaluate',   color: 'bg-blue-100 text-blue-700 border-blue-200',    verbs: ['Judge','Assess','Critique','Defend','Recommend'] },
  { level: 6, name: 'Create',     color: 'bg-purple-100 text-purple-700 border-purple-200', verbs: ['Design','Construct','Develop','Formulate','Produce'] },
]

interface GeneratedQuestion { level: number; levelName: string; question: string; marks: number }

interface Props {
  subject: string
  topic: string
  grade: string
  onQuestionsGenerated?: (questions: GeneratedQuestion[]) => void
}

export function BloomsQuizGenerator({ subject, topic, grade, onQuestionsGenerated }: Props) {
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1, 2, 3])
  const [questionsPerLevel, setQuestionsPerLevel] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions]   = useState<GeneratedQuestion[]>([])
  const [expanded, setExpanded]     = useState(false)

  const toggleLevel = (l: number) =>
    setSelectedLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l].sort())

  const generate = async () => {
    if (!subject || !topic) return
    setGenerating(true)
    try {
      const prompt = `Generate ${questionsPerLevel} exam questions at each of these Bloom's Taxonomy levels for:
Subject: ${subject}, Topic: ${topic}, Grade: ${grade}
Levels: ${selectedLevels.map(l => LEVELS[l-1].name).join(', ')}

For each question include the level number, level name, question text and marks (1-10 based on complexity).
Return a JSON array:
[{ "level": 1, "levelName": "Remember", "question": "...", "marks": 2 }, ...]`

      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: 'teacher_assistant' }),
      })
      const data = await res.json()

      // Parse JSON from response
      const match = data.response?.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setQuestions(parsed)
        setExpanded(true)
        onQuestionsGenerated?.(parsed)
      }
    } catch (e) {
      console.error('Blooms generation failed:', e)
    } finally { setGenerating(false) }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="font-semibold text-slate-800 text-sm">Bloom's Taxonomy Question Generator</span>
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Level selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select cognitive levels</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(l => (
                <button
                  key={l.level}
                  onClick={() => toggleLevel(l.level)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedLevels.includes(l.level) ? l.color : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  L{l.level} {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected level verbs */}
          {selectedLevels.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">Question starters for selected levels:</p>
              <div className="flex flex-wrap gap-1">
                {selectedLevels.flatMap(l => LEVELS[l-1].verbs).map(v => (
                  <span key={v} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Questions per level</label>
              <select value={questionsPerLevel} onChange={e => setQuestionsPerLevel(Number(e.target.value))}
                className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1 text-xs text-slate-400 self-end pb-2">
              Will generate {selectedLevels.length * questionsPerLevel} questions total
            </div>
          </div>

          <button onClick={generate} disabled={generating || selectedLevels.length === 0 || !subject || !topic}
            className="w-full flex items-center justify-center gap-2 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Bloom's Questions</>}
          </button>

          {/* Generated questions */}
          {questions.length > 0 && (
            <div className="space-y-3 mt-2">
              {LEVELS.filter(l => selectedLevels.includes(l.level)).map(lvl => {
                const lvlQuestions = questions.filter(q => q.level === lvl.level)
                if (!lvlQuestions.length) return null
                return (
                  <div key={lvl.level}>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mb-2 ${lvl.color}`}>
                      L{lvl.level} {lvl.name}
                    </div>
                    <div className="space-y-2">
                      {lvlQuestions.map((q, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3">
                          <p className="text-sm text-slate-700 flex-1">{q.question}</p>
                          <span className="text-xs font-bold text-slate-400 shrink-0">{q.marks}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
