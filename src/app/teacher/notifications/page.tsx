'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teacher/notifications?limit=50')
      const data = await response.json()
      if (response.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = async () => {
    await fetch('/api/teacher/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllAsRead: true })
    })
    await fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch('/api/teacher/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    })
    await fetchNotifications()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Notifications</h1>
          <p className="text-gray-600 mt-1">Track alerts, reminders, and classroom updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={markAllRead} disabled={!unreadCount}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Inbox
            {unreadCount > 0 && <Badge className="bg-blue-100 text-blue-800">{unreadCount} unread</Badge>}
          </CardTitle>
          <CardDescription>{notifications.length} notification{notifications.length === 1 ? '' : 's'} available</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div key={notification.id} className={`rounded-lg border p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <Badge variant="secondary">{notification.type}</Badge>
                        {!notification.isRead && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{notification.message}</p>
                      <p className="mt-2 text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.isRead && (
                      <Button variant="outline" size="sm" onClick={() => markRead(notification.id)}>
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              No notifications yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
