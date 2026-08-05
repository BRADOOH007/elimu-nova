'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  target?: string
  title: string
  content: string
  placement: TourPlacement
  highlightPadding?: number
  beforeNext?: 'navigateToPage'
  navigateTo?: string
}

interface TourContextValue {
  isActive: boolean
  currentStep: TourStep | null
  stepIndex: number
  totalSteps: number
  activeTourId: string | null
  startTour: (tourId: string, steps: TourStep[], startIndex?: number) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  goToStep: (index: number) => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const isActive = activeTourId !== null

  const currentStep = steps[stepIndex] ?? null
  const totalSteps = steps.length

  const startTour = useCallback((tourId: string, newSteps: TourStep[], startIndex = 0) => {
    setActiveTourId(tourId)
    setSteps(newSteps)
    setStepIndex(startIndex)
  }, [])

  const endTour = useCallback(() => {
    setActiveTourId(null)
    setSteps([])
    setStepIndex(0)
  }, [])

  const nextStep = useCallback(() => {
    if (!currentStep) return

    if (currentStep.beforeNext === 'navigateToPage' && currentStep.navigateTo) {
      const nextIdx = stepIndex + 1
      if (nextIdx < totalSteps) {
        sessionStorage.setItem('tour-resume', JSON.stringify({ tourId: activeTourId, stepIndex: nextIdx }))
        setStepIndex(nextIdx)
        router.push(currentStep.navigateTo)
      } else {
        endTour()
        router.push(currentStep.navigateTo)
      }
      return
    }

    if (stepIndex + 1 < totalSteps) {
      setStepIndex(i => i + 1)
    } else {
      endTour()
    }
  }, [currentStep, stepIndex, totalSteps, activeTourId, router, endTour])

  const prevStep = useCallback(() => {
    if (stepIndex > 0) setStepIndex(i => i - 1)
  }, [stepIndex])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) setStepIndex(index)
  }, [totalSteps])

  useEffect(() => {
    if (activeTourId) return
    const raw = sessionStorage.getItem('tour-resume')
    if (!raw) return
    try {
      const { tourId: tid, stepIndex: idx } = JSON.parse(raw)
      sessionStorage.setItem('tour-resume-active', JSON.stringify({ tourId: tid, stepIndex: idx }))
      sessionStorage.removeItem('tour-resume')
    } catch { /* ignore */ }
  }, [pathname, activeTourId])

  return (
    <TourContext.Provider value={{
      isActive, currentStep, stepIndex, totalSteps, activeTourId,
      startTour, nextStep, prevStep, endTour, goToStep,
    }}>
      {children}
    </TourContext.Provider>
  )
}
