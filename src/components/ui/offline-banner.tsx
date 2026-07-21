'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    setOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      You're offline — some features may be unavailable
    </div>
  )
}
