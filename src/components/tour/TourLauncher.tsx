'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useTour } from './TourProvider'
import { useTourState } from './useTourState'
import { TOUR_CONFIGS } from '@/config/tours'

const ROLE_TOUR_MAP: Record<string, string> = {
  TEACHER: 'teacher-onboarding',
  STUDENT: 'student-onboarding',
  SCHOOL_ADMIN: 'school-admin-onboarding',
  PARENT: 'parent-onboarding',
}

export function TourLauncher() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { startTour, isActive } = useTour()
  const { isCompleted } = useTourState()
  const launchedRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.role || isActive) return

    const role = session.user.role as keyof typeof TOUR_CONFIGS
    const config = TOUR_CONFIGS[role]
    if (!config) return

    const storageKey = `tour-${role.toLowerCase()}-completed`
    if (isCompleted(role) || localStorage.getItem(storageKey)) return

    const resumeRaw = sessionStorage.getItem('tour-resume-active')
    if (resumeRaw) {
      sessionStorage.removeItem('tour-resume-active')
      try {
        const { tourId, stepIndex } = JSON.parse(resumeRaw)
        startTour(tourId, config.steps, stepIndex)
        return
      } catch (e) { console.warn('[Tour] Failed to parse resume active:', e) }
    }

    const firstStep = config.steps[0]
    if (firstStep?.navigateTo && pathname !== firstStep.navigateTo) return

    if (!launchedRef.current) {
      launchedRef.current = true
      const t = setTimeout(() => {
        startTour(config.id, config.steps)
      }, 800)
      return () => clearTimeout(t)
    }
  }, [session?.user?.role, pathname, isActive, startTour, isCompleted])

  return null
}
