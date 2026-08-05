'use client'

import { useEffect, useState, useRef } from 'react'
import { useTour, type TourPlacement } from './TourProvider'
import { TourStepRenderer } from './TourStepRenderer'
import { useTourState } from './useTourState'
import { useSession } from 'next-auth/react'

const TOOLTIP_Z = 100000

const ARROW_SIDE: Record<TourPlacement, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left', center: 'none' }

const ROLE_ACCENTS: Record<string, string> = {
  TEACHER: 'from-violet-500 to-indigo-600',
  STUDENT: 'from-blue-500 to-violet-600',
  SCHOOL_ADMIN: 'from-purple-500 to-pink-600',
  PARENT: 'from-rose-500 to-pink-600',
}

export function TourTooltip({ role }: { role?: string }) {
  const { isActive, currentStep, stepIndex, totalSteps, nextStep, prevStep, endTour, goToStep } = useTour()
  const { markCompleted } = useTourState()
  const { data: session } = useSession()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [ready, setReady] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  const handleSkipAll = () => {
    const r = role || session?.user?.role || ''
    if (r) markCompleted(r)
    endTour()
  }

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setReady(false)
    if (!isActive || !currentStep) return

    const isCentered = !currentStep.target || currentStep.placement === 'center'

    if (isCentered) {
      setPosition({ top: Math.max(24, window.innerHeight / 2 - 200), left: Math.max(16, window.innerWidth / 2 - 220) })
      setReady(true)
      return
    }

    const pos = () => {
      if (!mountedRef.current) return
      const el = document.querySelector(currentStep.target!)
      if (!el) return
      const rect = el.getBoundingClientRect()
      const tooltipEl = tooltipRef.current
      if (!tooltipEl) return
      const tw = tooltipEl.offsetWidth || 340
      const th = tooltipEl.offsetHeight || 200

      let top = 0, left = 0
      switch (currentStep.placement) {
        case 'top': top = rect.top - th - 16; left = rect.left + rect.width / 2 - tw / 2; break
        case 'bottom': top = rect.bottom + 16; left = rect.left + rect.width / 2 - tw / 2; break
        case 'left': top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - 16; break
        case 'right': top = rect.top + rect.height / 2 - th / 2; left = rect.right + 16; break
      }
      top = Math.max(20, Math.min(top, window.innerHeight - th - 20))
      left = Math.max(20, Math.min(left, window.innerWidth - tw - 20))
      setPosition({ top, left })
      setReady(true)
    }

    pos()
    const raf = requestAnimationFrame(() => pos())
    const onScroll = () => { cancelAnimationFrame(raf); requestAnimationFrame(pos) }
    window.addEventListener('scroll', onScroll, true)
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(pos))
    const el = document.querySelector(currentStep.target!)
    if (el) resizeObserver.observe(el)

    return () => {
      window.removeEventListener('scroll', onScroll, true)
      resizeObserver.disconnect()
    }
  }, [isActive, currentStep, stepIndex])

  useEffect(() => {
    if (!isActive || !tooltipRef.current) return
    const tooltip = tooltipRef.current
    const focusable = tooltip.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && focusable.length > 0) {
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus() } }
        else { if (document.activeElement === last) { e.preventDefault(); first?.focus() } }
      }
      if (e.key === 'Escape') handleSkipAll()
      if (e.key === 'ArrowRight') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }

    tooltip.addEventListener('keydown', handleKey)
    first?.focus()
    return () => tooltip.removeEventListener('keydown', handleKey)
  }, [isActive, stepIndex])

  if (!isActive || !currentStep || !ready) return null

  const isCentered = !currentStep.target || currentStep.placement === 'center'
  const showArrow = !isCentered
  const accent = (role && ROLE_ACCENTS[role]) || 'from-blue-500 to-violet-600'

  return (
    <div
        ref={tooltipRef}
        data-tour-tooltip="true"
        role="dialog"
        aria-label={`Step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title}`}
        aria-modal="true"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: TOOLTIP_Z,
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          isolation: 'isolate',
          pointerEvents: 'auto',
          filter: 'none',
          backdropFilter: 'none',
        }}
      >
        {showArrow && (
          <div
            style={{
              position: 'absolute',
              width: 16, height: 16,
              background: '#fff',
              transform: 'rotate(45deg)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              [ARROW_SIDE[currentStep.placement]]: -8,
              ...(['top', 'bottom'].includes(currentStep.placement) ? { left: '50%', marginLeft: -8 } : {}),
              ...(['left', 'right'].includes(currentStep.placement) ? { top: '50%', marginTop: -8 } : {}),
            }}
          />
        )}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minWidth: isCentered ? 360 : 320,
            maxWidth: isCentered ? 480 : 440,
            filter: 'none',
            backdropFilter: 'none',
          }}
        >
          <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
          <TourStepRenderer
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            accent={accent}
            onNext={nextStep}
            onPrev={prevStep}
            onEnd={handleSkipAll}
            onSkipAll={handleSkipAll}
            onGoToStep={goToStep}
          />
        </div>
      </div>
    )
}
