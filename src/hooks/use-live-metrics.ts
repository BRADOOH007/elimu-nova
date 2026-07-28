'use client'

import { useState, useEffect, useCallback } from 'react'

interface LiveMetrics {
  schools: number
  users: number
  active24h: number
  revenue: number
  pendingInvoices: number
  timestamp: number
}

export function useLiveMetrics(intervalMs = 10000) {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/live-metrics')
      if (res.ok) setMetrics(await res.json())
    } catch (e) { console.warn('[LiveMetrics] Super admin fetch failed:', e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMetrics()
    const id = setInterval(fetchMetrics, intervalMs)
    return () => clearInterval(id)
  }, [fetchMetrics, intervalMs])

  return { metrics, loading }
}
