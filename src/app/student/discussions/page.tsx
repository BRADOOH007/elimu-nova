'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Loader2, CheckCircle, Users, Shield, Smile } from 'lucide-react'

interface Discussion {
  id: string; topic: string; message: string
  senderName: string; senderRole: string; senderId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string; flagged?: boolean
}

const EMOJIS = ['😊','👍','🎉','💡','📚','🔥','❤️','✅','🤔','👋','🙌','✨']

export default function StudentDiscussions() {
  const { data: session } = useSession()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState('General')
  const [posting, setPosting] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [onlineCount, setOnlineCount] = useState(8)
  const bottomRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentUserId = session?.user?.id || ''
  const currentUserName = session?.user?.name || 'You'

  const load = async () => {
    try {
      const res = await fetch('/api/discussions?status=all')
      const data = await res.json()
      setDiscussions((data.discussions || []).filter((d: Discussion) => d.status === 'approved'))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    intervalRef.current = setInterval(load, 15000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [discussions])

  const send = async () => {
    if (!message.trim() || posting) return
    const text = `${topic}: ${message}`
    setPosting(true); setFlagged(false)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, message }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.discussion?.flagged) setFlagged(true)
        setMessage('')
        setShowEmoji(false)
        setTimeout(() => setFlagged(false), 4000)
        await load()
      }
    } catch { /* ignore */ }
    finally { setPosting(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const insertEmoji = (emoji: string) => {
    setMessage(p => p + emoji)
    setShowEmoji(false)
  }

  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  const avatarColor = (name: string) => {
    const colors = ['from-blue-500 to-purple-600','from-teal-500 to-emerald-600','from-amber-500 to-orange-600','from-pink-500 to-rose-600','from-indigo-500 to-violet-600','from-cyan-500 to-blue-600']
    const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
    return colors[i]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />Student Lounge
            </h1>
            <p className="text-slate-500 text-sm">Live Community Chat</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">{onlineCount} Online</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700">Moderated & Safe</span>
            </div>
          </div>
        </div>
      </div>

      {flagged && (
        <div className="shrink-0 mx-4 sm:mx-6 mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <Shield className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Message filtered. Keep it respectful.</p>
        </div>
      )}

      {/* Chat Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto mx-4 sm:mx-6 mb-2 p-4 space-y-4 bg-slate-50/50 rounded-2xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400">Be the first to say hello!</p>
          </div>
        ) : (
          discussions.map((d, i) => {
            const isMe = d.senderId === currentUserId || d.senderName === currentUserName
            const showAvatar = i === 0 || discussions[i - 1]?.senderName !== d.senderName
            return (
              <div key={d.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe ? (
                  <div className="flex gap-2.5 max-w-[80%]">
                    {showAvatar ? (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(d.senderName)} flex items-center justify-center shrink-0 mt-1`}>
                        <span className="text-white text-xs font-bold">{getInitials(d.senderName)}</span>
                      </div>
                    ) : <div className="w-8 shrink-0" />}
                    <div className="min-w-0">
                      {showAvatar && <p className="text-xs font-semibold text-slate-700 mb-1">{d.senderName}</p>}
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-xs">
                        <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-1">{d.topic}</p>
                        <p className="text-sm text-slate-700">{d.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5">{fmtTime(d.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-none shadow-xs">
                      <p className="text-[10px] font-semibold text-purple-200 uppercase tracking-wide mb-1">{d.topic}</p>
                      <p className="text-sm">{d.message}</p>
                      <p className="text-[10px] text-purple-200 mt-1.5">{fmtTime(d.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="shrink-0 px-4 sm:px-6 pb-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-end gap-2">
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-xl transition-colors ${showEmoji ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Smile className="h-5 w-5" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 grid grid-cols-6 gap-1 z-10">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-lg">{e}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-1.5 mb-1.5">
              {['General','Question','Help','Resource','Other'].map(t => (
                <button key={t} onClick={() => setTopic(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${topic === t ? 'bg-purple-100 border-purple-300 text-purple-700 font-semibold' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none border-0 bg-transparent text-sm focus:outline-none min-h-[24px] max-h-24 p-0"
            />
          </div>
          <button onClick={send} disabled={posting || !message.trim()}
            className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 transition-colors shrink-0 disabled:opacity-40">
            {posting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
