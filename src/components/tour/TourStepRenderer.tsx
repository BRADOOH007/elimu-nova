'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

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

function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 mb-3 last:mb-0">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      continue
    }
    if (trimmed.startsWith('- ')) {
      inList = true
      listItems.push(trimmed.slice(2))
    } else if (trimmed.startsWith('• ')) {
      inList = true
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h4 key={`h-${elements.length}`} className="text-sm font-semibold text-slate-800 mb-1.5 mt-3 first:mt-0">
            {trimmed.slice(3)}
          </h4>
        )
      } else {
        elements.push(
          <p key={`p-${elements.length}`} className="text-sm text-slate-600 leading-relaxed mb-3 last:mb-0">
            {trimmed}
          </p>
        )
      }
    }
  }
  flushList()

  return elements
}

export function TourStepRenderer({ step, stepIndex, totalSteps, accent, onNext, onPrev, onEnd, onSkipAll, onGoToStep }: Props) {
  const progress = ((stepIndex + 1) / totalSteps) * 100
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const grad = accent || 'from-blue-500 to-purple-600'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] font-medium text-slate-400">{Math.round(progress)}%</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{step.title}</h3>
        </div>
        <button
          onClick={onSkipAll}
          className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 -mr-1 -mt-1 group"
          aria-label="Skip tour"
          title="Skip tour"
        >
          <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
        {renderContent(step.content)}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step dots — clickable */}
      <div className="flex justify-center gap-1.5 mb-5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            onClick={() => onGoToStep?.(i)}
            disabled={i > stepIndex}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex
                ? `bg-gradient-to-r ${grad} w-6 h-1.5 shadow-sm`
                : i < stepIndex
                ? 'bg-slate-300 w-1.5 h-1.5 hover:bg-slate-400 cursor-pointer'
                : 'bg-slate-200 w-1.5 h-1.5 cursor-not-allowed opacity-50'
            }`}
            title={i < stepIndex ? `Go back to step ${i + 1}` : i === stepIndex ? `Current step` : `Step ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            className="text-xs h-9 px-4 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
          {!isLast && (
            <button
              onClick={onSkipAll}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
            >
              Skip tour
            </button>
          )}
        </div>

        {isLast ? (
          <Button
            size="sm"
            onClick={onEnd}
            className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Get Started
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onNext}
            className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            Continue
            <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-slate-300 mt-3">
        Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Enter</kbd> to continue · <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Esc</kbd> to skip
      </p>
    </div>
  )
}
