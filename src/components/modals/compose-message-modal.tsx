'use client'

import { useState } from 'react'
import { X, Send, User, Mail, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ComposeMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (data: { recipientId?: string; subject: string; content: string; recipientType: 'TEACHER' | 'STUDENT' | 'PARENT' }) => Promise<void>
  recipientType: 'TEACHER' | 'STUDENT' | 'PARENT'
  recipients?: Array<{ id: string; name: string; email?: string }>
  defaultRecipient?: string
  studentRecipients?: Array<{ id: string; name: string; email?: string }>
  parentRecipients?: Array<{ id: string; name: string; email?: string }>
  showRecipientTypeSelector?: boolean
}

export default function ComposeMessageModal({
  isOpen,
  onClose,
  onSend,
  recipientType,
  recipients = [],
  defaultRecipient,
  studentRecipients = [],
  parentRecipients = [],
  showRecipientTypeSelector = false
}: ComposeMessageModalProps) {
  const [selectedRecipientType, setSelectedRecipientType] = useState<'TEACHER' | 'STUDENT' | 'PARENT'>(recipientType)
  const [recipientId, setRecipientId] = useState(defaultRecipient || '')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  // Get current recipients based on selected type
  const currentRecipients = showRecipientTypeSelector
    ? selectedRecipientType === 'STUDENT' ? studentRecipients : parentRecipients
    : recipients

  if (!isOpen) return null

  console.log('🎯 Compose Modal - Recipients:', currentRecipients, 'Count:', currentRecipients.length)

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      alert('Please fill in both subject and message')
      return
    }

    if (currentRecipients.length > 0 && !recipientId) {
      alert('Please select a recipient')
      return
    }

    setSending(true)
    try {
      await onSend({
        recipientId: recipientId || undefined,
        subject,
        content,
        recipientType: showRecipientTypeSelector ? selectedRecipientType : recipientType
      })
      
      // Reset form
      setRecipientId(defaultRecipient || '')
      setSubject('')
      setContent('')
      onClose()
      alert('Message sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      setRecipientId(defaultRecipient || '')
      setSubject('')
      setContent('')
      setSelectedRecipientType(recipientType)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">New Message</h2>
                <p className="text-blue-100 text-sm">
                  Send a message to a {selectedRecipientType.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={sending}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Recipient Type Selector */}
          {showRecipientTypeSelector && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-blue-600" />
                Recipient Type
              </label>
              <select
                value={selectedRecipientType}
                onChange={(e) => setSelectedRecipientType(e.target.value as any)}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
          )}

          {/* Recipient Selection */}
          {currentRecipients.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-blue-600" />
                Recipient
              </label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a {selectedRecipientType.toLowerCase()}...</option>
                {currentRecipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.name} {recipient.email && `(${recipient.email})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Mail className="w-4 h-4 text-purple-600" />
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              disabled={sending}
              className="border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all h-12 text-base"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MessageSquare className="w-4 h-4 text-pink-600" />
              Message
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              disabled={sending}
              rows={8}
              className="border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleClose}
              disabled={sending}
              variant="outline"
              className="px-6 border-2 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !content.trim() || (recipients.length > 0 && !recipientId)}
              className="px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
