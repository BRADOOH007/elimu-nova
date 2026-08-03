'use client'

import { useToast } from '@/hooks/use-toast'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Radio, MessageSquare, Send, Users, Loader2, Sparkles, Eye, Video, Hand, HandMetal } from 'lucide-react'

interface LiveSession {
  id: string; title: string; subject: string; status: string
  metadata: { boardContent: string; chat: ChatMsg[]; participants: Participant[]; sessionCode: string; startedAt: string; meetingLink?: string }
  teacher?: { user: { firstName: string; lastName: string } }
}
interface ChatMsg { userId: string; name: string; message: string; ts: string; isAI?: boolean }
interface Participant { userId: string; name: string; joinedAt: string; handRaised?: boolean }

export default function StudentLiveClass() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([])
  const [joinedSession, setJoinedSession] = useState<LiveSession | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [boardImg, setBoardImg] = useState('')
  const [handRaised, setHandRaised] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout>(null)

  // Auto-fill code from URL and auto-join
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCodeInput(urlCode.toUpperCase())
    }
  }, [searchParams])

  const openMeetingPopup = (url: string) => {
    const w = 800, h = 700
    window.open(url, 'meeting-popup', `width=${w},height=${h},left=${(screen.width-w)/2},top=${(screen.height-h)/2},menubar=no,toolbar=no,location=yes`)
  }

  const getJitsiUrl = (baseUrl: string, displayName: string) => {
    const encodedName = encodeURIComponent(displayName)
    return `${baseUrl}#config.prejoinPageEnabled=false&userInfo.displayName="${encodedName}"`
  }

  useEffect(() => {
    loadActiveSessions()
    const listPoll = setInterval(loadActiveSessions, 10000)
    return () => clearInterval(listPoll)
  }, [])

  // Auto-join when URL has code and sessions are loaded
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (!urlCode || activeSessions.length === 0 || joinedSession) return
    const found = activeSessions.find(s => s.metadata?.sessionCode === urlCode.toUpperCase())
    if (found) joinSession(found)
  }, [activeSessions, searchParams, joinedSession])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (!joinedSession) return
    pollRef.current = setInterval(pollSession, 3000)
    return () => clearInterval(pollRef.current!)
  }, [joinedSession?.id])

  const loadActiveSessions = async () => {
    try {
      const res  = await fetch('/api/live-session')
      const data = await res.json()
      setActiveSessions((data.sessions || []).filter((s: LiveSession) => s.status !== 'COMPLETED'))
    } finally { setLoading(false) }
  }

  const pollSession = async () => {
    if (!joinedSession) return
    try {
      const res  = await fetch(`/api/live-session?sessionId=${joinedSession.id}`)
      const data = await res.json()
      if (data.session) {
        const meta = data.session.metadata || {}
        setChatMessages(meta.chat || [])
        if (meta.boardContent) setBoardImg(meta.boardContent)
        if (data.session.status === 'COMPLETED') {
          clearInterval(pollRef.current!)
          setJoinedSession(null)
        }
      }
    } catch { toast({ variant: 'destructive', title: 'Connection error', description: 'Failed to sync session updates' }) }
  }

  const joinSession = async (sess: LiveSession) => {
    // Register as participant
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sess.id,
        action: 'join',
        data: { userId: session?.user?.id, name: session?.user?.name || 'Student' },
      }),
    })
    setJoinedSession(sess)
    setChatMessages(sess.metadata?.chat || [])
    setBoardImg(sess.metadata?.boardContent || '')
    // Auto-open Jitsi popup with student's name
    if (sess.metadata?.meetingLink) {
      openMeetingPopup(getJitsiUrl(sess.metadata.meetingLink, session?.user?.name || 'Student'))
    }
  }

  const joinByCode = async () => {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    const found = activeSessions.find(s => s.metadata?.sessionCode === code)
    if (found) { joinSession(found); return }
    toast({ variant:'destructive', title:'Session not found', description:'Ask your teacher to share the session code.' })
  }

  const toggleHand = async () => {
    if (!joinedSession) return
    const action = handRaised ? 'lowerHand' : 'raiseHand'
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: joinedSession.id, action, data: { userId: session?.user?.id, name: session?.user?.name || 'Student' } }),
    })
    setHandRaised(!handRaised)
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || !joinedSession) return
    setChatInput('')
    const msg: ChatMsg = { userId: session?.user?.id || '', name: session?.user?.name || 'Student', message: text, ts: new Date().toISOString() }
    setChatMessages(m => [...m, msg])
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: joinedSession.id, action: 'addChat', data: msg }),
    })
  }

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  /* ── JOIN SCREEN ── */
  if (!joinedSession) return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Classes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Join your teacher's live session to participate in real time</p>
      </div>

      {/* Join by code */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="font-semibold text-slate-800 mb-3">Join with session code</p>
        <div className="flex gap-3">
          <input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinByCode()}
            placeholder="Enter 6-character code"
            maxLength={6}
            className="flex-1 h-11 px-4 border border-slate-200 rounded-xl text-lg font-mono tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
          <button onClick={joinByCode} disabled={!codeInput.trim()}
            className="px-6 h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
            Join Class
          </button>
        </div>
      </div>

      {/* Active sessions from your class */}
      <div>
        <p className="font-semibold text-slate-800 mb-3">Active sessions from your teacher</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl">
            <Radio className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">No live sessions right now</p>
            <p className="text-slate-400 text-xs mt-1">Your teacher will start one when class begins</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                    <p className="text-xs text-slate-400">{s.subject} · {s.metadata?.participants?.length || 0} joined</p>
                  </div>
                </div>
                <button onClick={() => joinSession(s)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                  <Video className="h-4 w-4" /> Join Class
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  /* ── IN SESSION ── */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
          <span className="font-semibold text-slate-800 text-sm">{joinedSession.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {joinedSession.metadata?.meetingLink && (
            <button onClick={() => openMeetingPopup(getJitsiUrl(joinedSession.metadata.meetingLink!, session?.user?.name || 'Student'))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
              <Video className="h-3.5 w-3.5" /> Open Video
            </button>
          )}
          <button onClick={toggleHand}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              handRaised
                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-transparent'
            }`}>
            <Hand className={`h-3.5 w-3.5 transition-transform duration-300 ${handRaised ? 'scale-110 fill-amber-500' : ''}`} />
            {handRaised ? 'Lower hand' : 'Raise hand'}
          </button>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {joinedSession.metadata?.participants?.length || 0} joined
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Board view */}
        <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center">
          {boardImg ? (
            <img src={boardImg} alt="Whiteboard" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-slate-300">
              <Eye className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Waiting for teacher to draw on the board...</p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
            Board refreshes every 3 seconds
          </div>
        </div>

        {/* Chat */}
        <div className="w-64 flex flex-col border-l border-slate-200 bg-white shrink-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" /> Chat
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-xs ${msg.isAI ? 'bg-purple-50 border border-purple-200' : msg.userId === session?.user?.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`font-semibold mb-0.5 ${msg.isAI ? 'text-purple-700' : 'text-slate-600'}`}>
                  {msg.isAI ? '✨ Hope AI' : msg.name}
                  <span className="font-normal text-slate-400 ml-1">{fmtTime(msg.ts)}</span>
                </p>
                <p className="text-slate-700 leading-relaxed">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-100 flex gap-1.5">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask a question..."
              className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={sendChat} disabled={!chatInput.trim()}
              className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center disabled:opacity-40">
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
