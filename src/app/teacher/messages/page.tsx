'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail, Send, Inbox, Search, Clock, Reply,
  MessageSquare, Loader2, Bell, CheckCheck
} from 'lucide-react'
import ComposeMessageModal from '@/components/modals/compose-message-modal'
import { useSSE } from '@/hooks/use-sse'
import { ClientDate, ClientDateTime } from '@/components/ui/client-date'

const NotifTab = dynamic(() => import('@/app/teacher/notifications/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div> })
const DiscTab  = dynamic(() => import('@/app/teacher/discussions/page'),   { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div> })

interface Message {
  id: string
  from: { name: string; role: string; avatar?: string }
  subject: string
  content: string
  timestamp: string
  read: boolean
  isSent: boolean
  hasReplies: boolean
  attachments: string[]
  senderId: string
  senderType: string
}

export default function TeacherMessagesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [messages, setMessages]     = useState<Message[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Message | null>(null)
  const [filter, setFilter]         = useState<'all' | 'unread' | 'sent'>('all')
  const [search, setSearch]         = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [students, setStudents]     = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [parents, setParents]       = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [reply, setReply]           = useState('')
  const [sending, setSending]       = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch('/api/teacher/messages')
      const d = await r.json()
      if (d.messages) setMessages(d.messages)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetch('/api/teacher/students').then(r => r.json()).then(d => {
      if (d.students) setStudents(d.students.map((s: any) => ({ id: s.id, name: s.name, email: s.email })))
    }).catch(() => {})
    fetch('/api/teacher/parents').then(r => r.json()).then(d => {
      if (d.parents) setParents(d.parents.map((p: any) => ({ id: p.id, name: p.name, email: p.email })))
    }).catch(() => {})
  }, [fetchMessages])

  useSSE(
    session?.user?.role === 'TEACHER' ? 'messages:teacher:' + session.user.id : null,
    { 'message-sent': fetchMessages, 'new-message': fetchMessages }
  )

  const openMessage = async (msg: Message) => {
    setSelected(msg)
    setReply('')
    if (!msg.read && !msg.isSent) {
      try {
        await fetch('/api/teacher/messages', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: msg.id })
        })
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
      } catch { /* silent */ }
    }
  }

  const handleReply = async () => {
    if (!selected || !reply.trim()) return
    if (!['STUDENT', 'PARENT'].includes(selected.senderType)) {
      toast({ variant: 'destructive', title: 'Can only reply to students or parents' }); return
    }
    setSending(true)
    try {
      const r = await fetch('/api/teacher/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selected.senderId,
          subject: `Re: ${selected.subject}`,
          content: reply.trim(),
          recipientType: selected.senderType,
          parentId: selected.id,
        }),
      })
      if (!r.ok) throw new Error('Failed')
      toast({ title: '✅ Reply sent!' })
      setReply('')
      await fetchMessages()
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send reply' })
    } finally { setSending(false) }
  }

  const handleSend = async (data: any) => {
    if (!data.recipientId) throw new Error('Please select a recipient')
    const r = await fetch('/api/teacher/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
    await fetchMessages()
  }

  const filtered = messages.filter(m => {
    const matchFilter = filter === 'all' ? true : filter === 'unread' ? (!m.read && !m.isSent) : m.isSent
    const matchSearch = !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.from.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const unreadCount = messages.filter(m => !m.read && !m.isSent).length
  const canReply = selected ? ['STUDENT', 'PARENT'].includes(selected.senderType) : false

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <Tabs defaultValue="messages" className="flex flex-col flex-1 min-h-0">
        {/* Tab header */}
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
              <TabsTrigger value="discussions" className="text-xs h-7"><MessageSquare className="w-3.5 h-3.5 mr-1.5"/>Discussions</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={() => setShowCompose(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 h-8 text-xs">
              <Send className="w-3.5 h-3.5 mr-1.5"/>New Message
            </Button>
          </div>
        </div>

        {/* Messages tab — 2-column layout */}
        <TabsContent value="messages" className="flex-1 flex min-h-0 m-0">
          {/* Left: list */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
            {/* Filter + search */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"/>
              </div>
              <div className="flex gap-1">
                {(['all','unread','sent'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-colors capitalize ${filter===f?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-100'}`}>
                    {f}{f==='unread'&&unreadCount>0?` (${unreadCount})`:''}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-500"/></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm font-medium">No messages</p>
                </div>
              ) : filtered.map(msg => (
                <button key={msg.id} onClick={() => openMessage(msg)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors ${selected?.id===msg.id?'bg-blue-50 border-l-2 border-l-blue-500':'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-sm truncate ${!msg.read&&!msg.isSent?'font-bold text-slate-900':'font-medium text-slate-600'}`}>
                      {msg.isSent ? `→ ${msg.from.name}` : msg.from.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {!msg.read&&!msg.isSent&&<span className="w-2 h-2 bg-blue-500 rounded-full"/>}
                      {msg.isSent&&<Badge className="text-[9px] h-4 bg-green-100 text-green-700 px-1">Sent</Badge>}
                      <ClientDate date={msg.timestamp} className="text-[10px] text-slate-400" />
                    </div>
                  </div>
                  <p className={`text-xs truncate mb-0.5 ${!msg.read&&!msg.isSent?'font-semibold text-slate-800':'text-slate-600'}`}>{msg.subject}</p>
                  <p className="text-xs text-slate-400 truncate">{msg.content}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: full message + reply */}
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
                      <p className="text-xs text-slate-500 capitalize">{selected.from.role?.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                      {selected.read && <span className="flex items-center gap-1 text-green-600"><CheckCheck className="h-3.5 w-3.5"/>Read</span>}
                      <Clock className="h-3.5 w-3.5"/>
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

                {/* Reply box — only for student/parent messages */}
                {canReply ? (
                  <div className="px-6 py-4 bg-white border-t border-slate-200 shrink-0">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-blue-500"/>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reply to {selected.from.name}</span>
                      </div>
                      <div className="flex gap-3 items-end">
                        <Textarea ref={replyRef} value={reply} onChange={e => setReply(e.target.value)}
                          placeholder={`Reply to ${selected.from.name}…`} rows={3}
                          className="flex-1 resize-none border-slate-200 bg-slate-50 focus:bg-white text-sm"
                          onKeyDown={e => { if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)) handleReply() }}/>
                        <Button onClick={handleReply} disabled={sending||!reply.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 h-10 px-5 shrink-0">
                          {sending?<Loader2 className="h-4 w-4 animate-spin"/>:<><Send className="h-4 w-4 mr-1.5"/>Send</>}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">Ctrl+Enter to send</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-3 bg-white border-t border-slate-100 shrink-0">
                    <p className="text-xs text-slate-400 text-center">This is a sent message — no reply needed</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Mail className="h-16 w-16 mb-4 opacity-20"/>
                <p className="text-sm font-medium">Select a message to read</p>
                <p className="text-xs mt-1 opacity-70">Your conversations appear here</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 overflow-y-auto m-0 p-0"><NotifTab/></TabsContent>
        <TabsContent value="discussions"   className="flex-1 overflow-y-auto m-0 p-0"><DiscTab/></TabsContent>
      </Tabs>

      <ComposeMessageModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSend}
        recipientType="STUDENT"
        showRecipientTypeSelector={true}
        studentRecipients={students}
        parentRecipients={parents}
      />
    </div>
  )
}
