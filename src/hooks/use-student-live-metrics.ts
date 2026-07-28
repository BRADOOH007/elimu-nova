'use client'

import { useState, useEffect, useCallback } from 'react'

interface StudentLiveMetrics {
  pendingAssignments: number
  upcomingLessons: number
  completedToday: number
  studyTimeMinutes: number
  averageGrade: number
  streakDays: number
}

export function useStudentLiveMetrics(pollInterval = 15000) {
  const [metrics, setMetrics] = useState<StudentLiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await window.fetch('/api/student/live-metrics')
      if (res.ok) setMetrics(await res.json())
    } catch (e) { console.warn('[LiveMetrics] Student fetch failed:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMetrics(); const id = setInterval(fetchMetrics, pollInterval); return () => clearInterval(id) }, [fetchMetrics, pollInterval])

  return { metrics, loading }
}
