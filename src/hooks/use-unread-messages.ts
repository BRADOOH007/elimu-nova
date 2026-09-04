import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useNotificationSound } from './use-notification-sound'
import { useSSE } from './use-sse'

export function useUnreadMessages() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notificationUnread, setNotificationUnread] = useState(0)
  const prevCountRef = useRef(0)
  const { play } = useNotificationSound()

  const fetchCount = useCallback(async () => {
    if (!session?.user) { setLoading(false); return }

    const endpoint =
      session.user.role === 'STUDENT'  ? '/api/student/messages/unread'  :
      session.user.role === 'TEACHER'  ? '/api/teacher/messages/unread'  :
      session.user.role === 'PARENT'   ? '/api/parent/messages/unread'   :
      null

    if (!endpoint) { setLoading(false); return }

    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const d = await res.json()
        const count = d.unreadCount || 0
        if (count > prevCountRef.current && prevCountRef.current >= 0) {
          play('message', 'sidebar')
        }
        prevCountRef.current = count
        setUnreadCount(count)
      }
    } catch (e) { console.warn('[UnreadMessages] fetchCount failed:', e) }
    finally { setLoading(false) }
  }, [session, play])

  const fetchNotificationCount = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/notifications?countOnly=true&unreadOnly=true`)
      if (res.ok) {
        const d = await res.json()
        setNotificationUnread(d.count || 0)
      }
    } catch (e) { console.warn('[UnreadMessages] fetchNotificationCount failed:', e) }
  }, [session])

  // ⚡ Realtime — refetch instantly when a new notification arrives for this user,
  // instead of waiting for the polling interval. Uses per-user channel.
  useSSE(session?.user?.id ? `notifications:${session.user.id}` : null, {
    'new-notification': () => {
      fetchCount()
      fetchNotificationCount()
    },
  })

  useEffect(() => {
    fetchCount()
    fetchNotificationCount()

    // Fallback polling (realtime is opportunistic; poll keeps badges fresh).
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchCount()
        fetchNotificationCount()
      }
    }, 60_000)

    const onVisible = () => {
      if (!document.hidden) {
        fetchCount()
        fetchNotificationCount()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchCount, fetchNotificationCount])

   return { unreadCount, notificationUnread, totalUnread: unreadCount + notificationUnread, loading, refetch: fetchNotificationCount }
}
