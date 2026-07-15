'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Search,
  User,
  Clock,
  Loader2
} from 'lucide-react'
import ComposeMessageModal from '@/components/modals/compose-message-modal'
import ViewMessageModal from '@/components/modals/view-message-modal'

interface Message {
  id: string
  from: {
    name: string
    role: string
    avatar?: string
  }
  subject: string
  content: string
  timestamp: string
  read: boolean
}

export default function StudentMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/messages')
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error('Failed to fetch messages')
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (data: { subject: string; content: string; recipientType: 'TEACHER' | 'STUDENT' | 'PARENT' }) => {
    const response = await fetch('/api/student/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: 'teacher',
        subject: data.subject,
        content: data.content,
        recipientType: data.recipientType
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    await fetchMessages()
  }

  const handleReply = async (messageId: string, content: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    const response = await fetch('/api/student/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: 'teacher',
        subject: `Re: ${message.subject}`,
        content,
        recipientType: 'TEACHER',
        parentId: messageId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send reply')
    }

    await fetchMessages()
  }

  const filteredMessages = messages.filter(msg =>
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.from.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with your teacher and classmates</p>
          </div>
          <Button 
            onClick={() => setShowComposeModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <Card className=" border-0lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Inbox
            </CardTitle>
            <div className="mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Messages from your teacher will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={async () => {
                      setSelectedMessage(message)
                      setShowViewModal(true)
                      // Mark as read if unread
                      if (!message.read) {
                        try {
                          await fetch('/api/student/messages', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messageId: message.id })
                          })
                          // Update local state
                          setMessages(messages.map(msg => 
                            msg.id === message.id ? { ...msg, read: true } : msg
                          ))
                        } catch (error) {
                          console.error('Error marking message as read:', error)
                        }
                      }
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedMessage?.id === message.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">{message.from.name}</span>
                      </div>
                      {!message.read && (
                        <Badge className="bg-blue-500">New</Badge>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                      {message.subject}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(message.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Preview */}
        <Card className=" border-0lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
            <CardDescription>Click on a message to view full details and reply</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedMessage.from.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedMessage.from.name}</p>
                    <p className="text-sm text-gray-500">{selectedMessage.from.role}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {selectedMessage.subject}
                  </h3>
                  <p className="text-gray-700 line-clamp-4">
                    {selectedMessage.content}
                  </p>
                </div>
                <Button 
                  onClick={() => setShowViewModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  View Full Message & Reply
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a message to view</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Modals */}
      <ComposeMessageModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendMessage}
        recipientType="TEACHER"
      />

      <ViewMessageModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        message={selectedMessage}
        onReply={handleReply}
        canReply={true}
      />
    </>
  )
}
