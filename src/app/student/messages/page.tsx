'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare, Send, Search, User, Clock, Loader2, Reply, CheckCheck, Bell, Mail
} from 'lucide-react'
import ComposeMessageModal from '@/components/modals/compose-message-modal'
import NotificationsTab from '@/components/notifications-tab'
import { ClientDate, ClientDateTime } from '@/components/ui/client-date'

interface Message {
  id: string
  from: { name: string; role: string; avatar?: string }
  subject: string
  content: string
  timestamp: string
  read: boolean
}

export default function StudentMessagesPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { fetchMessages() }, [page])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/student/messages?page=${page}&limit=25`)
      if (r.ok) { const d = await r.json(); setMessages(d.messages || []); setTotalPages(d.pagination?.totalPages || 1) }
    } catch { toast({ variant: 'destructive', title: 'Failed to load messages' }) }
    finally { setLoading(false) }
  }

  const openMessage = async (msg: Message) => {
    setSelected(msg)
    setReply('')
    if (!msg.read) {
      try {
        await fetch('/api/student/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: msg.id }),
        })
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
      } catch { /* mark-as-read errors are non-critical */ }
    }
  }

  const handleReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const r = await fetch('/api/student/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: 'teacher',
          subject: `Re: ${selected.subject}`,
          content: reply.trim(),
          recipientType: 'TEACHER',
          parentId: selected.id,
        }),
      })
      if (!r.ok) throw new Error('Failed to send')
      toast({ title: '✅ Reply sent!' })
      setReply('')
      await fetchMessages()
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send reply' })
    } finally { setSending(false) }
  }

  const handleNewMessage = async (data: any) => {
    const r = await fetch('/api/student/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: 'teacher', ...data }),
    })
    if (!r.ok) throw new Error('Failed to send')
    await fetchMessages()
  }

  const filtered = messages.filter(m =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from.name.toLowerCase().includes(search.toLowerCase())
  )

  const unreadCount = messages.filter(m => !m.read).length

  return (
    <>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <Tabs defaultValue="messages" className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Messages</h1>
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TabsList className="h-8">
                <TabsTrigger value="messages" className="text-xs h-7"><Mail className="w-3.5 h-3.5 mr-1.5"/>Messages</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs h-7"><Bell className="w-3.5 h-3.5 mr-1.5"/>Notifications</TabsTrigger>
              </TabsList>
              <Button
                onClick={() => setShowCompose(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 h-8 text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />New Message
              </Button>
            </div>
          </div>

          {/* Messages tab — 2-column layout */}
          <TabsContent value="messages" className="flex-1 flex min-h-0 m-0">

          {/* ── Left: Inbox list ── */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search messages…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No messages</p>
                  <p className="text-slate-400 text-xs mt-1">Messages from your teacher appear here</p>
                </div>
              ) : (
                filtered.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors ${
                      selected?.id === msg.id
                        ? 'bg-blue-50 border-l-2 border-l-blue-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-sm font-semibold truncate ${!msg.read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {msg.from.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {!msg.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <ClientDate date={msg.timestamp} className="text-[10px] text-slate-400" />
                      </div>
                    </div>
                    <p className={`text-xs truncate mb-0.5 ${!msg.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{msg.content}</p>
                  </button>
                ))
              )}
            </div>

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>

          {/* ── Right: Full message + inline reply ── */}
          <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
            {selected ? (
              <>
                {/* Message header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                      {selected.from.avatar ? <img src={selected.from.avatar} alt="" className="w-full h-full object-cover" /> : selected.from.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{selected.from.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{selected.from.role.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <ClientDateTime date={selected.timestamp} />
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-3">{selected.subject}</h2>
                </div>

                {/* Message body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 max-w-3xl">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                  </div>
                </div>

                {/* Inline reply box */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 shrink-0">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Reply to {selected.from.name}
                      </span>
                    </div>
                    <div className="flex gap-3 items-end">
                      <Textarea
                        ref={replyRef}
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        placeholder={`Reply to ${selected.from.name}…`}
                        rows={3}
                        className="flex-1 resize-none border-slate-200 bg-slate-50 focus:bg-white text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply()
                        }}
                      />
                      <Button
                        onClick={handleReply}
                        disabled={sending || !reply.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 h-10 px-5 shrink-0"
                      >
                        {sending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <><Send className="h-4 w-4 mr-1.5" />Send</>
                        }
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Ctrl+Enter to send</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">Select a message to read</p>
                <p className="text-xs mt-1 opacity-70">Your conversations appear here</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 overflow-y-auto m-0 p-0"><NotificationsTab compact /></TabsContent>
        </Tabs>
      </div>

      <ComposeMessageModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleNewMessage}
        recipientType="TEACHER"
      />
    </>
  )
}
