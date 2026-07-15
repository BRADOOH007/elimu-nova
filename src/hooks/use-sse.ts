'use client'

import { useEffect, useRef, useCallback } from 'react'

type EventHandler = (data: unknown) => void

export function useSSE(channel: string | null, handlers: Record<string, EventHandler>) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const reconnectRef = useRef<number | null>(null)

  const connect = useCallback(() => {
    if (!channel) return

    const eventSource = new EventSource(`/api/stream?channel=${encodeURIComponent(channel)}`)

    Object.keys(handlersRef.current).forEach((event) => {
      eventSource.addEventListener(event, (e) => {
        try {
          const data = JSON.parse(e.data)
          handlersRef.current[event]?.(data)
        } catch {
          // ignore malformed events
        }
      })
    })

    eventSource.onerror = () => {
      eventSource.close()
      reconnectRef.current = window.setTimeout(() => connect(), 3000)
    }

    return eventSource
  }, [channel])

  useEffect(() => {
    const es = connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      es?.close()
    }
  }, [connect])
}
