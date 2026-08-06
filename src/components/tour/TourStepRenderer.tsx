'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  step: { title: string; content: string }
  stepIndex: number
  totalSteps: number
  accent?: string
  onNext: () => void
  onPrev: () => void
  onEnd: () => void
  onSkipAll: () => void
  onGoToStep?: (index: number) => void
}

export function TourStepRenderer({ step, stepIndex, totalSteps, accent, onNext, onPrev, onEnd, onSkipAll }: Props) {
  const progress = ((stepIndex + 1) / totalSteps) * 100
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const grad = accent || 'from-blue-500 to-purple-600'

  return (
    <div className="p-6" data-tour-step="true">
      {/* Close + Slim progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Step {stepIndex + 1} of {totalSteps}
        </span>
        <button onClick={onSkipAll} className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 group" aria-label="Skip tour">
          <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
      <div className="mb-5">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3">{step.title}</h3>

      {/* Content with Markdown */}
      <div className="mb-6 text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-strong:text-slate-800 prose-li:my-0.5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.content}</ReactMarkdown>
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={onPrev} className="text-xs h-9 px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4 mr-1" />Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isLast && (
            <button onClick={onSkipAll} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Skip tour</button>
          )}
          {isLast ? (
            <Button size="sm" onClick={onEnd} className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl`}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />Get Started
            </Button>
          ) : (
            <Button size="sm" onClick={onNext} className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl`}>
              Next <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-300 mt-4 select-none">
        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-500">Enter</kbd> to continue · <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-500">Esc</kbd> to skip
      </p>
    </div>
  )
}
