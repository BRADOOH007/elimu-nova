'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface LockdownState {
  sessionId: string | null
  reentryStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'DENIED'
  violationCount: number
  isLocked: boolean
}

export function useExamLockdown(assignmentId: string, enabled: boolean) {
  const [state, setState] = useState<LockdownState>({
    sessionId: null,
    reentryStatus: 'NONE',
    violationCount: 0,
    isLocked: false,
  })
  const sessionIdRef = useRef<string | null>(null)
  const previousHiddenRef = useRef(false)
  const wasFullscreenRef = useRef(false)

  const recordViolation = useCallback(async (type: string, details?: string) => {
    if (!sessionIdRef.current) return
    try {
      await fetch(`/api/exam-sessions/${sessionIdRef.current}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, details: details || '' })
      })
      setState(prev => ({ ...prev, violationCount: prev.violationCount + 1 }))
    } catch (e) { console.warn('[ExamLockdown] recordViolation failed:', e) }
  }, [])

  const requestReentry = useCallback(async () => {
    if (!sessionIdRef.current) return
    setState(prev => ({ ...prev, reentryStatus: 'PENDING', isLocked: true }))
    try {
      await fetch(`/api/exam-sessions/${sessionIdRef.current}/reentry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' })
      })
    } catch (e) { console.warn('[ExamLockdown] requestReentry failed:', e) }
  }, [])

  const checkReentryStatus = useCallback(async () => {
    if (!sessionIdRef.current) return
    try {
      const res = await fetch(`/api/exam-sessions/${sessionIdRef.current}/reentry`)
      if (!res.ok) return
      const data = await res.json()
      if (data.session?.reentryStatus === 'APPROVED') {
        setState(prev => ({ ...prev, reentryStatus: 'APPROVED', isLocked: false }))
        previousHiddenRef.current = false
        wasFullscreenRef.current = false
      }
    } catch (e) { console.warn('[ExamLockdown] checkReentryStatus failed:', e) }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const init = async () => {
      try {
        const res = await fetch('/api/exam-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignmentId })
        })
        if (res.ok) {
          const data = await res.json()
          sessionIdRef.current = data.session.id
          setState(prev => ({ ...prev, sessionId: data.session.id }))
        }
      } catch (e) { console.warn('[ExamLockdown] init session failed:', e) }
    }
    init()

    const onVisibility = () => {
      if (document.hidden && !previousHiddenRef.current) {
        previousHiddenRef.current = true
        recordViolation('TAB_SWITCH', 'Student switched tabs during exam')
        requestReentry()
      }
      if (!document.hidden) {
        previousHiddenRef.current = false
      }
    }

    const onBlur = () => {
      if (!previousHiddenRef.current) {
        recordViolation('TAB_SWITCH', 'Window lost focus during exam')
      }
    }

    const onContext = (e: MouseEvent) => {
      e.preventDefault()
      recordViolation('RIGHT_CLICK', 'Right-click attempted')
    }

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      recordViolation('COPY_PASTE', 'Copy attempted')
    }

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      recordViolation('COPY_PASTE', 'Paste attempted')
    }

    const onFullscreen = () => {
      if (!document.fullscreenElement && !wasFullscreenRef.current) {
        wasFullscreenRef.current = true
        recordViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode')
        requestReentry()
      }
      if (document.fullscreenElement) {
        wasFullscreenRef.current = false
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('fullscreenchange', onFullscreen)

    const fsInterval = setInterval(() => {
      if (!document.fullscreenElement && state.reentryStatus === 'NONE') {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }, 10000)

    document.documentElement.requestFullscreen().catch(() => {})

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('fullscreenchange', onFullscreen)
      clearInterval(fsInterval)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [enabled, assignmentId, recordViolation, requestReentry, state.reentryStatus])

  return { ...state, checkReentryStatus }
}
