'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Unregister stale workers, then (re)register the current one so
      // offline caching + PWA install work. Skip registration on non-HTTPS
      // localhost-incompatible environments automatically (SW needs secure context).
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
        }
      }).finally(() => {
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          // Service workers require HTTPS (or localhost) — skip in insecure contexts.
          return
        }
        navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
      })
    }
  }, [])

  return null
}