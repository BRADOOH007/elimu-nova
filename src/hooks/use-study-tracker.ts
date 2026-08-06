'use client'

import { useEffect, useRef, useState } from 'react'

export function useStudyTracker(userId?: string, subject?: string, topic?: string) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const accumulatedRef = useRef(0)

  const start = () => {
    setIsActive(true)
  }

  const stop = () => {
    setIsActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (accumulatedRef.current > 0 && userId) {
      const s = accumulatedRef.current
      accumulatedRef.current = 0
      fetch('/api/student/track-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, durationSeconds: s }),
      }).catch(() => {})
    }
  }

  const flush = async () => {
    if (accumulatedRef.current < 30 || !userId) return
    const s = accumulatedRef.current
    accumulatedRef.current = 0
    await fetch('/api/student/track-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, durationSeconds: s }),
    }).catch(() => {})
  }

  useEffect(() => {
    if (!isActive) return
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSeconds(prev => prev + 30)
        accumulatedRef.current += 30
        if (accumulatedRef.current >= 30) flush()
      }
    }, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive, userId])

  useEffect(() => {
    return () => { stop() }
  }, [])

  return { seconds, isActive, start, stop, minutes: Math.round(seconds / 60) }
}
