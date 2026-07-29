'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessagesSquare, Plus, Send, Loader2, MessageSquare, ChevronRight, User, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Discussion {
  id: string
  topic: string
  message: string
  senderName: string
  senderRole: string
  createdAt: string
  replyCount?: number
}

export function StudyGroups() {
  const { data: session } = useSession()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, Discussion[]>>({})

  useEffect(() => {
    fetchDiscussions()
  }, [])

  const fetchDiscussions = async () => {
    try {
      const res = await fetch('/api/discussions')
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.discussions || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!topic.trim() || !question.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), message: question.trim() }),
      })
      if (res.ok) {
        setShowNew(false)
        setTopic('')
        setQuestion('')
        await fetchDiscussions()
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const toggleReplies = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!replies[id]) {
      try {
        const res = await fetch(`/api/messages?discussionId=${id}`)
        if (res.ok) {
          const data = await res.json()
          setReplies(prev => ({ ...prev, [id]: data.messages || [] }))
        }
      } catch { /* ignore */ }
    }
  }

  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Ask questions, share notes, and discuss topics with classmates.</p>
        <Button size="sm" onClick={() => setShowNew(!showNew)} className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300">
          <Plus className="h-4 w-4 mr-1" /> {showNew ? 'Cancel' : 'New Question'}
        </Button>
      </div>

      {showNew && (
        <Card className="border-teal-200 bg-teal-50/50 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (e.g. 'Algebra Homework Help')"
              className="w-full h-10 px-3 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Your question or discussion topic..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <Button onClick={handleCreate} disabled={submitting || !topic.trim() || !question.trim()} className="bg-teal-600 hover:bg-teal-700 hover:shadow-md transition-all">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting...</> : <><Send className="h-4 w-4 mr-2" /> Post Question</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-12">
          <MessagesSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No discussions yet</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-200">
              <button onClick={() => toggleReplies(d.id)} className="w-full flex items-start justify-between p-4 text-left hover:bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-teal-500 shrink-0" />
                    <p className="font-semibold text-slate-800 text-sm truncate">{d.topic}</p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{d.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><User className="h-3 w-3" /> {d.senderName}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(d.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-300 mt-1 shrink-0 transition-transform ${expandedId === d.id ? 'rotate-90' : ''}`} />
              </button>
              {expandedId === d.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Replies</p>
                  {replies[d.id]?.length > 0 ? (
                    replies[d.id].map((r, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-700">{r.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{r.senderName} · {fmtTime(r.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No replies yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
