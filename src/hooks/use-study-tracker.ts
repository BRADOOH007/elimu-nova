'use client'

import { useEffect, useRef, useState } from 'react'

export function useStudyTracker(subject?: string, topic?: string) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const persistedRef = useRef(0)

  const start = () => {
    setIsActive(true)
    // Log immediately
    ping()
  }

  const stop = () => {
    setIsActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const ping = async () => {
    try {
      await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'STUDY_TIME', duration: 30, subject, topic }),
      })
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 30)
        persistedRef.current += 30
        ping()
      }, 30000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) { if (intervalRef.current) clearInterval(intervalRef.current) }
      else if (isActive) { intervalRef.current = setInterval(() => { setSeconds(prev => prev + 30); ping() }, 30000) }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isActive])

  return { seconds, isActive, start, stop, minutes: Math.round(seconds / 60) }
}
