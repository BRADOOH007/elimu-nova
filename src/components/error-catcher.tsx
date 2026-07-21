'use client'

import { useEffect } from 'react'

export function ErrorCatcher() {
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.filename?.startsWith('chrome-extension://')) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return true
      }
    }
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      if (e.reason?.stack?.includes('chrome-extension://')) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener('error', handler, { capture: true })
    window.addEventListener('unhandledrejection', rejectionHandler, { capture: true })
    return () => {
      window.removeEventListener('error', handler, { capture: true })
      window.removeEventListener('unhandledrejection', rejectionHandler, { capture: true })
    }
  }, [])
  return null
}
