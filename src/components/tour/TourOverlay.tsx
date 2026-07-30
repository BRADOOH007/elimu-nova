'use client'

import { useEffect, useState, useRef } from 'react'
import { useTour } from './TourProvider'

export function TourOverlay() {
  const { isActive, currentStep } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const rafRef = useRef<number>(0)
  const targetFound = useRef(false)

  useEffect(() => {
    if (!isActive || !currentStep?.target || currentStep.placement === 'center') {
      setTargetRect(null)
      targetFound.current = false
      return
    }

    const update = () => {
      const el = document.querySelector(currentStep.target!)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        targetFound.current = true
      }
    }

    update()
    const t = setTimeout(update, 300)

    const observer = new ResizeObserver(update)
    const el = currentStep.target ? document.querySelector(currentStep.target) : null
    if (el) observer.observe(el)

    const onScroll = () => { rafRef.current = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, true)

    return () => {
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
  // Don't render a full-black overlay if the target element wasn't found
  if (!targetFound.current) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" aria-hidden="true">
      <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && !isCentered && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                fill="black"
                rx={12}
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight-mask)"
          className="animate-tour-overlay-in"
        />
      </svg>
    </div>
  )
}
