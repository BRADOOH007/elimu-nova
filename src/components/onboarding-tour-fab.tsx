'use client'

import { useState } from 'react'
import { Compass } from 'lucide-react'
import { useTour } from '@/components/tour/TourProvider'
import { TOUR_CONFIGS } from '@/config/tours'

interface OnboardingTourFabProps {
  role: string
}

export function OnboardingTourFab({ role }: OnboardingTourFabProps) {
  const [hovered, setHovered] = useState(false)
  const { startTour, isActive } = useTour()

  const config = TOUR_CONFIGS[role as keyof typeof TOUR_CONFIGS]
  if (!config || isActive) return null

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => startTour(config.id, config.steps)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-full shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-out overflow-hidden group"
      style={{ padding: hovered ? '0.75rem 1.25rem 0.75rem 0.75rem' : '0.75rem' }}
      aria-label="Take a tour"
    >
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Compass className="h-5 w-5" />
      </div>
      <span
        className="text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out"
        style={{
          maxWidth: hovered ? '120px' : '0px',
          opacity: hovered ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        Take a tour
      </span>
    </button>
  )
}
