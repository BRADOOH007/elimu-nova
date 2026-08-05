'use client'

import { useEffect, useState, useRef } from 'react'
import { useTour } from './TourProvider'

const OVERLAY_Z = 99999

export function TourOverlay() {
  const { isActive, currentStep } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const rafRef = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const maskId = useRef(`tour-spotlight-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    if (!isActive || !currentStep?.target || currentStep.placement === 'center') {
      setTargetRect(null)
      return
    }

    let active = true
    const update = () => {
      if (!active) return
      const el = document.querySelector(currentStep.target!)
      if (el) setTargetRect(el.getBoundingClientRect())
    }

    update()
    const t = setTimeout(update, 300)
    const observer = new ResizeObserver(update)
    const el = document.querySelector(currentStep.target!)
    if (el) observer.observe(el)

    const onScroll = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, true)

    return () => {
      active = false
      clearTimeout(t)
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [isActive, currentStep?.target, currentStep?.id])

  if (!isActive) return null

  const padding = currentStep?.highlightPadding ?? 8
  const isCentered = !currentStep?.target || currentStep.placement === 'center'

  if (isCentered) return null

  return (
    <div
      data-tour-overlay="true"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: OVERLAY_Z, pointerEvents: 'none', isolation: 'isolate' }}
    >
      <svg
        ref={svgRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', isolation: 'isolate' }}
      >
        <defs>
          <mask id={maskId.current}>
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                fill="black"
                rx={14}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.22)"
          mask={`url(#${maskId.current})`}
        />
        {targetRect && (
          <rect
            x={targetRect.left - padding - 2}
            y={targetRect.top - padding - 2}
            width={targetRect.width + padding * 2 + 4}
            height={targetRect.height + padding * 2 + 4}
            fill="none"
            stroke="rgba(59,130,246,0.55)"
            strokeWidth="3"
            rx={16}
            style={{ animation: 'tour-pulse 2s ease-in-out infinite' }}
          />
        )}
      </svg>
    </div>
  )
}
