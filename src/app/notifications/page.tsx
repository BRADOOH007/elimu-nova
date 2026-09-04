'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Check, CheckCheck, CheckCircle, AlertCircle, AlertTriangle, Info,
  MessageSquare, Loader2, Inbox,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

const msgEndpointForRole = (role?: string) => {
  if (role === 'TEACHER') return '/api/teacher/messages'
  if (role === 'STUDENT') return '/api/student/messages'
  if (role === 'PARENT') return '/api/parent/messages'
  return null
}

const NOTIF_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
}

export default function NotificationsInboxPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const role = session?.user?.role

  const load = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const msgEndpoint = msgEndpointForRole(role)
      const [notifRes, msgRes] = await Promise.all([
        fetch(`/api/notifications`),
        msgEndpoint ? fetch(msgEndpoint) : Promise.resolve(null),
      ])

      const notifData = notifRes.ok ? await notifRes.json() : []
      const notifications = Array.isArray(notifData) ? notifData : (notifData.notifications || [])

      let messages: any[] = []
      if (msgRes && msgRes.ok) {
        const msgData = await msgRes.json()
        messages = msgData.messages || []
      }

      const notifItems: ActivityItem[] = notifications.map((n: any) => ({
        id: n.id, type: 'notification', title: n.title, description: n.message,
        timestamp: n.createdAt, isRead: n.isRead, notificationType: n.type,
      }))
      const msgItems: ActivityItem[] = messages
        .filter((m: any) => !m.read && !m.isSent)
        .map((m: any) => ({
          id: m.id, type: 'message', title: m.subject || 'New Message',
          description: m.content, timestamp: m.createdAt, isRead: m.read, senderName: m.sender?.name,
        }))

      const combined = [...notifItems, ...msgItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setActivities(combined)
    } catch (e) {
      console.error('[Inbox] load failed:', e)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, role])

  useEffect(() => { if (session?.user?.id) load() }, [load])

  const markRead = async (item: ActivityItem) => {
    try {
      if (item.type === 'notification') {
        const r = await fetch(`/api/notifications/${item.id}/read`, { method: 'PATCH' })
        if (!r.ok) throw new Error('mark failed')
      } else {
        const e = msgEndpointForRole(role)
        if (e) await fetch(e, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: item.id }) })
      }
      setActivities(prev => prev.map(a => a.id === item.id ? { ...a, isRead: true } : a))
    } catch (e) { toast({ variant: 'destructive', title: 'Could not mark as read' }) }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session?.user?.id }) })
      setActivities(prev => prev.map(a => ({ ...a, isRead: true })))
      toast({ title: 'All marked read' })
    } catch {
      toast({ variant: 'destructive', title: 'Could not update' })
    }
  }

  const unreadCount = activities.filter(a => !a.isRead).length
  const list = activities.filter(a => filter === 'all' || !a.isRead)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
            <p className="text-sm text-slate-500">Notifications & messages</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="bg-white">
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All ({activities.length})
        </Button>
        <Button size="sm" variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>
          Unread ({unreadCount})
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : list.length === 0 ? (
        <Card className="text-center py-16">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">You're all caught up</p>
          <p className="text-sm text-slate-400">{filter === 'unread' ? 'No unread items.' : 'No notifications yet.'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((item) => (
            <Card key={`${item.type}-${item.id}`} className={`p-4 ${!item.isRead ? 'border-l-4 border-blue-500 bg-blue-50/40' : 'bg-white'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {item.type === 'message' ? <MessageSquare className="h-5 w-5 text-purple-500" /> : NOTIF_ICON[item.notificationType || 'info']}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-medium ${item.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{item.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">{item.type === 'message' ? 'message' : (item.notificationType || 'info')}</Badge>
                    {!item.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                    {item.senderName && <span className="text-xs text-slate-400">from {item.senderName}</span>}
                    {!item.isRead && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => markRead(item)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center mt-8 text-sm text-slate-400">
        View messages in your <Link href="/messages" className="text-blue-600 hover:underline">messages</Link> page.
      </div>
    </div>
  )
}
