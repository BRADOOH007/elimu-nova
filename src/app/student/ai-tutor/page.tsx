"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FormattedMessage } from "@/components/ai/formatted-message"
import { 
  Brain, 
  Send, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Bot,
  Sparkles,
  Target,
  Zap,
  Trophy,
  Flame,
  Star,
  BookOpen,
  ArrowRight,
  RefreshCw
} from "lucide-react"

interface TutorTask {
  subject: string
  topic: string
  mode: 'teach' | 'practice' | 'quiz' | 'revise'
  objective: string
  estimatedMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  context?: any
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface StudentStats {
  xp: number
  streak: number
  masteryScore: number
  totalQuestions: number
  correctAnswers: number
}

export default function AutonomousAITutorPage() {
  const { data: session } = useSession()
  const [currentTask, setCurrentTask] = useState<TutorTask | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTask, setIsLoadingTask] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stats, setStats] = useState<StudentStats>({
    xp: 0,
    streak: 0,
    masteryScore: 0,
    totalQuestions: 0,
    correctAnswers: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load current task on mount
  useEffect(() => {
    loadCurrentTask()
  }, [])

  const loadCurrentTask = async () => {
    setIsLoadingTask(true)
    setError(null)
    
    try {
      const response = await fetch('/api/student/tutor/next')
      
      if (!response.ok) {
        throw new Error('Failed to load task')
      }

      const data = await response.json()
      setCurrentTask(data.task)
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: data.message || `Ready to ${data.task.mode} ${data.task.topic}! Let's get started.`,
        timestamp: new Date()
      }])
    } catch (err) {
      console.error('Error loading task:', err)
      setError(err instanceof Error ? err.message : 'Failed to load task')
    } finally {
      setIsLoadingTask(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentTask) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/student/tutor/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId,
          task: currentTask
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Update session ID if new
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update stats if provided
      if (data.xpEarned) {
        setStats(prev => ({
          ...prev,
          xp: prev.xp + data.xpEarned
        }))
      }

    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'teach': return 'bg-blue-100 text-blue-700'
      case 'practice': return 'bg-green-100 text-green-700'
      case 'quiz': return 'bg-purple-100 text-purple-700'
      case 'revise': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'teach': return <BookOpen className="w-4 h-4" />
      case 'practice': return <Target className="w-4 h-4" />
      case 'quiz': return <Trophy className="w-4 h-4" />
      case 'revise': return <RefreshCw className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  if (isLoadingTask) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized lesson...</p>
        </div>
      </div>
    )
  }

  if (error && !currentTask) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Tutor</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCurrentTask}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Learning Companion</h1>
              <p className="text-gray-600">Personalized tutoring powered by AI</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-600">XP</p>
                  <p className="text-lg font-bold text-gray-900">{stats.xp}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-600">Streak</p>
                  <p className="text-lg font-bold text-gray-900">{stats.streak}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-600">Mastery</p>
                  <p className="text-lg font-bold text-gray-900">{stats.masteryScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Task Info */}
      {currentTask && (
        <div className="p-6 bg-gradient-to-r from-white to-blue-50 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={`${getModeColor(currentTask.mode)} px-4 py-2 text-sm font-semibold`}>
                <span className="mr-2">{getModeIcon(currentTask.mode)}</span>
                {currentTask.mode.toUpperCase()}
              </Badge>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentTask.subject}: {currentTask.topic}</h2>
                <p className="text-sm text-gray-600">{currentTask.objective}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {currentTask.difficulty}
              </Badge>
              <p className="text-xs text-gray-500">~{currentTask.estimatedMinutes} min</p>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.totalQuestions > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{stats.correctAnswers}/{stats.totalQuestions} correct</span>
              </div>
              <Progress 
                value={(stats.correctAnswers / stats.totalQuestions) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Chat Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-[600px] flex flex-col bg-white rounded-3xl shadow-lg">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <FormattedMessage
                  key={index}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              {error && (
                <div className="mb-3 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or answer here..."
                  className="resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="p-4 bg-white rounded-3xl shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInputMessage("Can you explain this topic in simple terms?")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explain Topic
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInputMessage("Can you give me an example?")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Show Example
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInputMessage("Can you give me a practice question?")}
              >
                <Target className="w-4 h-4 mr-2" />
                Practice Question
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInputMessage("I need help with this")}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Get Help
              </Button>
            </div>
          </div>

          {/* Learning Tips */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Learning Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Ask questions if you don't understand</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Practice regularly to build mastery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Take your time to think through answers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Earn XP by answering correctly</span>
              </li>
            </ul>
          </div>

          {/* New Lesson Button */}
          <Button
            onClick={loadCurrentTask}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Lesson
          </Button>
        </div>
      </div>
    </div>
  )
}
