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
    <button
      onClick={() => startTour(config.id, config.steps)}
      className="fixed bottom-6 right-6 z-[9990] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 group"
      aria-label="Start tour guide"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="text-xs font-medium opacity-0 max-w-0 overflow-hidden group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">Take a tour</span>
    </button>
  )
}
