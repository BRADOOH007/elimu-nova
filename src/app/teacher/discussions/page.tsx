'use client'

import { useEffect, useState } from 'react'
import {
  MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle,
  Users, RefreshCw, Send, Loader2, Filter
} from 'lucide-react'

interface Discussion {
  id: string; topic: string; message: string
  senderName: string; senderRole: string; senderId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string; readAt: string | null
}

type Tab = 'pending' | 'approved' | 'all'

export default function TeacherDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('pending')
  const [acting, setActing]           = useState<string | null>(null)
  const [reply, setReply]             = useState<Record<string, string>>({})
  const [sending, setSending]         = useState<string | null>(null)

  const load = async (status: Tab = tab) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/discussions?status=${status}`)
      const data = await res.json()
      setDiscussions(data.discussions || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load(tab) }, [tab])

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActing(id)
    try {
      await fetch('/api/discussions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, action }),
      })
      setDiscussions(prev => prev.filter(d => d.id !== id))
    } finally { setActing(null) }
  }

  const sendReply = async (d: Discussion) => {
    const text = reply[d.id]?.trim()
    if (!text) return
    setSending(d.id)
    try {
      await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: d.topic,
          message: text,
          recipientId: d.senderId,
          recipientType: d.senderRole,
        }),
      })
      setReply(prev => ({ ...prev, [d.id]: '' }))
    } finally { setSending(null) }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const filtered = discussions.filter(d => {
    if (tab === 'pending')  return d.status === 'pending'
    if (tab === 'approved') return d.status === 'approved'
    return true
  })

  const pendingCount = discussions.filter(d => d.status === 'pending').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discussion Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and moderate student messages before they go live</p>
        </div>
        <button onClick={() => load(tab)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ['pending',  `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}`, Clock],
          ['approved', 'Approved', CheckCircle],
          ['all',      'All',      MessageSquare],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">
            {tab === 'pending' ? 'No messages waiting for review' : 'No messages here yet'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {tab === 'pending' ? 'All caught up!' : 'Students can post from their Discussion page'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(d => (
            <div key={d.id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${
              d.status === 'pending' ? 'border-amber-200' : 'border-slate-200'
            }`}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {d.senderName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.senderName}</p>
                    <p className="text-xs text-slate-400">{d.senderRole} · {fmtDate(d.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === 'pending' && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Pending review
                    </span>
                  )}
                  {d.status === 'approved' && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Approved
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{d.topic}</p>
                <p className="text-slate-700 leading-relaxed">{d.message}</p>
              </div>

              {/* Actions for pending */}
              {d.status === 'pending' && (
                <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => act(d.id, 'approve')}
                    disabled={acting === d.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors"
                  >
                    {acting === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => act(d.id, 'reject')}
                    disabled={acting === d.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}

              {/* Reply box for approved */}
              {d.status === 'approved' && (
                <div className="px-5 pb-4 flex gap-2 border-t border-slate-100 pt-3">
                  <input
                    value={reply[d.id] || ''}
                    onChange={e => setReply(prev => ({ ...prev, [d.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && sendReply(d)}
                    placeholder="Reply to this discussion..."
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => sendReply(d)}
                    disabled={!reply[d.id]?.trim() || sending === d.id}
                    className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity"
                  >
                    {sending === d.id
                      ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                      : <Send className="h-4 w-4 text-white" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
