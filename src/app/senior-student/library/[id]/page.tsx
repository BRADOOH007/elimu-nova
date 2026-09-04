'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Play, Pause, Square, Loader2, BookOpen, Headphones,
  Star, Minus, Plus, Moon, Sun, CheckCircle, MessageCircle, Sparkles, WifiOff
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTTS } from '@/hooks/use-tts'

interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  coverUrl: string | null
  content: string | null
  fileUrl: string | null
  audioUrl: string | null
  category: string
  subjects: string[]
  language: string
  readingLevel: string | null
  viewCount: number
}

interface RelatedBook { id: string; title: string; author: string | null; coverUrl: string | null; category: string; readingLevel: string | null; viewCount: number }

function splitParagraphs(content: string | null): string[] {
  if (!content) return []
  return content
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const cacheKey = (id: string) => `book_content_senior_${id}`

const CATEGORY_COLORS: Record<string, string> = {
  Stories: 'from-pink-500 to-rose-400',
  Science: 'from-emerald-500 to-teal-400',
  Mathematics: 'from-blue-500 to-indigo-400',
  History: 'from-amber-500 to-orange-400',
  Geography: 'from-cyan-500 to-sky-400',
  Language: 'from-violet-500 to-purple-400',
  General: 'from-slate-500 to-slate-400',
}
function coverGradient(category: string): string {
  return CATEGORY_COLORS[category] || 'from-slate-500 to-slate-400'
}

export default function SeniorBookReaderPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const { data: session } = useSession()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [nightMode, setNightMode] = useState(false)
  const [rating, setRating] = useState(0)
  const [aggregate, setAggregate] = useState<{ average: number | null; count: number }>({ average: null, count: 0 })
  const [completed, setCompleted] = useState(false)

  const [related, setRelated] = useState<RelatedBook[]>([])
  const [companionOpen, setCompanionOpen] = useState(false)
  const [companionLoading, setCompanionLoading] = useState(false)
  const [companionQuiz, setCompanionQuiz] = useState<any[]>([])
  const [companionChat, setCompanionChat] = useState<string[]>([])

  const paragraphs = splitParagraphs(book?.content ?? null)
  const tts = useTTS({ paragraphs })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readSeconds = useRef(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/library/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Book not found')
        if (cancelled) return
        setBook(data.book)
        setAggregate(data.rating || { average: null, count: 0 })
        if (data.book?.content && typeof window !== 'undefined') {
          try { localStorage.setItem(cacheKey(id), data.book.content) } catch { /* storage full */ }
        }
      } catch (e: any) {
        if (cancelled) return
        try {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey(id)) : null
          if (cached) { setBook(b => b || ({ id, title: 'Offline book', author: null, description: null, coverUrl: null, content: cached, fileUrl: null, audioUrl: null, category: '', subjects: [], language: '', readingLevel: null, viewCount: 0 } as Book)); setOffline(true) }
          else setError(e.message || 'Failed to load book')
        } catch { if (!cancelled) setError(e.message || 'Failed to load book') }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    fetch(`/api/library/${id}/related`).then(r => r.json()).then(d => setRelated(d.related || [])).catch(() => {})
  }, [id])

  // Reading timer: count seconds, flush minutes to the log periodically
  useEffect(() => {
    const interval = setInterval(() => { readSeconds.current += 1 }, 1000)
    const flush = setInterval(async () => {
      if (readSeconds.current < 30 || !session?.user) return
      const mins = Math.floor(readSeconds.current / 60)
      readSeconds.current = readSeconds.current % 60
      if (mins > 0) {
        await fetch('/api/library/reading-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: id, minutes: mins }) }).catch(() => {})
      }
    }, 60000)
    return () => { clearInterval(interval); clearInterval(flush) }
  }, [id, session])

  useEffect(() => {
    return () => {
      const mins = Math.floor(readSeconds.current / 60)
      if (mins > 0 && session?.user) {
        fetch('/api/library/reading-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: id, minutes: mins }) }).catch(() => {})
      }
    }
  }, [id, session])

  const runCompanion = async (mode: 'quiz' | 'discuss') => {
    setCompanionOpen(true)
    setCompanionLoading(true)
    try {
      const res = await fetch(`/api/library/${id}/companion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = await res.json()
      if (mode === 'quiz') setCompanionQuiz(data.questions || [])
      else setCompanionChat(c => [...c, data.response || 'No response.'])
    } catch {
      if (mode === 'discuss') setCompanionChat(c => [...c, 'Sorry, something went wrong.'])
    } finally { setCompanionLoading(false) }
  }

  const saveProgress = useCallback(async (pct: number, paraIndex: number, done: boolean) => {
    if (!session?.user) return
    try {
      await fetch('/api/library/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: id, position: paraIndex, progressPct: pct, completed: done }),
      })
    } catch { /* ignore progress save failures */ }
  }, [id, session])

  const onScroll = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const el = document.documentElement
      const pct = el.scrollHeight - el.clientHeight > 0
        ? Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
        : 0
      saveProgress(pct, tts.currentParagraph ?? 0, false)
    }, 1500)
  }, [saveProgress, tts.currentParagraph])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const submitRating = async (value: number) => {
    setRating(value)
    try {
      const res = await fetch(`/api/library/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      })
      const data = await res.json()
      if (res.ok && data.aggregate) setAggregate(data.aggregate)
    } catch { /* ignore */ }
  }

  const markComplete = () => {
    setCompleted(true)
    saveProgress(100, paragraphs.length, true)
  }

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500">Opening book…</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">{error || 'Book not found'}</p>
        <Link href="/senior-student/library" className="text-emerald-600 hover:underline text-sm">Back to library</Link>
      </div>
    )
  }

  const textColor = nightMode ? 'text-slate-200' : 'text-slate-800'
  const bgColor = nightMode ? 'bg-slate-900' : 'bg-white'

  return (
    <div className={`min-h-screen ${nightMode ? 'bg-slate-950' : 'bg-slate-50'} transition-colors -m-4 md:-m-6 p-4 md:p-6`}>
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="max-w-3xl mx-auto h-14 flex items-center justify-between gap-3">
          <Link href="/senior-student/library" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <p className="text-sm font-semibold text-slate-800 truncate flex-1 text-center">{book.title}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(f => Math.max(14, f - 1))} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Smaller text"><Minus className="h-4 w-4" /></button>
            <button onClick={() => setFontSize(f => Math.min(28, f + 1))} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Larger text"><Plus className="h-4 w-4" /></button>
            <button onClick={() => setNightMode(v => !v)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Night mode">
              {nightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-6 text-center">
          <h1 className={`text-3xl font-bold ${nightMode ? 'text-white' : 'text-slate-900'}`}>{book.title}</h1>
          <p className={`mt-2 text-sm ${nightMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {book.author ? `By ${book.author}` : ''}
            {book.author && book.category ? ' · ' : ''}
            {book.category}
            {book.readingLevel ? ` · ${book.readingLevel}` : ''}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {book.subjects?.slice(0, 4).map(s => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>

        {paragraphs.length > 0 ? (
          <div className={`${bgColor} rounded-2xl border ${nightMode ? 'border-slate-800' : 'border-slate-200'} shadow-sm p-6 sm:p-8`}>
            <div className="space-y-5" style={{ fontSize }}>
              {paragraphs.map((p, i) => (
                <p key={i}
                  className={`leading-relaxed rounded-lg px-1 transition-colors ${textColor} ${tts.currentParagraph === i ? (nightMode ? 'bg-slate-800' : 'bg-amber-50') : ''}`}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-16">No readable content available for this book yet.</p>
        )}

        {book.content && (
          <div className="mt-6 space-y-4">
            <div className={`flex items-center justify-between flex-wrap gap-3 ${nightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => submitRating(v)} className="p-0.5" title={`Rate ${v} stars`}>
                      <Star className={`h-5 w-5 ${v <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <span className="text-xs">
                  {aggregate.count > 0 ? `${aggregate.average?.toFixed(1)} (${aggregate.count})` : 'Rate this book'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {offline && (
                  <span className="flex items-center gap-1 text-xs text-amber-600"><WifiOff className="h-3.5 w-3.5" /> Reading offline</span>
                )}
                <button onClick={() => runCompanion('quiz')}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50">
                  <Sparkles className="h-4 w-4" /> Quiz me
                </button>
                <button onClick={() => runCompanion('discuss')}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-50">
                  <MessageCircle className="h-4 w-4" /> Discuss
                </button>
                <button onClick={markComplete}
                  className={`flex items-center gap-1.5 text-sm font-medium ${completed ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  <CheckCircle className={`h-4 w-4 ${completed ? 'text-green-600' : ''}`} />
                  {completed ? 'Completed' : 'Mark complete'}
                </button>
              </div>
            </div>

            {companionOpen && (
              <div className={`rounded-2xl border p-4 ${nightMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-slate-700">Reading companion</p>
                  <button onClick={() => { setCompanionOpen(false); setCompanionQuiz([]) }} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
                </div>
                {companionLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>
                ) : companionQuiz.length > 0 ? (
                  <div className="space-y-3">
                    {companionQuiz.map((q, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className="text-sm font-semibold text-slate-800">{i + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                          {(q.options || []).map((o: string, oi: number) => (
                            <div key={oi} className={`text-xs px-2 py-1.5 rounded-lg ${oi === q.answer ? 'bg-green-100 text-green-700 font-medium' : 'bg-slate-100 text-slate-600'}`}>
                              {o}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <p className="text-xs text-slate-500 mt-1.5">{q.explanation}</p>}
                      </div>
                    ))}
                  </div>
                ) : companionChat.length > 0 ? (
                  <div className="space-y-2">
                    {companionChat.map((m, i) => <p key={i} className="text-sm text-slate-700 leading-relaxed">{m}</p>)}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {related.length > 0 && (
          <div className={`mt-6 rounded-2xl border p-4 ${nightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`font-semibold text-sm mb-3 ${nightMode ? 'text-white' : 'text-slate-800'}`}>You might also enjoy</p>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {related.map(b => (
                <Link key={b.id} href={`/senior-student/library/${b.id}`} className="shrink-0 w-32">
                  <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${coverGradient(b.category)} flex items-center justify-center`}>
                    <BookOpen className="h-6 w-6 text-white/80" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{b.author || b.category}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {paragraphs.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border ${nightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => tts.play(tts.currentParagraph ?? 0)} className="p-1.5 text-slate-500 hover:text-slate-700" title="Restart">
              <Headphones className="h-4 w-4" />
            </button>
            <button onClick={tts.toggle}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow">
              {tts.speaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button onClick={tts.stop} className="p-1.5 text-slate-500 hover:text-slate-700">
              <Square className="h-4 w-4" />
            </button>
            <select value={tts.rate} onChange={e => tts.setRate(Number(e.target.value))}
              className={`text-xs bg-transparent border rounded-lg px-1.5 py-1 ${nightMode ? 'text-slate-300 border-slate-600' : 'text-slate-600 border-slate-200'}`}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
