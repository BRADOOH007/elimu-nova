'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Radio, Square, Send, Users, MessageSquare, Pen, Eraser,
  Minus, Circle, Loader2, ChevronRight, Copy, CheckCircle,
  Sparkles, BookOpen, RotateCcw, Download, Plus
} from 'lucide-react'

interface LiveSession {
  id: string; title: string; subject: string; status: string
  metadata: {
    boardContent: string; chat: ChatMsg[]; participants: Participant[]
    startedAt: string; sessionCode: string
  }
  class?: { name: string; grade: string }
}
interface ChatMsg { userId: string; name: string; message: string; ts: string; isAI?: boolean }
interface Participant { userId: string; name: string; joinedAt: string }
interface ClassInfo { id: string; name: string; grade: string; subject: string }

type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'text'

export default function LiveClassPage() {
  const { data: session } = useSession()
  const [step, setStep] = useState<'setup' | 'live'>('setup')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [title, setTitle] = useState('Live Class')
  const [subject, setSubject] = useState('')
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Whiteboard
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [tool, setTool]   = useState<Tool>('pen')
  const [color, setColor] = useState('#1e40af')
  const [size, setSize]   = useState(3)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Chat
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Poll for updates every 3s when live
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetch('/api/teacher/classes').then(r => r.json()).then(d => setClasses(d.classes || []))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (!liveSession) return
    pollRef.current = setInterval(pollSession, 3000)
    return () => clearInterval(pollRef.current)
  }, [liveSession?.id])

  const pollSession = async () => {
    if (!liveSession) return
    try {
      const res  = await fetch(`/api/live-session?sessionId=${liveSession.id}`)
      const data = await res.json()
      if (data.session) {
        const meta = data.session.metadata || {}
        setChatMessages(meta.chat || [])
        // Update canvas if board changed externally
      }
    } catch { /* silent */ }
  }

  const startSession = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, classId: selectedClass, subject }),
      })
      const data = await res.json()
      setLiveSession(data.session)
      setChatMessages(data.session.metadata?.chat || [])
      setStep('live')
    } finally { setLoading(false) }
  }

  const endSession = async () => {
    if (!liveSession || !confirm('End this live session?')) return
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: liveSession.id, action: 'end', data: {} }),
    })
    clearInterval(pollRef.current)
    setStep('setup')
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
    const text = msg || chatInput.trim()
    if (!text || !liveSession) return
    setChatInput('')
    const chatMsg: ChatMsg = { userId: session?.user?.id || '', name: 'Teacher', message: text, ts: new Date().toISOString() }
    const newMsgs = [...chatMessages, chatMsg]
    setChatMessages(newMsgs)
    await fetch('/api/live-session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: liveSession.id, action: 'addChat', data: chatMsg }),
    })
  }

  const askAI = async () => {
    if (!chatInput.trim()) return
    const question = chatInput.trim()
    setChatInput('')
    setAiLoading(true)
    const userMsg: ChatMsg = { userId: 'teacher', name: 'Teacher', message: question, ts: new Date().toISOString() }
    setChatMessages(m => [...m, userMsg])
    try {
      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, context: 'teacher_assistant' }),
      })
      const data = await res.json()
      const aiMsg: ChatMsg = { userId: 'ai', name: 'Hope AI', message: data.response || 'Let me think...', ts: new Date().toISOString(), isAI: true }
      setChatMessages(m => [...m, aiMsg])
      // Broadcast to students
      await fetch('/api/live-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: liveSession?.id, action: 'addChat', data: aiMsg }),
      })
    } finally { setAiLoading(false) }
  }

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const copyCode = () => {
    if (liveSession?.metadata?.sessionCode) {
      navigator.clipboard.writeText(liveSession.metadata.sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Canvas drawing
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineWidth   = tool === 'eraser' ? size * 4 : size
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y) }
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { setDrawing(false); lastPos.current = null; saveBoard() }

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  /* ── SETUP SCREEN ── */
  if (step === 'setup') return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Teaching Room</h1>
        <p className="text-slate-500 text-sm mt-0.5">Start a live session — students in your class can join and interact in real time</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Algebra - Chapter 3"
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select class (optional)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.grade}</option>)}
          </select>
        </div>
        <button onClick={startSession} disabled={loading || !title.trim()}
          className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-60 transition-all">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          {loading ? 'Starting...' : 'Start Live Session'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">How it works</p>
        <ul className="space-y-1 text-xs text-blue-700">
          <li>• A session code is generated — students enter it at <strong>/student/schedule</strong> to join</li>
          <li>• Draw on the whiteboard — students see it live (3-second refresh)</li>
          <li>• Ask Hope AI questions mid-lesson and broadcast answers to students</li>
          <li>• Chat messages are visible to all participants</li>
        </ul>
      </div>
    </div>
  )

  /* ── LIVE ROOM ── */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
          <span className="font-semibold text-slate-800 text-sm">{liveSession?.title}</span>
          {liveSession?.class && <span className="text-xs text-slate-400">{liveSession.class.name}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-500">Code:</span>
            <span className="text-sm font-bold text-slate-800 font-mono tracking-widest">{liveSession?.metadata?.sessionCode}</span>
            <button onClick={copyCode} className="text-slate-400 hover:text-slate-600">
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {liveSession?.metadata?.participants?.length || 0}
          </div>
          <button onClick={endSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
            <Square className="h-3 w-3" /> End Session
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Whiteboard area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 bg-white border-b border-slate-200 px-3 py-2">
            {([
              { t: 'pen' as Tool,    icon: Pen,    label: 'Pen'    },
              { t: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
              { t: 'line' as Tool,   icon: Minus,  label: 'Line'   },
            ]).map(({ t, icon: Icon, label }) => (
              <button key={t} onClick={() => setTool(t)} title={label}
                className={`p-2 rounded-lg transition-colors ${tool === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {['#1e40af', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a', '#ffffff'].map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-slate-900 scale-125' : 'border-slate-300'}`}
                style={{ backgroundColor: c }} />
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <input type="range" min={1} max={12} value={size} onChange={e => setSize(Number(e.target.value))}
              className="w-20 accent-blue-600" />
            <span className="text-xs text-slate-400 w-6">{size}px</span>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button onClick={clearCanvas} title="Clear board"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1200} height={800}
              className="w-full h-full cursor-crosshair"
              style={{ touchAction: 'none' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
            <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
              Students see this board (refreshes every 3s)
            </div>
          </div>
        </div>

        {/* Right panel — chat + AI */}
        <div className="w-72 flex flex-col border-l border-slate-200 bg-white shrink-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" /> Session Chat
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-xs text-center text-slate-400 py-4">No messages yet. Students will appear here when they join.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-xs ${msg.isAI ? 'bg-purple-50 border border-purple-200' : msg.name === 'Teacher' ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`font-semibold mb-0.5 ${msg.isAI ? 'text-purple-700' : msg.name === 'Teacher' ? 'text-blue-700' : 'text-slate-700'}`}>
                  {msg.isAI ? '✨ Hope AI' : msg.name}
                  <span className="font-normal text-slate-400 ml-1">{fmtTime(msg.ts)}</span>
                </p>
                <p className="text-slate-700 leading-relaxed">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-100 space-y-2">
            <div className="flex gap-1.5">
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Message or ask Hope AI..."
                className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => sendChat()} disabled={!chatInput.trim()}
                className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center disabled:opacity-40">
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <button onClick={askAI} disabled={!chatInput.trim() || aiLoading}
              className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:opacity-40 transition-all">
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Ask Hope AI (broadcast)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
