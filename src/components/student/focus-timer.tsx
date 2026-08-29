'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Pause, Play, RotateCcw, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FocusTimerProps {
  onComplete?: (minutes: number) => void
  defaultMinutes?: number
}

export function FocusTimer({ onComplete, defaultMinutes = 15 }: FocusTimerProps) {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && running) {
      if (mode === 'focus') {
        onComplete?.(defaultMinutes)
        setMode('break')
        setTimeLeft(5 * 60)
      } else {
        setRunning(false)
        setMode('focus')
        setTimeLeft(defaultMinutes * 60)
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, timeLeft, mode, defaultMinutes])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const reset = () => { setRunning(false); setMode('focus'); setTimeLeft(defaultMinutes * 60) }

  const progress = mode === 'focus' ? ((defaultMinutes * 60 - timeLeft) / (defaultMinutes * 60)) * 100 : ((5 * 60 - timeLeft) / (5 * 60)) * 100

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {mode === 'focus' ? <Timer className="h-4 w-4 text-blue-600" /> : <Coffee className="h-4 w-4 text-green-600" />}
          <span className="text-sm font-semibold text-slate-700">{mode === 'focus' ? 'Focus Mode' : 'Break Time'}</span>
        </div>
        <span className="text-xs text-slate-400">{mode === 'focus' ? `${defaultMinutes} min` : '5 min'}</span>
      </div>
      <div className="mb-2 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${mode === 'focus' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="text-3xl font-bold text-slate-800 text-center my-2 font-mono">{fmt(timeLeft)}</p>
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="outline" onClick={() => setRunning(!running)} className="text-xs">
          {running ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset</Button>
      </div>
    </div>
  )
}
