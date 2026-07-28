"use client"

import { useState, useEffect } from 'react'
import {
  Mail, Search, Loader2, ChevronLeft, ChevronRight, RefreshCw,
  MessageSquare, User, Calendar, CheckCheck, Eye, Trash2, Inbox, Sparkles
} from "lucide-react"
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

interface Message {
  id: string; firstName: string; lastName: string; email: string
  subject: string; message: string; isRead: boolean; createdAt: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Message | null>(null)

  const fetchMessages = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: '20' })
      if (filter) params.set('read', filter)
      const res = await fetch(`/api/contact-messages?${params}`)
      const data = await res.json()
      setMessages(data.messages)
      setUnread(data.unread)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
      setPage(data.pagination.page)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchMessages(1) }, [filter])

  const markRead = async (ids: string[]) => {
    await fetch('/api/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, isRead: true }),
    })
    fetchMessages(page)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" /> ADMIN
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Messages</h1>
              <p className="text-slate-400 text-sm mt-1">Contact form submissions from visitors</p>
            </div>
            <button onClick={() => fetchMessages(page)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all backdrop-blur-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-emerald-400">{unread}</p>
              <p className="text-xs text-slate-400">Unread</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {[
          { label: 'All', value: null },
          { label: 'Unread', value: 'false' },
          { label: 'Read', value: 'true' },
        ].map(f => (
          <button key={f.label} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : selected ? (
        /* Detail view */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <button onClick={() => setSelected(null)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">&larr; Back</button>
            {!selected.isRead && (
              <button onClick={() => markRead([selected.id])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark Read
              </button>
            )}
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{selected.subject}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {selected.firstName} {selected.lastName} &lt;{selected.email}&gt;
                &middot; {timeAgo(selected.createdAt)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            </div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No messages</h3>
          <p className="text-sm text-slate-400">No contact form submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} onClick={() => setSelected(m)}
              className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                m.isRead ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/30'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  m.isRead ? 'bg-slate-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                }`}>
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{m.firstName} {m.lastName}</span>
                    {!m.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    <span className="text-xs text-slate-400 ml-auto">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{m.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-3">
          <p className="text-sm text-slate-500">{total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchMessages(page - 1)} disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-600">Page {page} of {pages}</span>
            <button onClick={() => fetchMessages(page + 1)} disabled={page === pages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
