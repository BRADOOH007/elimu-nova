'use client'

import { useSession } from 'next-auth/react'
import { useTour } from './TourProvider'
import { TOUR_CONFIGS } from '@/config/tours'
import { HelpCircle } from 'lucide-react'

export function TourHelpButton() {
  const { data: session } = useSession()
  const { isActive, startTour } = useTour()

  const role = session?.user?.role as keyof typeof TOUR_CONFIGS
  const config = role ? TOUR_CONFIGS[role] : null

  if (!config || isActive) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9990]">
      <button
        onClick={() => startTour(config.id, config.steps)}
        className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Start tour guide"
        title="Take a tour"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </div>
  )
}
