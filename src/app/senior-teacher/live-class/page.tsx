'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Radio, MessageSquare, Send, Users, Loader2, Video, Hand, Eraser, Pen, Copy, Check, X } from 'lucide-react'
import { GED_SUBJECTS } from '@/lib/constants/ged'

interface LiveSession {
  id: string; title: string; subject: string; status: string
  metadata: { boardContent: string; chat: ChatMsg[]; participants: Participant[]; sessionCode: string; startedAt: string; meetingLink?: string }
}
interface ChatMsg { userId: string; name: string; message: string; ts: string; isAI?: boolean }
interface Participant { userId: string; name: string; joinedAt: string; handRaised?: boolean }

type Tool = 'pen' | 'eraser'
const COLORS = ['#1e40af', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0f172a']

export default function SeniorTeacherLiveClass() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [title, setTitle] = useState('GED Live Lesson')
  const [subject, setSubject] = useState<string>(GED_SUBJECTS[0])
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1e40af')
  const [size, setSize] = useState(3)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (!liveSession) return
    pollRef.current = setInterval(pollSession, 3000)
    return () => clearInterval(pollRef.current!)
  }, [liveSession?.id])

  const pollSession = async () => {
    if (!liveSession) return
    try {
      const res = await fetch(`/api/live-session?sessionId=${liveSession.id}`)
      const data = await res.json()
      if (data.session) {
        const meta = data.session.metadata || {}
        setChatMessages(meta.chat || [])
        setParticipants(meta.participants || [])
      }
    } catch { /* silent */ }
  }

  const openMeetingPopup = (url: string) => {
    const w = 800, h = 700
    window.open(url, 'meeting-popup', `width=${w},height=${h},left=${(screen.width-w)/2},top=${(screen.height-h)/2},menubar=no,toolbar=no,location=yes`)
  }
  const getJitsiUrl = (baseUrl: string, displayName: string) => {
    const encodedName = encodeURIComponent(displayName)
    return `${baseUrl}#config.prejoinPageEnabled=false&userInfo.displayName="${encodedName}"`
  }

  const startSession = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to start' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setLiveSession(data.session)
      setChatMessages(data.session.metadata?.chat || [])
      setParticipants(data.session.metadata?.participants || [])
      if (data.session.metadata?.meetingLink) {
        openMeetingPopup(getJitsiUrl(data.session.metadata.meetingLink, session?.user?.name || 'Instructor'))
      }
    } catch (e) {
      toast({ title: 'Failed to start', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  const endSession = async () => {
    if (!liveSession) return
    if (!window.confirm('End this live lesson?')) return
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: liveSession.id, action: 'end', data: {} }),
    })
    clearInterval(pollRef.current!)
    setLiveSession(null)
  }

  const saveBoard = async () => {
    if (!canvasRef.current || !liveSession) return
    const boardContent = canvasRef.current.toDataURL()
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: liveSession.id, action: 'updateBoard', data: { boardContent } }),
    })
  }

  const sendChat = async (msg?: string) => {
    const text = (msg || chatInput).trim()
    if (!text || !liveSession) return
    setChatInput('')
    const chatMsg: ChatMsg = { userId: session?.user?.id || '', name: 'Instructor', message: text, ts: new Date().toISOString() }
    setChatMessages(m => [...m, chatMsg])
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: liveSession.id, action: 'addChat', data: chatMsg }),
    })
  }

  const askAI = async () => {
    if (!chatInput.trim() || !liveSession) return
    const question = chatInput.trim()
    setChatInput('')
    setAiLoading(true)
    setChatMessages(m => [...m, { userId: 'instructor', name: 'Instructor', message: question, ts: new Date().toISOString() }])
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, context: 'teacher_assistant' }),
      })
      const data = await res.json()
      const aiMsg: ChatMsg = { userId: 'ai', name: 'Hope AI', message: data.response || 'Let me think...', ts: new Date().toISOString(), isAI: true }
      setChatMessages(m => [...m, aiMsg])
      await fetch('/api/live-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: liveSession.id, action: 'addChat', data: aiMsg }),
      })
    } finally { setAiLoading(false) }
  }

  const copyCode = () => {
    if (liveSession?.metadata?.sessionCode) {
      navigator.clipboard.writeText(liveSession.metadata.sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrawing(true); lastPos.current = getPos(e)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    if (lastPos.current) ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
    lastPos.current = pos
  }
  const handlePointerUp = () => { setDrawing(false); lastPos.current = null; saveBoard() }

  /* ── SETUP ── */
  if (!liveSession) return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Teaching Room</h1>
        <p className="text-slate-500 text-sm mt-0.5">Start a live lesson — adult GED learners can join and interact in real time</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Lesson Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {GED_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={startSession} disabled={loading || !title.trim()}
          className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl disabled:opacity-60 transition-all">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          {loading ? 'Starting...' : 'Start Live Lesson'}
        </button>
      </div>
    </div>
  )

  /* ── LIVE ROOM ── */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
          <span className="font-semibold text-slate-800 text-sm">{liveSession.title}</span>
          <button onClick={copyCode} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Code: {liveSession.metadata?.sessionCode}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {liveSession.metadata?.meetingLink && (
            <button onClick={() => openMeetingPopup(getJitsiUrl(liveSession.metadata.meetingLink!, session?.user?.name || 'Instructor'))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
              <Video className="h-3.5 w-3.5" /> Open Video
            </button>
          )}
          <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {participants.length} joined</span>
          <button onClick={endSession} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
            <X className="h-3.5 w-3.5" /> End Lesson
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Whiteboard */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 shrink-0">
            <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Pen"><Pen className="h-4 w-4" /></button>
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Eraser"><Eraser className="h-4 w-4" /></button>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className="w-5 h-5 rounded-full border-2 border-white shadow ring-1 ring-slate-200" style={{ background: c }} title={c} />
            ))}
            <input type="range" min={1} max={10} value={size} onChange={e => setSize(Number(e.target.value))} className="ml-2 w-24" title="Stroke size" />
            <span className="text-xs text-slate-400 ml-auto">Draw — students see updates live</span>
          </div>
          <canvas
            ref={canvasRef}
            width={1200} height={700}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="flex-1 w-full h-full touch-none bg-white cursor-crosshair"
          />
        </div>

        {/* Chat + participants */}
        <div className="w-72 flex flex-col border-l border-slate-200 bg-white shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-600" /> Chat</p>
            <button onClick={askAI} disabled={aiLoading || !chatInput.trim()} className="text-xs text-emerald-700 font-semibold disabled:opacity-40">Ask Hope AI</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-xs ${msg.isAI ? 'bg-emerald-50 border border-emerald-200' : msg.userId === session?.user?.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`font-semibold mb-0.5 ${msg.isAI ? 'text-emerald-700' : 'text-slate-600'}`}>{msg.name}</p>
                <p className="text-slate-700 leading-relaxed">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-100 flex gap-1.5">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Message learners..." className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button onClick={() => sendChat()} disabled={!chatInput.trim()} className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center disabled:opacity-40"><Send className="h-3.5 w-3.5 text-white" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
