'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useTourState() {
  const { data: session } = useSession()

  const markCompleted = useCallback((role: string) => {
    const key = `tour-${role.toLowerCase()}-completed`
    localStorage.setItem(key, new Date().toISOString())

    if (session?.user?.id) {
      fetch('/api/user-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          tourCompletion: { [role]: new Date().toISOString() },
        }),
      }).catch(() => { })
    }
  }, [session])

  const isCompleted = useCallback((role: string): boolean => {
    return !!localStorage.getItem(`tour-${role.toLowerCase()}-completed`)
  }, [])

  return { markCompleted, isCompleted }
}
