'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeacherLiveMetrics {
  studentsTotal: number
  submissionsToday: number
  pendingGrading: number
  lessonsThisWeek: number
  averagePerformance: number
  activeStudents30d: number
}

export function useTeacherLiveMetrics(pollInterval = 15000) {
  const [metrics, setMetrics] = useState<TeacherLiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/live-metrics')
      if (res.ok) {
        setMetrics(await res.json())
      }
    } catch (e) { console.warn('[LiveMetrics] Teacher fetch failed:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, pollInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, pollInterval])

  return { metrics, loading }
}
