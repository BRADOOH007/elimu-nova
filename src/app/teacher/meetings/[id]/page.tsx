'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSSE } from '@/hooks/use-sse'
import {
  Video,
  VideoOff,
  MessageSquare,
  Users,
  X,
  Send,
  Brain,
  PenTool,
  Share2,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

const ZoomMeeting = dynamic(() => import('@/components/zoom-meeting'), { ssr: false })

interface MeetingDetail {
  id: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  location?: string
  status: string
  attendees?: any
  createdBy: { name: string; email: string }
  zoomMeetingId?: string | null
  zoomMeetingPassword?: string | null
  zoomJoinUrl?: string | null
  zoomProvider?: string | null
}

export default function LiveTeachingRoom() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoomActive, setZoomActive] = useState(false)
  const [zoomLoading, setZoomLoading] = useState(false)
  const [zoomError, setZoomError] = useState<string | null>(null)
  const [zoomInfo, setZoomInfo] = useState<{ signature: string; sdkKey: string } | null>(null)
  const [meetingNumberInput, setMeetingNumberInput] = useState('')
  const [meetingPasswordInput, setMeetingPasswordInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ id: string | number; sender: string; type: string; content: string; time: string }>>([])
  const [newMessage, setNewMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)
  const [whiteboardContent, setWhiteboardContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const addChatMessage = useCallback((msg: { id: string | number; sender: string; type: string; content: string; time: string }) => {
    setChatMessages(prev => [...prev, msg])
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/teacher/meetings/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => {
        setMeeting(data.meeting)
        setChatMessages([
          { id: 1, sender: 'Hope AI', type: 'system', content: `Welcome to "${data.meeting.title}"! I'm Hope, your AI assistant for this session.${data.meeting.description ? `\n\n${data.meeting.description}` : ''}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
        ])
        if (data.meeting.zoomMeetingId) {
          setMeetingNumberInput(data.meeting.zoomMeetingId)
          if (data.meeting.zoomMeetingPassword) {
            setMeetingPasswordInput(data.meeting.zoomMeetingPassword)
          }
        }
        setLoading(false)
      })
      .catch(() => { setError('Meeting not found'); setLoading(false) })

    fetch(`/api/teacher/meetings/${id}/chat`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.messages?.length) {
          setChatMessages(prev => {
            const existing = new Set(prev.map(m => m.id))
            const newMsgs = data.messages.filter((m: any) => !existing.has(m.id))
            return [...prev, ...newMsgs.map((m: any) => ({ ...m, type: m.senderType }))]
          })
        }
      })
      .catch(() => {})
  }, [id])

  useSSE(id ? `meeting:${id}` : null, {
    'chat-message': (data: any) => {
      addChatMessage({ ...data, type: data.senderType })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return
    try {
      await fetch(`/api/teacher/meetings/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })
    } catch {
      addChatMessage({
        id: 'error-' + Date.now(),
        sender: 'System',
        type: 'system',
        content: 'Failed to send message',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    }
    setNewMessage('')
  }

  const handleStartZoom = async () => {
    if (!meetingNumberInput.trim()) return
    setZoomLoading(true)
    setZoomError(null)
    try {
      const res = await fetch('/api/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber: meetingNumberInput.trim(), role: 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setZoomError(data.error || 'Failed to get Zoom signature')
        return
      }
      setZoomInfo({ signature: data.signature, sdkKey: data.sdkKey })
      setZoomActive(true)
    } catch {
      setZoomError('Failed to connect to Zoom service')
    } finally {
      setZoomLoading(false)
    }
  }

  const handleStopZoom = () => {
    setZoomActive(false)
    setZoomInfo(null)
    setZoomError(null)
  }

  const rawAttendees: Array<{ name: string }> = (() => {
    try {
      const a = meeting?.attendees
      if (Array.isArray(a)) return a
      if (typeof a === 'string') return JSON.parse(a)
      return []
    } catch { return [] }
  })()

  const participants = rawAttendees.length > 0
    ? rawAttendees.map((att: any, i: number) => ({ id: i + 1, name: att.name || att.email || `Participant ${i + 1}`, role: 'student', isSpeaking: false }))
    : []

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>
  if (error || !meeting) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Card className="bg-gray-800 border-gray-700 max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join Meeting</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/teacher/meetings')} variant="outline" className="text-white border-gray-600"><X className="w-4 h-4 mr-2" /> Back to Meetings</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/teacher/meetings')} className="text-gray-300 hover:text-white">
            <X className="w-5 h-5 mr-2" />
            End
          </Button>
          <div className="text-white">
            <h2 className="text-lg font-semibold">{meeting.title}</h2>
            <p className="text-gray-400 text-sm">
              {meeting.date} @ {meeting.time} · {participants.length} Participant{participants.length !== 1 ? 's' : ''}
              {meeting.location ? ` · ${meeting.location}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)} className="text-gray-300 hover:text-white">
              <PenTool className="w-4 h-4 mr-2" />
              Whiteboard
            </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)} className="text-gray-300 hover:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video / Zoom Area */}
        <div className={`flex-1 p-6 overflow-auto ${isWhiteboardOpen ? 'w-1/2' : ''}`}>
          {zoomActive && zoomInfo ? (
            <ZoomMeeting
              meetingNumber={meetingNumberInput}
              passWord={meetingPasswordInput || undefined}
              userName={session?.user?.name || 'Teacher'}
              userEmail={session?.user?.email || undefined}
              role={1}
              sdkKey={zoomInfo.sdkKey}
              signature={zoomInfo.signature}
              onLeave={handleStopZoom}
            />
          ) : (
            <div className="space-y-4">
              {/* Zoom join form */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    Start Video Meeting
                    {meeting.zoomProvider === 'auto' && (
                      <span className="ml-2 text-xs bg-green-600/30 text-green-400 px-2 py-0.5 rounded-full border border-green-500/40">
                        Auto-created
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <Input
                      value={meetingNumberInput}
                      onChange={e => setMeetingNumberInput(e.target.value)}
                      placeholder="Zoom Meeting ID"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 font-mono flex-1"
                    />
                    <Input
                      value={meetingPasswordInput}
                      onChange={e => setMeetingPasswordInput(e.target.value)}
                      placeholder="Passcode (optional)"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 w-40"
                    />
                  </div>
                  {zoomError && (
                    <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {zoomError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleStartZoom}
                      disabled={zoomLoading || !meetingNumberInput.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {zoomLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                      {zoomLoading ? 'Connecting...' : 'Start Video'}
                    </Button>
                    {meeting.zoomJoinUrl && (
                      <a href={meeting.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="text-white border-gray-600">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Zoom App
                        </Button>
                      </a>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-3">
                    Enter your Zoom Meeting ID and passcode. Students will use the same ID to join.
                    Get a meeting ID from your Zoom desktop/mobile app or schedule one on zoom.us.
                  </p>
                </CardContent>
              </Card>

              {/* Participant list preview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Participants ({participants.length + 1})
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-900/30 border border-blue-500/30">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">T</div>
                      <span className="text-white text-sm">You <span className="text-blue-400 text-xs">(Host)</span></span>
                    </div>
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/50">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">{p.name.charAt(0)}</div>
                        <span className="text-white text-sm">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Whiteboard Section */}
          {isWhiteboardOpen && (
            <Card className="mt-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Shared Whiteboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 min-h-[300px]">
                  <textarea
                    value={whiteboardContent}
                    onChange={(e) => setWhiteboardContent(e.target.value)}
                    placeholder="Write your lesson content here..."
                    className="w-full h-full min-h-[250px] border-none outline-none resize-none text-gray-800"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600 hover:border-gray-500"
                    onClick={() => setWhiteboardContent('')}>
                    Clear
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Chat/Participants) */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex border-b border-gray-700">
              <button className="flex-1 py-3 px-4 text-sm font-semibold text-white border-b-2 border-blue-500">
                Chat
              </button>
              <button className="flex-1 py-3 px-4 text-sm font-semibold text-gray-400 hover:text-gray-300">
                <Users className="w-4 h-4 inline mr-1" />
                Participants ({participants.length + 1})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.type === 'teacher' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    msg.type === 'system'
                      ? 'bg-purple-900/50 border border-purple-500/50 text-purple-200 text-sm'
                      : msg.type === 'teacher'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}>
                    {msg.type !== 'system' && (
                      <p className="text-xs opacity-75 mb-1">{msg.sender} • {msg.time}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold mb-1">Hope AI Assistant</p>
                      <p className="text-indigo-200 text-xs">
                        Need help with lesson content or questions? Ask me!
                      </p>
                      <Button size="sm" className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white">
                        Ask Hope
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
