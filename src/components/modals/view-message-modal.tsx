'use client'

import { useState } from 'react'
import { Reply, User, Clock, CheckCircle2, Mail, Send, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'

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
  senderId?: string
  senderType?: string
}

interface ViewMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: Message | null
  onReply?: (messageId: string, content: string) => Promise<void>
  canReply?: boolean
}

export default function ViewMessageModal({
  isOpen,
  onClose,
  message,
  onReply,
  canReply = true
}: ViewMessageModalProps) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  if (!isOpen || !message) return null

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return

    setSending(true)
    try {
      await onReply(message.id, replyContent)
      setReplyContent('')
      setShowReplyBox(false)
      onClose()
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      setShowReplyBox(false)
      setReplyContent('')
      onClose()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 pb-4 text-white border-b-0 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden">
              {message.from.avatar && !avatarError ? <img src={message.from.avatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} /> : getInitials(message.from.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{message.from.name}</h2>
              <p className="text-blue-100 text-sm flex items-center gap-2">
                <User className="w-3 h-3" />
                {message.from.role}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6 mt-1">
          {/* Message Info */}
          <div className="space-y-4">
            {/* Subject */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-indigo-100">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                    Subject
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 break-words">
                    {message.subject}
                  </h3>
                </div>
              </div>
            </div>

            {/* Timestamp and Status */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date(message.timestamp).toLocaleString()}</span>
              </div>
              {message.read && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Read</span>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Message
                </p>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          </div>

          {/* Reply Section */}
          {canReply && onReply && (
            <div className="border-t-2 border-gray-200 pt-6">
              {!showReplyBox ? (
                <Button
                  onClick={() => setShowReplyBox(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg h-12"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply to this message
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Reply className="w-4 h-4 text-indigo-600" />
                      <p className="text-sm font-semibold text-indigo-900">
                        Reply to {message.from.name}
                      </p>
                    </div>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      disabled={sending}
                      rows={6}
                      className="border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {replyContent.length} characters
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowReplyBox(false)
                        setReplyContent('')
                      }}
                      disabled={sending}
                      variant="outline"
                      className="flex-1 border-2 hover:bg-gray-100 px-5 py-2.5 text-sm font-medium"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={sending || !replyContent.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 px-5 py-2.5 text-sm font-medium"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            disabled={sending}
            variant="outline"
            className="px-5 py-2.5 text-sm font-medium border-2 hover:bg-gray-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
