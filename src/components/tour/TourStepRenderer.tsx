'use client'

import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  step: { title: string; content: string }
  stepIndex: number
  totalSteps: number
  accent?: string
  onNext: () => void
  onPrev: () => void
  onEnd: () => void
}

export function TourStepRenderer({ step, stepIndex, totalSteps, accent, onNext, onPrev, onEnd }: Props) {
  const progress = ((stepIndex + 1) / totalSteps) * 100
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const grad = accent || 'from-blue-500 to-purple-600'

  return (
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
        </div>
        <button
          onClick={onEnd}
          className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Close tour"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">{step.content}</p>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{stepIndex + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex ? 'bg-blue-600 w-3 h-1.5' : 'bg-slate-300 w-1.5 h-1.5'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={isFirst} className="text-xs">
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        {isLast ? (
          <Button size="sm" onClick={onEnd} className={`bg-gradient-to-r ${grad} text-white text-xs`}>
            Done
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className={`bg-gradient-to-r ${grad} text-white text-xs`}>
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
