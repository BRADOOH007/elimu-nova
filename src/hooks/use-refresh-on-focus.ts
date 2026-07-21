'use client'

import { useEffect, useRef } from 'react'

export function useRefreshOnFocus(refetch: () => void, enabled = true) {
  const lastFocus = useRef(Date.now())

  useEffect(() => {
    if (!enabled) return

    const onFocus = () => {
      const now = Date.now()
      if (now - lastFocus.current > 30000) {
        lastFocus.current = now
        refetch()
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetch, enabled])
}
