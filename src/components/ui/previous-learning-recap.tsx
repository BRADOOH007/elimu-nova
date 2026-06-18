'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Clock, ChevronRight, RotateCcw, Loader2 } from 'lucide-react'

interface LastSession {
  subject:   string
  topic:     string
  createdAt: string
  mode:      string
}

interface Props {
  onStart?: () => void
}

export function PreviousLearningRecap({ onStart }: Props) {
  const [lastSession, setLastSession] = useState<LastSession | null>(null)
  const [loading, setLoading]         = useState(true)
  const [dismissed, setDismissed]     = useState(false)

  useEffect(() => {
    fetch('/api/student/tutor/next')
      .then(r => r.json())
      .then(data => {
        // Fetch last completed session separately
        fetch('/api/student/ai-teacher-insights')
          .then(r => r.json())
          .then(insights => {
            const current = insights?.learningPath?.current
            const completed = insights?.learningPath?.completed || []
            if (completed.length > 0 || current) {
              setLastSession({
                subject:   data?.task?.subject || 'General',
                topic:     completed[completed.length - 1] || current || 'Getting Started',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                mode:      data?.task?.mode || 'teach',
              })
            }
          }).catch(() => {})
      }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || dismissed || !lastSession) return null

  const fmtDate = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
    if (diff < 1)  return 'Less than an hour ago'
    if (diff < 24) return `${diff} hour${diff > 1 ? 's' : ''} ago`
    const days = Math.floor(diff / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
          <RotateCcw className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Continue where you left off</p>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <BookOpen className="h-3 w-3" /> {lastSession.subject} — {lastSession.topic}
            <span className="text-slate-300">·</span>
            <Clock className="h-3 w-3" /> {fmtDate(lastSession.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setDismissed(true)}
          className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg transition-colors">
          Dismiss
        </button>
        <button onClick={onStart}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all">
          Resume <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
