'use client'

import { useEffect, useState, useRef } from 'react'
import { useTour, type TourPlacement } from './TourProvider'
import { TourStepRenderer } from './TourStepRenderer'
import { useTourState } from './useTourState'
import { useSession } from 'next-auth/react'

const ARROW_MAP: Record<TourPlacement, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  center: 'none',
}

const TOUR_ACCENTS: Record<string, string> = {
  TEACHER: 'from-indigo-500 to-blue-600',
  STUDENT: 'from-blue-500 to-violet-600',
  SCHOOL_ADMIN: 'from-purple-500 to-pink-600',
  PARENT: 'from-rose-500 to-pink-600',
}

const PLACEMENT_ATTRIBUTION: Record<TourPlacement, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  center: 'none',
}

export function TourTooltip({ role }: { role?: string }) {
  const { isActive, currentStep, stepIndex, totalSteps, nextStep, prevStep, endTour, goToStep } = useTour()
  const { markCompleted } = useTourState()
  const { data: session } = useSession()

  // Skip entire tour and mark permanently complete
  const handleSkipAll = () => {
    const r = role || session?.user?.role || ''
    if (r) markCompleted(r)
    endTour()
  }
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [ready, setReady] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setReady(false)
    if (!isActive || !currentStep) return

    const isCentered = !currentStep.target || currentStep.placement === 'center'

    if (isCentered) {
      setPosition({
        top: Math.max(24, window.innerHeight / 2 - 200),
        left: Math.max(16, window.innerWidth / 2 - 220),
      })
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
      const tw = tooltipEl.offsetWidth
      const th = tooltipEl.offsetHeight

      let top = 0, left = 0
      switch (currentStep.placement) {
        case 'top':
          top = rect.top - th - 14; left = rect.left + rect.width / 2 - tw / 2; break
        case 'bottom':
          top = rect.bottom + 14; left = rect.left + rect.width / 2 - tw / 2; break
        case 'left':
          top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - 14; break
        case 'right':
          top = rect.top + rect.height / 2 - th / 2; left = rect.right + 14; break
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

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleSkipAll(); return }
      if (e.key === 'Enter' || e.key === 'ArrowRight') { nextStep(); return }
      if (e.key === 'ArrowLeft') { prevStep(); return }
    }

    tooltip.addEventListener('keydown', handleTab)
    tooltip.addEventListener('keydown', handleKey)
    first?.focus()
    return () => {
      tooltip.removeEventListener('keydown', handleTab)
      tooltip.removeEventListener('keydown', handleKey)
    }
  }, [isActive, stepIndex])

  if (!isActive || !currentStep || !ready) return null

  const isCentered = !currentStep.target || currentStep.placement === 'center'
  const showArrow = !isCentered
  const accent = (role && TOUR_ACCENTS[role]) || 'from-blue-500 to-purple-600'

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title}`}
      aria-modal="true"
      className="fixed z-[10000]"
      style={{
        top: position.top,
        left: position.left,
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      {/* Arrow */}
      {showArrow && (
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border border-slate-200/80"
          style={{
            [ARROW_MAP[currentStep.placement]]: -6,
            left: ['top', 'bottom'].includes(currentStep.placement) ? '50%' : undefined,
            marginLeft: ['top', 'bottom'].includes(currentStep.placement) ? -6 : undefined,
            top: ['left', 'right'].includes(currentStep.placement) ? '50%' : undefined,
            marginTop: ['left', 'right'].includes(currentStep.placement) ? -6 : undefined,
          }}
        />
      )}

      {/* Main card — premium glassmorphism */}
      <div
        className={`
          bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl
          border border-white/20 overflow-hidden
          ${isCentered ? 'min-w-[340px] max-w-[460px] shadow-blue-500/10' : 'min-w-[300px] max-w-[420px]'}
        `}
      >
        {/* Accent bar */}
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
