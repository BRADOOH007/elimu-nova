'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Inbox, Clock, CheckCircle2, Reply, User } from 'lucide-react'
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
  isSent: boolean
  hasReplies: boolean
  attachments: string[]
  senderId: string
  senderType: string
}

export default function TeacherMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [students, setStudents] = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [parents, setParents] = useState<Array<{ id: string; name: string; email?: string }>>([])

  useEffect(() => {
    fetchMessages()
    fetchStudents()
    fetchParents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students')
      const data = await response.json()
      
      console.log('📚 Fetched students:', data)
      
      if (data.students) {
        const studentList = data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email
        }))
        console.log('📋 Student list for dropdown:', studentList)
        setStudents(studentList)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchParents = async () => {
    try {
      const response = await fetch('/api/teacher/parents')
      const data = await response.json()
      
      console.log('👨‍👩‍👧‍👦 Fetched parents:', data)
      
      if (data.parents) {
        const parentList = data.parents.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
        console.log('📋 Parent list for dropdown:', parentList)
        setParents(parentList)
      }
    } catch (error) {
      console.error('Error fetching parents:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/teacher/messages')
      const data = await response.json()
      
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/teacher/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      })
      
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleSendMessage = async (data: { recipientId?: string; subject: string; content: string; recipientType: 'TEACHER' | 'STUDENT' | 'PARENT' }) => {
    console.log('📤 Sending message with data:', data)
    
    if (!data.recipientId) {
      throw new Error('Please select a recipient')
    }

    const response = await fetch('/api/teacher/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: data.recipientId,
        subject: data.subject,
        content: data.content,
        recipientType: data.recipientType
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    await fetchMessages()
  }

  const handleReply = async (messageId: string, content: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    if (!['STUDENT', 'PARENT'].includes(message.senderType)) {
      throw new Error('Can only reply to messages from students or parents')
    }

    const response = await fetch('/api/teacher/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: message.senderId,
        subject: `Re: ${message.subject}`,
        content,
        recipientType: message.senderType,
        parentId: messageId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send reply')
    }

    await fetchMessages()
  }

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.read && !msg.isSent
    if (filter === 'sent') return msg.isSent
    return true
  })

  const unreadCount = messages.filter(msg => !msg.read && !msg.isSent).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Communicate with your students and parents
          </p>
        </div>
        <button 
          onClick={() => setShowComposeModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            All Messages
          </div>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setFilter('sent')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'sent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent
          </div>
        </button>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No messages found</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message)
                  setShowViewModal(true)
                  if (!message.read && !message.isSent) {
                    markAsRead(message.id)
                  }
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMessage?.id === message.id
                    ? 'border-blue-500 bg-blue-50'
                    : message.read || message.isSent
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {message.from.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {message.from.name}
                        </p>
                        {!message.read && !message.isSent && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{message.from.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(message.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{message.subject}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          {selectedMessage ? (
            <div className="bg-white rounded-lg border-0 p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedMessage.from.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedMessage.from.name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedMessage.from.role}</p>
                  </div>
                </div>
                {selectedMessage.read && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Read
                  </div>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {selectedMessage.subject}
              </h2>

              <p className="text-gray-700 line-clamp-4 mb-4">
                {selectedMessage.content}
              </p>

              <button 
                onClick={() => setShowViewModal(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" />
                View Full Message & Reply
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-0 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ComposeMessageModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendMessage}
        recipientType="STUDENT"
        showRecipientTypeSelector={true}
        studentRecipients={students}
        parentRecipients={parents}
      />

      <ViewMessageModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        message={selectedMessage}
        onReply={handleReply}
        canReply={['STUDENT', 'PARENT'].includes(selectedMessage?.senderType || '')}
      />
    </div>
  )
}
