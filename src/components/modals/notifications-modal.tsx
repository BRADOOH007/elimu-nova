"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog"
import {
  Bell,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  CheckCheck,
  MessageSquare
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

interface RawMessage {
  id: string
  subject: string
  content: string
  read: boolean
  isSent: boolean
  createdAt: string
  sender?: { name: string; role?: string } | null
  senderType?: string
}

interface ActivityItem {
  id: string
  type: 'notification' | 'message'
  title: string
  description: string
  timestamp: string
  isRead: boolean
  notificationType?: string
  senderName?: string
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  role?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  onUnreadChanged?: () => void
}

export function NotificationsModal({ isOpen, onClose, userId, role, onUnreadChanged }: NotificationsModalProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)

      const messagesEndpoint =
        role === 'TEACHER'  ? '/api/teacher/messages' :
        role === 'STUDENT'  ? '/api/student/messages' :
        role === 'PARENT'   ? '/api/parent/messages'  :
        null

      const [notifRes, msgRes] = await Promise.all([
        fetch(`/api/notifications?userId=${userId}`),
        messagesEndpoint ? fetch(messagesEndpoint) : Promise.resolve(null),
      ])

      const notifData = notifRes.ok ? await notifRes.json() : []
      const notifications: Notification[] = Array.isArray(notifData) ? notifData : (notifData.notifications || [])

      let messages: RawMessage[] = []
      if (msgRes && msgRes.ok) {
        const msgData = await msgRes.json()
        messages = msgData.messages || []
      }

      const unreadMessages = messages.filter(m => !m.read && !m.isSent)

      const notifItems: ActivityItem[] = notifications.map(n => ({
        id: n.id,
        type: 'notification' as const,
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        isRead: n.isRead,
        notificationType: n.type,
      }))

      const msgItems: ActivityItem[] = unreadMessages.map(m => ({
        id: m.id,
        type: 'message' as const,
        title: m.subject || 'New Message',
        description: m.content,
        timestamp: m.createdAt,
        isRead: m.read,
        senderName: m.sender?.name,
      }))

      const combined = [...notifItems, ...msgItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(combined)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, role])

  useEffect(() => {
    if (isOpen) fetchActivities()
  }, [isOpen, fetchActivities])

  const markAsRead = async (item: ActivityItem) => {
    try {
      if (item.type === 'notification') {
        await fetch(`/api/notifications/${item.id}`, { method: 'PATCH' })
      } else {
        const endpoint =
          role === 'TEACHER'  ? '/api/teacher/messages' :
          role === 'STUDENT'  ? '/api/student/messages' :
          role === 'PARENT'   ? '/api/parent/messages'  :
          null
        if (endpoint) {
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: item.id }),
          })
        }
      }
      setActivities(prev => prev.map(a => a.id === item.id ? { ...a, isRead: true } : a))
      onUnreadChanged?.()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const unreadMsgs = activities.filter(a => a.type === 'message' && !a.isRead)
      const endpoint =
        role === 'TEACHER'  ? '/api/teacher/messages' :
        role === 'STUDENT'  ? '/api/student/messages' :
        role === 'PARENT'   ? '/api/parent/messages'  :
        null
      if (endpoint && unreadMsgs.length > 0) {
        await Promise.all(
          unreadMsgs.map(m =>
            fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: m.id }),
            })
          )
        )
      }

      setActivities(prev => prev.map(a => ({ ...a, isRead: true })))
      onUnreadChanged?.()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (item: ActivityItem) => {
    if (item.type !== 'notification') return
    try {
      const response = await fetch(`/api/notifications/${item.id}`, { method: 'DELETE' })
      if (response.ok) {
        setActivities(prev => prev.filter(a => a.id !== item.id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getItemIcon = (item: ActivityItem) => {
    if (item.type === 'message') return <MessageSquare className="w-5 h-5 text-purple-500" />
    return getNotificationIcon(item.notificationType || 'info')
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getTypeBadge = (item: ActivityItem) => {
    if (item.type === 'message') return <Badge className="bg-purple-100 text-purple-800">message</Badge>
    return <Badge className={getNotificationBadgeColor(item.notificationType || 'info')}>{item.notificationType}</Badge>
  }

  const filteredActivities = activities.filter(a => filter === 'all' || !a.isRead)
  const unreadCount = activities.filter(a => !a.isRead).length

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl p-0">
        <DialogHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Notifications & Messages
              </DialogTitle>
              {unreadCount > 0 && (
                <DialogDescription className="mt-1">
                  <Badge variant="destructive">
                    {unreadCount} unread
                  </Badge>
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="mt-0 p-0">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center space-x-4">
              <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-md' : 'bg-white border-gray-200'}>All ({activities.length})</Button>
              <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')} className={filter === 'unread' ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-md' : 'bg-white border-gray-200'}>Unread ({unreadCount})</Button>
              {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllAsRead} className="ml-auto bg-white border-gray-200 hover:bg-gray-50"><CheckCheck className="w-4 h-4 mr-2" />Mark All Read</Button>}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" /><p className="mt-4 text-gray-600 font-medium">Loading activity...</p></div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4"><Bell className="w-8 h-8 text-gray-400" /></div><p className="text-gray-600 font-medium">No activity found</p><p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredActivities.map((item) => (
                <div key={`${item.type}-${item.id}`} className={`p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${!item.isRead ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-blue-500' : ''}`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{getItemIcon(item)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-medium ${!item.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{item.title}</h3>
                          {getTypeBadge(item)}
                          {!item.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                          {item.senderName && <span className="text-xs text-gray-400">from {item.senderName}</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      {!item.isRead && (
                        <Button variant="outline" size="sm" onClick={() => markAsRead(item)} className="mt-3 bg-white border-gray-200 hover:bg-gray-50"><Check className="w-4 h-4 mr-2" />Mark as Read</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
