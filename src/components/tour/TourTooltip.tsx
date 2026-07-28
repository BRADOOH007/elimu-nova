'use client'

import { useEffect, useState, useRef } from 'react'
import { useTour, type TourPlacement } from './TourProvider'
import { TourStepRenderer } from './TourStepRenderer'

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

export function TourTooltip({ role }: { role?: string }) {
  const { isActive, currentStep, stepIndex, totalSteps, nextStep, prevStep, endTour, activeTourId } = useTour()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const padding = currentStep?.highlightPadding ?? 8

  useEffect(() => {
    if (!isActive || !currentStep) return

    if (!currentStep.target || currentStep.placement === 'center') {
      setPosition({
        top: Math.max(24, window.innerHeight / 2 - 180),
        left: Math.max(16, window.innerWidth / 2 - 200),
      })
      return
    }

    const pos = () => {
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
          top = rect.top - th - 12; left = rect.left + rect.width / 2 - tw / 2; break
        case 'bottom':
          top = rect.bottom + 12; left = rect.left + rect.width / 2 - tw / 2; break
        case 'left':
          top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - 12; break
        case 'right':
          top = rect.top + rect.height / 2 - th / 2; left = rect.right + 12; break
      }
      top = Math.max(16, Math.min(top, window.innerHeight - th - 16))
      left = Math.max(16, Math.min(left, window.innerWidth - tw - 16))
      setPosition({ top, left })
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

    tooltip.addEventListener('keydown', handleTab)
    first?.focus()
    return () => tooltip.removeEventListener('keydown', handleTab)
  }, [isActive, stepIndex])

  if (!isActive || !currentStep) return null

  const showArrow = currentStep.placement !== 'center'
  const accent = (role && TOUR_ACCENTS[role]) || 'from-blue-500 to-purple-600'

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title}`}
      aria-modal="true"
      className="fixed z-[10000] animate-tour-tooltip-in"
      style={{ top: position.top, left: position.left }}
    >
      {showArrow && (
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border border-slate-200"
          style={{
            [ARROW_MAP[currentStep.placement]]: -6,
            left: ['top', 'bottom'].includes(currentStep.placement) ? '50%' : undefined,
            marginLeft: ['top', 'bottom'].includes(currentStep.placement) ? -6 : undefined,
            top: ['left', 'right'].includes(currentStep.placement) ? '50%' : undefined,
            marginTop: ['left', 'right'].includes(currentStep.placement) ? -6 : undefined,
          }}
        />
      )}
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[280px] max-w-[400px]">
        <TourStepRenderer
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          accent={accent}
          onNext={nextStep}
          onPrev={prevStep}
          onEnd={endTour}
        />
      </div>
    </div>
  )
}
