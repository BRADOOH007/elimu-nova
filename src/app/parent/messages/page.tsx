"use client"

import { useEffect, useState } from "react"
import { Send, RefreshCw, Inbox, Mail, Bell } from "lucide-react"
import { ClientDate } from "@/components/ui/client-date"
import NotificationsTab from '@/components/notifications-tab'

interface Message {
  id: string; subject: string; content: string; senderId: string
  senderType: string; recipientId: string; recipientType: string
  isRead: boolean; createdAt: string; parentId: string | null
  senderName?: string; recipientName?: string
}

export default function ParentMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [parentId, setParentId] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)
  const [composing, setComposing] = useState(false)
  const [tab, setTab] = useState<"inbox" | "sent">("inbox")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [form, setForm] = useState({ subject: "", content: "", recipientId: "", recipientType: "TEACHER" })
  const [sending, setSending] = useState(false)
  const [replyContent, setReplyContent] = useState("")

  const fetchMessages = async () => {
    try {
      const [msgRes, teacherRes] = await Promise.all([
        fetch(`/api/parent/messages?page=${page}&limit=20`),
        fetch("/api/parent/teachers"),
      ])
      if (msgRes.ok) {
        const { messages: raw, parentId: pid, pagination } = await msgRes.json()
        setMessages(raw || []); setParentId(pid || null); setTotalPages(pagination?.totalPages || 1)
      }
      if (teacherRes.ok) {
        const { teachers: raw } = await teacherRes.json()
        setTeachers(raw || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [msgRes, teacherRes] = await Promise.all([
          fetch(`/api/parent/messages?page=${page}&limit=20`),
          fetch("/api/parent/teachers"),
        ])
        if (cancelled) return
        if (msgRes.ok) {
          const { messages: raw, parentId: pid, pagination } = await msgRes.json()
          setMessages(raw || []); setParentId(pid || null); setTotalPages(pagination?.totalPages || 1)
        }
        if (teacherRes.ok) {
          const { teachers: raw } = await teacherRes.json()
          setTeachers(raw || [])
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [page])

  const markRead = async (msg: Message) => {
    if (!msg.isRead) {
      await fetch("/api/parent/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id }),
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
    }
    setSelected(msg)
    setReplyContent("")
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim() || !form.subject.trim() || !form.recipientId) return
    setSending(true)
    try {
      const res = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setComposing(false)
        setForm({ subject: "", content: "", recipientId: "", recipientType: "TEACHER" })
        await fetchMessages()
      }
    } finally { setSending(false) }
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Re: ${selected.subject}`, content: replyContent,
          recipientId: selected.senderId, recipientType: selected.senderType, parentId: selected.id,
        }),
      })
      if (res.ok) { setReplyContent(""); await fetchMessages() }
    } finally { setSending(false) }
  }

  const inbox = messages.filter(m => m.recipientId === parentId && m.recipientType === "PARENT")
  const sent = messages.filter(m => m.senderId === parentId && m.senderType === "PARENT")
  const displayed = tab === "inbox" ? inbox : sent
  const unread = inbox.filter(m => !m.isRead).length

  const [view, setView] = useState<'messages' | 'notifications'>('messages')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('messages')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${view==='messages'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>
              Inbox
            </button>
            <button onClick={() => setView('notifications')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${view==='notifications'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>
              <Bell className="w-3 h-3 inline mr-1" />Notifications
            </button>
          </div>
        </div>
        {view === 'messages' && (
          <div className="flex items-center gap-2">
            <button onClick={fetchMessages} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
            <button onClick={() => { setComposing(true); setSelected(null) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              <Send className="h-4 w-4" /> Compose
            </button>
          </div>
        )}
      </div>

      {view === 'notifications' ? (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <NotificationsTab compact />
        </div>
      ) : (
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        {/* Left panel - message list */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([["inbox", "Inbox", unread], ["sent", "Sent", 0]] as const).map(([key, label, count]) => (
              <button key={key} onClick={() => { setTab(key); setPage(1) }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/60"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                {label}
                {Number(count) > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">{count}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Inbox className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No messages</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {displayed.map(msg => (
                <button key={msg.id} onClick={() => markRead(msg)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                    selected?.id === msg.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  } ${!msg.isRead && tab === "inbox" ? "bg-blue-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate ${!msg.isRead && tab === "inbox" ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                      {msg.subject}
                    </p>
                    {!msg.isRead && tab === "inbox" && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <ClientDate date={msg.createdAt} className="text-xs text-slate-400 mt-1" />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tab === "inbox" ? (msg.senderName || msg.senderType) : (msg.recipientName || msg.recipientType)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Previous
              </button>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right panel - message view / compose */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 min-h-[500px]">
          {composing ? (
            <form onSubmit={sendMessage} className="space-y-4 h-full flex flex-col">
              <h2 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">New Message</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">To (Teacher)</label>
                <select value={form.recipientId} onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
                {teachers.length === 0 && <p className="text-xs text-amber-600 mt-1">No teachers found for your children</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
                <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="What's this about?" required
                  className="w-full h-11 px-3.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your message..." rows={8} required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button type="button" onClick={() => setComposing(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={sending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60">
                  <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          ) : selected ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{selected.subject}</h2>
                  <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Back to list</button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                  <span className="font-medium">From: {selected.senderName || selected.senderType}</span>
                  <ClientDate date={selected.createdAt} />
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>

              {/* Reply */}
              <form onSubmit={sendReply} className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-600">Reply</label>
                <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
                  placeholder="Write a reply..." rows={4}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button type="submit" disabled={sending || !replyContent.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60">
                  <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">Select a message to read</p>
              <p className="text-slate-400 text-sm mt-1">or compose a new one</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
