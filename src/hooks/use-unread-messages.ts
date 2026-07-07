import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useUnreadMessages() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(true)

  const fetchCount = useCallback(async () => {
    if (!session?.user) { setLoading(false); return }

    const endpoint =
      session.user.role === 'STUDENT'  ? '/api/student/messages/unread'  :
      session.user.role === 'TEACHER'  ? '/api/teacher/messages/unread'  :
      null

    if (!endpoint) { setLoading(false); return }

    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const d = await res.json()
        setUnreadCount(d.unreadCount || 0)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => {
    fetchCount()

    // Poll every 60 seconds — but only when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) fetchCount()
    }, 60_000)

    // Refetch when user switches back to the tab
    const onVisible = () => { if (!document.hidden) fetchCount() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchCount])

  return { unreadCount, loading }
}
