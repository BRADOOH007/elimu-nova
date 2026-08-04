'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Loader2, CheckCircle, X, Users, ShieldAlert } from 'lucide-react'

interface Discussion {
  id: string; topic: string; message: string
  senderName: string; senderRole: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string; flagged?: boolean
}

export default function StudentDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [topic, setTopic]             = useState('')
  const [message, setMessage]         = useState('')
  const [posting, setPosting]         = useState(false)
  const [posted, setPosted]           = useState(false)
  const [flagged, setFlagged]         = useState(false)

  const TOPICS = [
    'Question about today\'s lesson',
    'Help with assignment',
    'Concept I don\'t understand',
    'Request for extra resources',
    'General discussion',
    'Other',
  ]

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/discussions?status=all')
      const data = await res.json()
      setDiscussions((data.discussions || []).filter(
        (d: Discussion) => d.status === 'approved'
      ))
    } catch { console.error('Failed to load discussions') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const post = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic || !message.trim()) return
    setPosting(true); setFlagged(false)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, message }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.discussion?.flagged) setFlagged(true)
        setPosted(true)
        setTopic('')
        setMessage('')
        setShowForm(false)
        setTimeout(() => { setPosted(false); setFlagged(false) }, 5000)
        await load()
      }
    } catch { console.error('Failed to post') }
    finally { setPosting(false) }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  const avatarColor = (name: string) => {
    const colors = ['from-blue-500 to-purple-600', 'from-teal-500 to-emerald-600', 'from-amber-500 to-orange-600', 'from-pink-500 to-rose-600', 'from-indigo-500 to-violet-600']
    const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
    return colors[i]
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Discussion Board
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Community chat — all students can post and read</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Post'}
        </button>
      </div>

      {flagged && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Message flagged</p>
            <p className="text-xs text-amber-600">Inappropriate words were filtered. Keep it respectful.</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">New Post</h2>
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
                placeholder="Share your thoughts, ask a question, or start a discussion..."
                rows={4}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Be respectful — inappropriate language is filtered automatically</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={posting || !topic || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {posting ? 'Posting...' : 'Post to Board'}
              </button>
              <p className="text-xs text-slate-400">Your post will be visible to all students</p>
            </div>
          </form>
        </div>
      )}

      {posted && !flagged && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Posted!</p>
            <p className="text-xs text-green-600">Your message is now visible to everyone.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No discussions yet</p>
          <p className="text-slate-400 text-sm mt-1">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(d.senderName)} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-white text-xs font-bold">{getInitials(d.senderName)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.senderName}</p>
                    <p className="text-xs text-slate-400">{fmtDate(d.createdAt)}</p>
                  </div>
                </div>
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
