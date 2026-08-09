"use client"

import { Badge } from '@/components/ui/badge'
import { Flame, Zap, Star, Sparkles, MessageSquare, AlertCircle, Trophy, ArrowUp } from 'lucide-react'

interface LearningJourneyBannerProps {
  gameState: { streak: number; level: number; xp: number }
  levelName: string
  xpProgress: { progress: number }
  showXpGain: { amount: number; visible: boolean }
  mistakeCount: number
  onOpenMistakes: () => void
  onAskHope: () => void
  getLevelName: (level: number) => string
}

export function LearningJourneyBanner({
  gameState, levelName, xpProgress, showXpGain,
  mistakeCount, onOpenMistakes, onAskHope, getLevelName,
}: LearningJourneyBannerProps) {
  return (
    <header className="relative overflow-hidden bg-slate-950 text-white">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-fuchsia-500/10 blur-[80px]" />
        <div className="absolute -bottom-40 -left-20 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-cyan-500/15 via-emerald-500/10 to-teal-500/10 blur-[80px]" />
        <div className="absolute left-1/2 top-1/4 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-400/10 blur-[60px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-300/80">Learning Studio</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">Your Learning Journey</h1>
            <p className="text-sm text-slate-300/80">Study a topic, take a quiz, beat your streak</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-white backdrop-blur-sm transition-all hover:bg-amber-400/15">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold">{gameState.streak}d streak</span>
            </Badge>
            <Badge className="gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-white backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold">Lv.{gameState.level}</span>
            </Badge>
            {mistakeCount > 0 && (
              <button onClick={onOpenMistakes}
                className="group flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 backdrop-blur-sm transition-all hover:bg-red-500/30 hover:text-white">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                {mistakeCount}
              </button>
            )}
            <button onClick={onAskHope}
              className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:shadow-lg hover:shadow-indigo-500/25">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 group-hover:text-violet-300" />
              Ask Hope
            </button>
          </div>
        </div>

        {/* Progress Card Inlay */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-white/5 p-4 backdrop-blur-xl sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-white">{levelName}</p>
                <p className="text-[11px] text-slate-400">{gameState.xp} XP</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400">Next: {getLevelName(gameState.level + 1)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-700 ease-out"
              style={{ width: `${xpProgress.progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-500">
            <span>{levelName}</span>
            <span>{xpProgress.progress}%</span>
          </div>
        </div>

        {/* XP Gain Toast */}
        {showXpGain.visible && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex animate-bounce items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/25">
              <ArrowUp className="h-4 w-4" />+{showXpGain.amount} XP
            </div>
          </div>
        )}
      </div>

      {/* Bottom edge fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
    </header>
  )
}
