'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, ArrowRight, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getGameState, getLevelName, getXpToNextLevel } from '@/lib/gamification'
import { getUnreviewedMistakes } from '@/lib/mistake-bank'

interface AIStudyBuddyProps {
  studentName?: string
  currentSubject?: string
  currentTopic?: string
  onStartStudy?: (subject: string, topic: string) => void
}

const GREETINGS = [
  "Ready to level up today?",
  "Your brain is a muscle — let's flex it!",
  "Small steps every day = big results!",
  "Every master was once a beginner!",
  "Knowledge is power — let's gain some!",
]

export function AIStudyBuddy({ studentName, currentSubject, currentTopic, onStartStudy }: AIStudyBuddyProps) {
  const [minimized, setMinimized] = useState(false)
  const [greeting] = useState(GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const [tip, setTip] = useState('')

  const game = getGameState()
  const level = getLevelName(game.level)
  const xp = getXpToNextLevel(game.xp)
  const mistakes = getUnreviewedMistakes()
  const name = studentName?.split(' ')[0] || 'Champ'

  useEffect(() => {
    const tips = [
      `${name}, try the Active Recall method — test yourself before checking answers!`,
      `${name}, review a topic you studied yesterday for better memory!`,
      `${name}, take a short break after 25 minutes of focused study.`,
    ]
    setTip(tips[Math.floor(Math.random() * tips.length)])
  }, [name])

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30">
        <Brain className="h-6 w-6 text-white" />
      </button>
    )
  }

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-lg">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-900">Hey {name}! 👋</p>
              <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
            </div>
            <p className="text-xs text-indigo-600 mt-0.5">{greeting}</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-white rounded-xl p-3 border border-indigo-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">{level}</span>
            </div>
            <span className="text-xs font-bold text-indigo-600">{game.xp} XP</span>
          </div>
          <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all" style={{ width: `${xp.progress}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{xp.needed - xp.current} XP to next level</p>
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          {mistakes.length > 0 && (
            <p className="text-xs text-amber-700 font-medium">📋 You have {mistakes.length} mistakes to review</p>
          )}
          {currentTopic && (
            <Button size="sm" onClick={() => onStartStudy?.(currentSubject || '', currentTopic)} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs">
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />Continue: {currentTopic}
            </Button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 italic">💡 {tip}</p>
      </CardContent>
    </Card>
  )
}
