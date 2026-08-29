'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  PenLine, Loader2, CheckCircle, AlertCircle, Lightbulb, BookOpen,
  X, Sparkles, MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface EssayFeedback {
  overall: string
  score: number
  gibberish?: boolean
  grammar?: { score: number; issues: string[]; suggestions: string[] }
  structure?: { score: number; issues: string[]; suggestions: string[] }
  content?: { score: number; strengths: string[]; improvements: string[] }
  vocabulary?: { score: number; good_words: string[]; better_alternatives: Record<string, string> }
  tips?: string[]
}

interface Essay {
  id: string
  title: string | null
  topic: string
  subject: string
  content: string
  wordCount: number
  score: number | null
  status: string
  feedback: EssayFeedback | null
  startedAt: string
}

const SUBJECTS = ['Reasoning Through Language Arts', 'English / ESL', 'Social Studies', 'Science']

export default function SeniorEssaysPage() {
  const { data: session } = useSession()
  const [essays, setEssays] = useState<Essay[]>([])
  const [promptIdeas, setPromptIdeas] = useState<string[]>([])
  const [selected, setSelected] = useState<Essay | null>(null)

  const [subject, setSubject] = useState(SUBJECTS[0])
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  const wordCount = content.split(/\s+/).filter(Boolean).length

  const loadEssays = useCallback(async () => {
    try {
      const r = await fetch('/api/senior-student/essays')
      if (r.ok) {
        const d = await r.json()
        setEssays(d.essays || [])
        setPromptIdeas(d.promptIdeas || [])
      }
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadEssays() }, [loadEssays])

  const submit = async () => {
    if (content.trim().length < 50) return
    setLoading(true)
    setFeedback(null)
    try {
      const r = await fetch('/api/senior-student/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic: topic || 'Free writing', title, content }),
      })
      if (r.ok) {
        const d = await r.json()
        setFeedback(d.feedback)
        setContent('')
        setTitle('')
        await loadEssays()
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const firstName = (session?.user?.name || 'Learner').split(' ')[0]

  const hasGrammarIssues = (feedback?.grammar?.issues?.length ?? 0) > 0
  const hasStrengths = (feedback?.content?.strengths?.length ?? 0) > 0
  const hasTips = (feedback?.tips?.length ?? 0) > 0

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 text-white rounded-2xl p-5 md:p-7 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="h-5 w-5 text-rose-200" />
          <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">Essay Writing with AI marking</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Write &amp; Get Graded, {firstName}</h1>
        <p className="text-rose-100/90 text-sm mt-1 max-w-2xl">
          Practise writing essays on your own or with a topic idea. Submit your writing and our AI
          tutor will mark it with a score and detailed feedback to help you improve.
        </p>
      </div>

      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                  <h2 className="text-lg font-bold text-slate-900">AI Marking Result</h2>
                </div>
                <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {feedback.gibberish ? (
                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-center space-y-3">
                  <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="text-3xl font-black text-red-600">0%</p>
                  <p className="text-sm text-red-700 font-semibold">This essay could not be marked</p>
                  <p className="text-sm text-red-600">{feedback.overall}</p>
                </div>
              ) : (
                <>
                  <div className={`p-5 rounded-2xl text-center ${feedback.score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className="text-4xl font-black text-slate-900">{feedback.score || '..'}%</p>
                    <p className="text-sm text-slate-600 mt-1">{feedback.overall}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {feedback.grammar && (
                      <ScoreBar label="Grammar" score={feedback.grammar.score} color="text-blue-600" />
                    )}
                    {feedback.structure && (
                      <ScoreBar label="Structure" score={feedback.structure.score} color="text-purple-600" />
                    )}
                    {feedback.content && (
                      <ScoreBar label="Content" score={feedback.content.score} color="text-green-600" />
                    )}
                    {feedback.vocabulary && (
                      <ScoreBar label="Vocabulary" score={feedback.vocabulary.score} color="text-amber-600" />
                    )}
                  </div>

                  {hasGrammarIssues && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Grammar Issues
                      </p>
                      <ul className="text-xs text-red-600 space-y-0.5 list-disc ml-4">
                        {(feedback?.grammar?.issues ?? []).map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  )}

                  {hasStrengths && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Strengths
                      </p>
                      <ul className="text-xs text-green-600 space-y-0.5 list-disc ml-4">
                        {(feedback?.content?.strengths ?? []).map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {hasTips && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3.5 w-3.5" /> Tips for Improvement
                      </p>
                      <ul className="text-xs text-blue-600 space-y-0.5 list-disc ml-4">
                        {(feedback?.tips ?? []).map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <Button onClick={() => setFeedback(null)} className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90">
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two-column: composer + history */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-pink-600" />
                <h2 className="text-lg font-bold text-slate-800">Write &amp; Submit</h2>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Subject</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        subject === s ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">Essay Topic</label>
                  <button onClick={() => setCustomTopic(!customTopic)} className="text-xs font-medium text-pink-600 hover:underline">
                    {customTopic ? 'Use an idea' : 'Write my own topic'}
                  </button>
                </div>
                {customTopic ? (
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Type your own essay topic..."
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {promptIdeas.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTopic(p)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-lg border ${
                          topic === p ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-pink-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Title (optional)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. My Journey Back to Learning"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">Your Essay *</label>
                  <span className={`text-[10px] ${wordCount >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                    {wordCount} words {wordCount < 50 ? '(min 50 for marking)' : ''}
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={e => { setContent(e.target.value); setFeedback(null) }}
                  placeholder="Write your essay here. Try an introduction, a few body paragraphs, and a conclusion."
                  rows={14}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={submit}
                disabled={loading || content.trim().length < 50}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90"
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Marking your essay...</> : <><MessageSquare className="h-4 w-4 mr-2" /> Submit &amp; Get AI Marked</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-800">My Essays</h2>
          </div>
          {loadingList ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-6"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
          ) : essays.length === 0 ? (
            <Card><CardContent className="p-5 text-sm text-slate-500">No essays yet. Submit your first one to get started!</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {essays.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(selected?.id === e.id ? null : e)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selected?.id === e.id ? 'border-pink-300 bg-pink-50' : 'bg-white border-slate-200 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{e.title || e.topic}</p>
                    {e.score != null && (
                      <Badge className={`ml-2 shrink-0 ${e.score >= 70 ? 'bg-green-100 text-green-700' : e.score === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                        {e.score}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{e.subject} · {e.wordCount} words · {new Date(e.startedAt).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{selected.title || selected.topic}</p>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
                </div>
                <Badge className="bg-pink-50 text-pink-600 border-pink-200">{selected.subject} · {selected.topic}</Badge>
                <article className="text-sm text-slate-600 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto border-t border-slate-100 pt-3">
                  {selected.content}
                </article>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  )
}
