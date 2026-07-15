'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Unregister any existing service worker first to clear stale caches
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
        }
      })
    }
  }, [])

  return null
}