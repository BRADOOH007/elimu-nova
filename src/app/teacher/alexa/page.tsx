'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cleanAIText } from '@/lib/clean-ai-text'
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Sparkles,
  BookOpen,
  Lightbulb,
  MessageSquare,
  History,
  Trash2,
  Copy,
  Download,
  Upload
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

export default function HopePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm Hope, your AI teaching assistant. I can help you with lesson planning, curriculum development, student assessment ideas, and educational strategies. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const scrollToBottom = (force = false) => {
    if (force || shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (isAtBottom) {
      setShouldAutoScroll(true)
      setIsUserScrolling(false)
    } else {
      setShouldAutoScroll(false)
      setIsUserScrolling(true)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setShouldAutoScroll(true) // Ensure auto-scroll when sending message

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'teacher_assistant'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      setChatHistory(prev => [...prev, userMessage, aiMessage])
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: "Hello! I'm Hope, your AI teaching assistant. I can help you with lesson planning, curriculum development, student assessment ideas, and educational strategies. How can I assist you today?",
        timestamp: new Date()
      }
    ])
    setChatHistory([])
    setShouldAutoScroll(true)
    setIsUserScrolling(false)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const quickActions = [
    {
      title: "Create Lesson Plan",
      prompt: "Help me create a lesson plan for [subject] for [grade level] students",
      icon: BookOpen
    },
    {
      title: "Assessment Ideas",
      prompt: "Suggest creative assessment methods for [topic]",
      icon: Lightbulb
    },
    {
      title: "Student Engagement",
      prompt: "How can I make [subject] more engaging for my students?",
      icon: Sparkles
    },
    {
      title: "Curriculum Help",
      prompt: "Help me structure a curriculum for [subject] over [time period]",
      icon: MessageSquare
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hope AI Assistant</h1>
            <p className="text-gray-600">Your intelligent teaching companion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0 h-[70vh] max-h-[800px] min-h-[600px] flex flex-col">
            <CardHeader className="border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Chat with Hope</CardTitle>
                    <CardDescription>AI-powered teaching assistance</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-green-500 to-green-600' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 max-w-full break-words ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'bg-white shadow-sm border-0'
                      }`}>
                        {message.isTyping ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">Hope is thinking...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap">{cleanAIText(message.content)}</p>
                            <div className={`flex items-center justify-between mt-2 ${
                              message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {message.type === 'assistant' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyMessage(message.content)}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {isUserScrolling && (
                <Button
                  onClick={() => {
                    setShouldAutoScroll(true)
                    scrollToBottom(true)
                  }}
                  className="absolute bottom-20 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full w-12 h-12 shadow-lg z-10"
                  size="sm"
                >
                  <Send className="w-4 h-4 rotate-90" />
                </Button>
              )}

              {/* Input Area */}
              <div className="border-0 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Hope anything about teaching..."
                      className="pr-12 bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setIsListening(!isListening)}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common teaching tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3 bg-white/70 hover:bg-white/90"
                  onClick={() => setInputMessage(action.prompt)}
                >
                  <action.icon className="w-4 h-4 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500 mt-1">Click to use</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Chat History */}
          <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-600" />
                <span>Recent Chats</span>
              </CardTitle>
              <CardDescription>Your conversation history</CardDescription>
            </CardHeader>
            <CardContent>
              {chatHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent conversations
                </p>
              ) : (
                <div className="space-y-2">
                  {chatHistory.slice(-5).map((message, index) => (
                    message.type === 'user' && (
                      <div
                        key={index}
                        className="p-2 bg-white/70 rounded-lg cursor-pointer hover:bg-white/90 transition-colors"
                        onClick={() => setInputMessage(message.content)}
                      >
                        <p className="text-sm text-gray-700 truncate">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span>AI Capabilities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-600">
                <p>• Lesson Planning</p>
                <p>• Curriculum Design</p>
                <p>• Assessment Ideas</p>
                <p>• Student Engagement</p>
                <p>• Educational Strategies</p>
                <p>• Content Creation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}