'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { PenTool, Loader2, CheckCircle, AlertCircle, BookOpen, Lightbulb, Save } from 'lucide-react'

interface WritingFeedback {
  overall: string
  score: number
  grammar: { score: number; issues: string[]; suggestions: string[] }
  structure: { score: number; issues: string[]; suggestions: string[] }
  content: { score: number; strengths: string[]; improvements: string[] }
  vocabulary: { score: number; good_words: string[]; better_alternatives: Record<string, string> }
  tips: string[]
  gibberish?: boolean
}

interface WritingCoachProps {
  subject?: string
  topic?: string
}

export function WritingCoach({ subject = 'English', topic = 'Writing' }: WritingCoachProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const wordCount = content.split(/\s+/).filter(Boolean).length

  const submitForReview = async () => {
    if (!content.trim()) return
    setLoading(true)
    setFeedback(null)
    try {
      const r = await fetch('/api/student/writing-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, title, content }),
      })
      if (r.ok) {
        const d = await r.json()
        setFeedback(d.feedback)
        setSaved(true)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5" /> Writing Coach
          <Badge className="bg-white/20 text-white text-[10px] ml-auto">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {!feedback ? (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Title (optional)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. My Essay on Environmental Conservation"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Your Writing *</label>
                <span className={`text-[10px] ${wordCount > 50 ? 'text-green-600' : 'text-gray-400'}`}>
                  {wordCount} words {wordCount < 50 ? '(min 50 for feedback)' : ''}
                </span>
              </div>
              <Textarea
                value={content}
                onChange={e => { setContent(e.target.value); setSaved(false) }}
                placeholder="Start writing here... You can write essays, stories, reports, or any written work."
                rows={12}
                className="resize-none"
              />
            </div>
            <Button
              onClick={submitForReview}
              disabled={loading || content.trim().length < 50}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysing your writing…</> : <><PenTool className="h-4 w-4 mr-2" /> Get AI Feedback</>}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {feedback.gibberish ? (
              <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                <p className="text-3xl font-black text-red-600">0%</p>
                <p className="text-sm text-red-700 font-semibold">This couldn't be scored</p>
                <p className="text-sm text-red-600">{feedback.overall}</p>
                <div className="flex items-center gap-2 justify-center p-3 bg-red-100 rounded-xl text-left">
                  <BookOpen className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">Your writing must use readable words so it can be marked. Rewrite your answer and submit again.</p>
                </div>
              </div>
            ) : (
              <>
            {/* Overall Score */}
            <div className={`p-4 rounded-2xl text-center ${feedback.score && feedback.score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className="text-3xl font-black text-slate-900">{feedback.score || '—'}%</p>
              <p className="text-sm text-slate-600 mt-1">{feedback.overall}</p>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-2 gap-3">
              {feedback.grammar && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">Grammar</span>
                    <span className="text-xs font-bold text-blue-600">{feedback.grammar.score}%</span>
                  </div>
                  <Progress value={feedback.grammar.score} className="h-1.5" />
                </div>
              )}
              {feedback.structure && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">Structure</span>
                    <span className="text-xs font-bold text-purple-600">{feedback.structure.score}%</span>
                  </div>
                  <Progress value={feedback.structure.score} className="h-1.5" />
                </div>
              )}
              {feedback.content && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">Content</span>
                    <span className="text-xs font-bold text-green-600">{feedback.content.score}%</span>
                  </div>
                  <Progress value={feedback.content.score} className="h-1.5" />
                </div>
              )}
              {feedback.vocabulary && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">Vocabulary</span>
                    <span className="text-xs font-bold text-amber-600">{feedback.vocabulary.score}%</span>
                  </div>
                  <Progress value={feedback.vocabulary.score} className="h-1.5" />
                </div>
              )}
            </div>

            {/* Detailed Feedback */}
            {feedback.grammar?.issues?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Grammar Issues
                </p>
                <ul className="text-xs text-red-600 space-y-0.5">
                  {feedback.grammar.issues.map((issue, i) => <li key={i}>• {issue}</li>)}
                </ul>
              </div>
            )}

            {feedback.content?.strengths?.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Strengths
                </p>
                <ul className="text-xs text-green-600 space-y-0.5">
                  {feedback.content.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}

            {feedback.tips?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1">
                  <Lightbulb className="h-3.5 w-3.5" /> Tips for Improvement
                </p>
                <ul className="text-xs text-blue-600 space-y-0.5">
                  {feedback.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                </ul>
              </div>
            )}
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => { setFeedback(null); setSaved(false) }}
                variant="outline" className="flex-1"
              >
                <PenTool className="h-4 w-4 mr-1.5" /> Write Again
              </Button>
              {saved && (
                <Badge className="bg-green-100 text-green-700 flex items-center gap-1 h-9">
                  <Save className="h-3.5 w-3.5" /> Saved
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
