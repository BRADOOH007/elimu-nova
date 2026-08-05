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
        <ul key={`list-${elements.length}`} className="space-y-2 mb-4 last:mb-0">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 shrink-0" />
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
    if (!trimmed) { flushList(); continue }
    if (trimmed.startsWith('- ') || trimmed.startsWith('\u2022 ')) {
      inList = true
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h4 key={`h-${elements.length}`} className="text-sm font-bold text-slate-800 mb-2 mt-4 first:mt-0">
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
    <div className="p-6" data-tour-step="true">
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span className="text-[11px] text-slate-300">&middot;</span>
            <span className="text-[11px] font-medium text-slate-400">{Math.round(progress)}% complete</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug">{step.title}</h3>
        </div>
        <button
          onClick={onSkipAll}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 group"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>

      <div className="mb-6 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
        {renderContent(step.content)}
      </div>

      <div className="mb-5">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            onClick={() => onGoToStep?.(i)}
            disabled={i > stepIndex}
            title={i <= stepIndex ? `Go to step ${i + 1}` : ''}
            className={`rounded-full transition-all duration-300 ${
              i === stepIndex
                ? `bg-gradient-to-r ${grad} w-8 h-2 shadow-sm`
                : i < stepIndex
                ? 'bg-slate-300 w-2 h-2 hover:bg-slate-400 cursor-pointer'
                : 'bg-slate-200 w-2 h-2 cursor-not-allowed opacity-40'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {!isFirst && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              className="text-xs h-9 px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLast && (
            <button
              onClick={onSkipAll}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip tour
            </button>
          )}
          {isLast ? (
            <Button
              size="sm"
              onClick={onEnd}
              className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Get Started
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onNext}
              className={`h-9 px-5 text-xs font-semibold bg-gradient-to-r ${grad} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl`}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-300 mt-4 select-none">
        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-500">Enter</kbd> to continue &middot; <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-500">Esc</kbd> to skip
      </p>
    </div>
  )
}
