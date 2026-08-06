'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Loader2, Users, Shield, Smile, ShieldAlert } from 'lucide-react'
import { containsProfanity } from '@/lib/profanity-filter'

interface Discussion {
  id: string; topic: string; message: string
  senderName: string; senderRole: string; senderId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string; flagged?: boolean
}

const TOPICS = ['General', 'Question', 'Help', 'Resource', 'Other']
const EMOJIS = ['😊','👍','🎉','💡','📚','🔥','❤️','✅','🤔','👋','🙌','✨','😂','😍','🥳','🙏','💪','🌟','📖','💬']

const PARTICIPANTS = [
  { name: 'Jane Student', color: 'from-blue-500 to-purple-600' },
  { name: 'Mike M.', color: 'from-teal-500 to-emerald-600' },
  { name: 'Alice K.', color: 'from-amber-500 to-orange-600' },
  { name: 'David O.', color: 'from-pink-500 to-rose-600' },
  { name: 'Sarah W.', color: 'from-indigo-500 to-violet-600' },
  { name: 'Brian N.', color: 'from-cyan-500 to-blue-600' },
  { name: 'Faith C.', color: 'from-purple-500 to-pink-600' },
  { name: 'Tom L.', color: 'from-green-500 to-teal-600' },
]

export default function StudentDiscussions() {
  const { data: session } = useSession()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState('General')
  const [posting, setPosting] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [profanityWarning, setProfanityWarning] = useState(false)
  const [onlineCount, setOnlineCount] = useState(8)
  const bottomRef = useRef<HTMLDivElement>(null)

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
    const i = setInterval(load, 15000)
    return () => clearInterval(i)
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [discussions])

  const send = async () => {
    if (!message.trim() || posting) return
    setProfanityWarning(false)
    if (containsProfanity(message)) { setProfanityWarning(true); setTimeout(() => setProfanityWarning(false), 5000); return }
    setPosting(true); setFlagged(false)
    try {
      const res = await fetch('/api/discussions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, message }) })
      if (res.ok) {
        const data = await res.json()
        if (data.discussion?.flagged) setFlagged(true)
        setMessage(''); setShowEmoji(false)
        setTimeout(() => setFlagged(false), 4000)
        await load()
      }
    } catch { /* ignore */ }
    finally { setPosting(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const insertEmoji = (emoji: string) => { setMessage(p => p + emoji); setShowEmoji(false) }

  const fmtTime = (iso: string) => {
    const d = new Date(iso); const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()
  const avatarColor = (name: string) => {
    const colors = ['from-blue-500 to-purple-600','from-teal-500 to-emerald-600','from-amber-500 to-orange-600','from-pink-500 to-rose-600','from-indigo-500 to-violet-600','from-cyan-500 to-blue-600','from-purple-500 to-pink-600','from-green-500 to-teal-600']
    const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
    return colors[i]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" />Student Lounge</h1>
            <p className="text-slate-500 text-sm">Live Community Chat</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">{onlineCount} Online</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-purple-500" /><span className="text-xs font-semibold text-purple-700">Moderated & Safe</span>
            </div>
          </div>
        </div>

        {/* Active participants row */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex -space-x-2 overflow-hidden">
            {PARTICIPANTS.slice(0, 5).map((p, i) => (
              <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.color} ring-2 ring-white flex items-center justify-center border border-white`} title={p.name}>
                <span className="text-[10px] font-bold text-white">{getInitials(p.name)}</span>
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500">+{onlineCount - 5}</span>
            </div>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />{onlineCount} students active now</span>
        </div>
      </div>

      {/* Moderation banner */}
      <div className="shrink-0 mx-4 sm:mx-6 mb-2 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
        <Shield className="h-4 w-4 text-purple-500 shrink-0" />
        <p className="text-xs text-purple-700">Monitored Room — Messages are filtered in real-time to keep Elimu Nova AI a safe learning space for everyone.</p>
      </div>

      {flagged && (
        <div className="shrink-0 mx-4 sm:mx-6 mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 animate-in fade-in"><Shield className="h-4 w-4 text-amber-500 shrink-0" /><p className="text-xs text-amber-700">Message filtered. Keep it respectful.</p></div>
      )}
      {profanityWarning && (
        <div className="shrink-0 mx-4 sm:mx-6 mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 animate-in fade-in"><ShieldAlert className="h-4 w-4 text-red-500 shrink-0" /><p className="text-xs text-red-700">Message contains restricted words and was flagged for review.</p></div>
      )}

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto mx-4 sm:mx-6 mb-2 p-4 space-y-4 bg-slate-50/60 rounded-3xl border border-slate-200/80 shadow-inner">
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
            const name = d.senderName && d.senderName !== 'Unknown' ? d.senderName : 'Student'
            return (
              <div key={d.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe ? (
                  <div className="flex gap-3 max-w-[90%]">
                    {showAvatar ? (
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center shrink-0 mt-1 ring-2 ring-white shadow-sm`}>
                        <span className="text-white text-[10px] font-bold">{getInitials(name)}</span>
                      </div>
                    ) : <div className="w-9 shrink-0" />}
                    <div>
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-800">{name}</p>
                          <span className="text-[10px] text-slate-400 font-medium">Student</span>
                        </div>
                      )}
                      <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-slate-100 shadow-sm text-slate-800 max-w-lg">
                        <p className="text-sm leading-relaxed">{d.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{d.topic}</span>
                          <span className="text-[10px] text-slate-400">{fmtTime(d.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-[10px] text-slate-400">{fmtTime(d.createdAt)}</span>
                      <p className="text-sm font-semibold text-slate-800">{name}</p>
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center ring-2 ring-white shadow-sm`}>
                        <span className="text-white text-[9px] font-bold">{getInitials(name)}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-xs shadow-md max-w-lg">
                      <p className="text-sm leading-relaxed">{d.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{d.topic}</span>
                      </div>
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
        {/* Topic chips */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto">
          {TOPICS.map(t => (
            <button key={t} onClick={() => setTopic(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${topic === t ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>
          ))}
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-xl transition-colors ${showEmoji ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
              <Smile className="h-5 w-5" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 grid grid-cols-5 gap-1.5 z-10 w-[240px]">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xl transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent text-sm focus:outline-none min-h-[32px] max-h-24 py-1.5"
          />
          <button onClick={send} disabled={posting || !message.trim()}
            className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 transition-all shrink-0 disabled:opacity-40 shadow-sm">
            {posting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
