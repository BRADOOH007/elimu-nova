'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Loader2, CheckCircle, Clock, Plus, X } from 'lucide-react'

interface Discussion {
  id: string; topic: string; message: string
  senderName: string; senderRole: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function StudentDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [topic, setTopic]             = useState('')
  const [message, setMessage]         = useState('')
  const [posting, setPosting]         = useState(false)
  const [posted, setPosted]           = useState(false)

  const TOPICS = [
    'Question about today\'s lesson',
    'Help with assignment',
    'Concept I don\'t understand',
    'Request for extra resources',
    'General feedback',
    'Other',
  ]

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/discussions?status=all')
      const data = await res.json()
      // Students only see approved messages + their own pending ones
      setDiscussions((data.discussions || []).filter(
        (d: Discussion) => d.status === 'approved' || d.senderRole === 'STUDENT'
      ))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const post = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic || !message.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, message }),
      })
      if (res.ok) {
        setPosted(true)
        setTopic('')
        setMessage('')
        setShowForm(false)
        setTimeout(() => setPosted(false), 4000)
        await load()
      }
    } finally { setPosting(false) }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const statusBadge = (status: string) => {
    if (status === 'approved') return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>
    )
    if (status === 'pending') return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock className="h-3 w-3" /> Awaiting review
      </span>
    )
    return null
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discussion Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ask questions, share ideas — your teacher reviews all posts</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Post a Question'}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">New Discussion Post</h2>
          <form onSubmit={post} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button key={t} type="button" onClick={() => setTopic(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      topic === t
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your question or message clearly..."
                rows={4}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={posting || !topic || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {posting ? 'Posting...' : 'Submit Post'}
              </button>
              <p className="text-xs text-slate-400">Your teacher will review before it goes live</p>
            </div>
          </form>
        </div>
      )}

      {/* Success banner */}
      {posted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Post submitted!</p>
            <p className="text-xs text-green-600">Your teacher will review it shortly.</p>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No discussions yet</p>
          <p className="text-slate-400 text-sm mt-1">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map(d => (
            <div key={d.id} className={`bg-white border rounded-2xl p-5 ${
              d.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {d.senderName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.senderName}</p>
                    <p className="text-xs text-slate-400">{fmtDate(d.createdAt)}</p>
                  </div>
                </div>
                {statusBadge(d.status)}
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">{d.topic}</p>
              <p className="text-slate-700 text-sm leading-relaxed">{d.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
