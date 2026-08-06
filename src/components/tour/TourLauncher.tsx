'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useTour } from './TourProvider'
import { useTourState } from './useTourState'
import { TOUR_CONFIGS } from '@/config/tours'

export function TourLauncher() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { startTour, isActive } = useTour()
  const { isCompleted, markCompleted } = useTourState()
  const launchedRef = useRef(false)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!session?.user?.role || isActive || launchedRef.current) return

    const role = session.user.role as keyof typeof TOUR_CONFIGS
    const config = TOUR_CONFIGS[role]
    if (!config) return

    if (isCompleted(role)) return

    const resumeRaw = sessionStorage.getItem('tour-resume-active')
    if (resumeRaw) {
      sessionStorage.removeItem('tour-resume-active')
      try {
        const { tourId, stepIndex } = JSON.parse(resumeRaw)
        launchedRef.current = true
        startTour(tourId, config.steps, stepIndex)
        return
      } catch { /* ignore */ }
    }

    // Auto-start disabled — tour only starts when user clicks the Tour button manually
    // To re-enable: const firstStep = config.steps[0]
    // if (firstStep?.navigateTo && pathname !== firstStep.navigateTo) return
    // delayRef.current = setTimeout(() => { startTour(config.id, config.steps) }, 800)
    return

    return () => { if (delayRef.current) clearTimeout(delayRef.current) }
  }, [session?.user?.role, pathname, isActive, startTour, isCompleted, markCompleted])

  return null
}
