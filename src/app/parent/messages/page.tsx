'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, Send, RefreshCw, Inbox, Mail } from 'lucide-react'

interface Message {
  id: string
  subject: string
  content: string
  senderId: string
  senderType: string
  recipientId: string
  recipientType: string
  isRead: boolean
  createdAt: string
  parentId: string | null
}

interface Child { id: string; name: string }

export default function ParentMessages() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)
  const [composing, setComposing] = useState(false)
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')

  // Compose form
  const [form, setForm] = useState({ subject: '', content: '', recipientId: '', recipientType: 'TEACHER' })
  const [sending, setSending] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const [msgRes, childRes] = await Promise.all([
        fetch('/api/parent/messages'),
        fetch('/api/parent/children'),
      ])
      if (msgRes.ok) {
        const { messages: raw } = await msgRes.json()
        setMessages(raw || [])
      }
      if (childRes.ok) {
        const { children: raw } = await childRes.json()
        const kids = raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` }))
        setChildren(kids)
        // Build teacher list from children's teacher info (would need teacher route — use kids' teacher IDs)
        // For now just use a placeholder until teacher lookup is available
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMessages() }, [])

  const markRead = async (msg: Message) => {
    if (!msg.isRead) {
      await fetch('/api/parent/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
    }
    setSelected(msg)
    setReplyContent('')
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim() || !form.subject.trim() || !form.recipientId) return
    setSending(true)
    try {
      const res = await fetch('/api/parent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setComposing(false)
        setForm({ subject: '', content: '', recipientId: '', recipientType: 'TEACHER' })
        await fetchMessages()
      }
    } finally { setSending(false) }
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch('/api/parent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Re: ${selected.subject}`,
          content: replyContent,
          recipientId: selected.senderId,
          recipientType: selected.senderType,
          parentId: selected.id,
        }),
      })
      if (res.ok) {
        setReplyContent('')
        await fetchMessages()
      }
    } finally { setSending(false) }
  }

  const inbox = messages.filter(m => m.recipientId === session?.user?.id && m.recipientType === 'PARENT')
  const sent  = messages.filter(m => m.senderId === session?.user?.id && m.senderType === 'PARENT')
  const displayed = tab === 'inbox' ? inbox : sent
  const unread = inbox.filter(m => !m.isRead).length

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm mt-0.5">Communicate with your children's teachers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMessages} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
          <button
            onClick={() => { setComposing(true); setSelected(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Send className="h-4 w-4" /> Compose
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Message list */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([['inbox', 'Inbox', unread], ['sent', 'Sent', 0]] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
                {Number(count) > 0 && (
                  <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{count}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayed.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => markRead(msg)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === msg.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate ${!msg.isRead && tab === 'inbox' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {msg.subject}
                    </p>
                    {!msg.isRead && tab === 'inbox' && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(msg.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message view / compose */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px]">
          {composing ? (
            <form onSubmit={sendMessage} className="space-y-4 h-full flex flex-col">
              <h2 className="font-semibold text-slate-800">New Message</h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">To (Teacher User ID)</label>
                <input
                  type="text"
                  value={form.recipientId}
                  onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))}
                  placeholder="Paste teacher's user ID (ask school admin)"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="What's this about?"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Message</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your message..."
                  rows={7}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setComposing(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={sending} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          ) : selected ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>From: {selected.senderType}</span>
                  <span>{fmtDate(selected.createdAt)}</span>
                </div>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>

              {/* Reply */}
              <form onSubmit={sendReply} className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-600">Reply</label>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button type="submit" disabled={sending || !replyContent.trim()} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Mail className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Select a message to read</p>
              <p className="text-slate-400 text-sm mt-1">or compose a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
