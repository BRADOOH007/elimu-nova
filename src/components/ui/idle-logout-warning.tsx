'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Clock, AlertTriangle } from 'lucide-react'

const IDLE_MINUTES   = 30  // warn after 30 mins idle
const WARNING_SECONDS = 60  // give 60s to respond before logout

export function IdleLogoutWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown]    = useState(WARNING_SECONDS)
  const idleTimer   = useRef<NodeJS.Timeout | null>(null)
  const countTimer  = useRef<NodeJS.Timeout | null>(null)

  const resetIdle = useCallback(() => {
    if (showWarning) return  // don't reset if warning is already showing
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(WARNING_SECONDS)
    }, IDLE_MINUTES * 60 * 1000)
  }, [showWarning])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))
    resetIdle()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle))
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (countTimer.current) clearTimeout(countTimer.current)
    }
  }, [resetIdle])

  // Countdown timer
  useEffect(() => {
    if (!showWarning) return
    if (countdown <= 0) { signOut({ callbackUrl: '/auth/signin' }); return }
    countTimer.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => {
      if (countTimer.current) clearTimeout(countTimer.current)
    }
  }, [showWarning, countdown])

  const stayLoggedIn = () => {
    setShowWarning(false)
    if (countTimer.current) clearTimeout(countTimer.current)
    resetIdle()
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Still there?</h2>
        <p className="text-slate-500 text-sm mb-2">
          You've been inactive for {IDLE_MINUTES} minutes. For security, you'll be logged out in:
        </p>
        <div className="text-4xl font-extrabold text-amber-500 mb-6 tabular-nums">
          {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex-1 h-11 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign out now
          </button>
          <button
            onClick={stayLoggedIn}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}
