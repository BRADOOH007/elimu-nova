'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
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

interface NotificationsTabProps {
  /** Compact mode for embedding inside messages page tabs */
  compact?: boolean
}

export default function NotificationsTab({ compact = false }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`/api/notifications?limit=${limit}&offset=${(page - 1) * limit}`),
        fetch(`/api/notifications?countOnly=true&unreadOnly=true`),
      ])
      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotifications(Array.isArray(data) ? data : data.notifications || [])
      }
      if (countRes.ok) {
        const d = await countRes.json()
        setUnreadCount(d.count || 0)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    await fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    await fetchNotifications()
  }

  const totalPages = Math.max(1, Math.ceil((unreadCount + notifications.filter(n => n.isRead).length) / limit))

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 shrink-0">
          <span className="text-xs font-semibold text-slate-600">
            Notifications {unreadCount > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700 text-[10px] h-4">{unreadCount} unread</Badge>}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={fetchNotifications} disabled={loading} className="h-6 px-2 text-xs">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={!unreadCount} className="h-6 px-2 text-xs">
              <CheckCheck className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Bell className="mx-auto mb-2 h-6 w-6 opacity-30" />
              <p className="text-xs">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} className="h-6 px-1.5 text-[10px]">
                          Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
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
            <>
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
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
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

function CheckCheck(props: any) {
  return <CheckCircle {...props} />
}
