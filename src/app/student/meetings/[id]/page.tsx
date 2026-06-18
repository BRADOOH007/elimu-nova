'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  Users,
  X,
  Send,
  Brain,
  PenLine,
  Hand,
  PenTool
} from 'lucide-react'

export default function StudentLiveRoom() {
  const params = useParams()
  const router = useRouter()
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Hope AI', type: 'system', content: 'Welcome to the live class! Raise your hand if you need help.', time: '10:00 AM' },
    { id: 2, sender: 'Teacher Smith', type: 'teacher', content: 'Good morning, class! Today we are learning about algebra.', time: '10:01 AM' },
    { id: 3, sender: 'Sarah Johnson', type: 'student', content: 'Good morning, teacher!', time: '10:02 AM' },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now(),
      sender: 'You',
      type: 'student',
      content: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    setChatMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const participants = [
    { id: 1, name: 'Teacher Smith', role: 'teacher', isSpeaking: true },
    { id: 2, name: 'Sarah Johnson', role: 'student', isSpeaking: false },
    { id: 3, name: 'Michael Chen', role: 'student', isSpeaking: false },
    { id: 4, name: 'Emily Davis', role: 'student', isSpeaking: false },
    { id: 5, name: 'James Wilson', role: 'student', isSpeaking: false },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/student/schedule')} className="text-gray-300 hover:text-white">
            <X className="w-5 h-5 mr-2" />
            Leave
          </Button>
          <div className="text-white">
            <h2 className="text-lg font-semibold">Math Lesson: Algebra</h2>
            <p className="text-gray-400 text-sm">Live • {participants.length} Participants</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`${isHandRaised ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-gray-300 hover:text-white'}`}
          >
            <Hand className="w-4 h-4 mr-2" />
            {isHandRaised ? 'Hand Raised' : 'Raise Hand'}
          </Button>
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
        {/* Video Grid */}
        <div className={`flex-1 p-6 overflow-auto ${isWhiteboardOpen ? 'w-1/2' : ''}`}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map(participant => (
              <Card key={participant.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                <div className={`aspect-video flex items-center justify-center relative ${
                  participant.role === 'teacher' 
                    ? 'bg-gradient-to-br from-blue-900 to-indigo-900' 
                    : 'bg-gradient-to-br from-green-900 to-emerald-900'
                }`}>
                  <div className="text-white text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${
                      participant.role === 'teacher' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    }`}>
                      {participant.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold">{participant.name}</p>
                  </div>
                  {participant.isSpeaking && (
                    <div className="absolute bottom-4 left-4 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Speaking
                    </div>
                  )}
                </div>
              </Card>
            ))}

            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center relative">
                <div className="text-white text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                    Y
                  </div>
                  <p className="text-sm font-semibold">You</p>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 rounded-full"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                  >
                    {isVideoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-red-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 rounded-full"
                    onClick={() => setIsAudioOn(!isAudioOn)}
                  >
                    {isAudioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-red-400" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Whiteboard Section (Read Only for Student) */}
          {isWhiteboardOpen && (
            <Card className="mt-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Shared Whiteboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 min-h-[300px] text-gray-800">
                  <p className="text-sm opacity-75">Teacher will write here...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Chat/Participants) */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button className="flex-1 py-3 px-4 text-sm font-semibold text-white border-b-2 border-blue-500">
                Chat
              </button>
              <button className="flex-1 py-3 px-4 text-sm font-semibold text-gray-400 hover:text-gray-300">
                <Users className="w-4 h-4 inline mr-1" />
                Participants
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.type === 'student' && msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.type === 'system'
                        ? 'bg-purple-900/50 border border-purple-500/50 text-purple-200 text-sm'
                        : msg.type === 'teacher'
                        ? 'bg-blue-600 text-white'
                        : msg.sender === 'You'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <p className="text-xs opacity-75 mb-1">{msg.sender} • {msg.time}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Assistant */}
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
                        Need help with the lesson? Ask me!
                      </p>
                      <Button size="sm" className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white">
                        Ask Hope
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
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
