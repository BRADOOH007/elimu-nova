'use client'

import { Star, Zap, Flame, Trophy, Sparkles, MessageSquare, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface LearningJourneyBannerProps {
  gameState: { xp: number; level: number; streak: number }
  levelName: string
  xpProgress: { progress: number }
  showXpGain: { amount: number; visible: boolean }
  mistakeCount: number
  onStartLearning: () => void
  onOpenDailyChallenge: () => void
  onOpenMistakes: () => void
  onOpenHope: () => void
}

export function LearningJourneyBanner({
  gameState, levelName, xpProgress, showXpGain, mistakeCount,
  onStartLearning, onOpenDailyChallenge, onOpenMistakes, onOpenHope,
}: LearningJourneyBannerProps) {
  const nextLevel = levelName === 'Beginner' ? 'Learner' : levelName === 'Learner' ? 'Scholar' : 'Master'

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 border border-white/10 shadow-2xl">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-1/4 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

      {/* Subtle dot grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/80">Learning Studio</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Learning Journey</h1>
            <p className="mt-1 text-sm text-slate-400">Study a topic, take a quiz, beat your streak</p>
          </div>

          {/* Glass pill badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/20 transition">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              {gameState.streak}d streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />Lv.{gameState.level}
            </span>
            {mistakeCount > 0 && (
              <button onClick={onOpenMistakes} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-red-300 hover:border-red-500/40 transition">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />{mistakeCount} to review
              </button>
            )}
            <button onClick={onOpenHope}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-violet-400/30 hover:text-violet-200 transition">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />Ask Hope
            </button>
          </div>
        </div>

        {/* Progress Card Inlay */}
        <div className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{levelName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {gameState.xp} XP
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Next Level</p>
              <p className="text-sm font-bold text-slate-300">{nextLevel}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-700"
              style={{ width: `${xpProgress.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button onClick={onStartLearning}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition shadow-sm">
              <Sparkles className="h-4 w-4" />Start Learning
            </button>
            {!levelName.includes('Master') && (
              <p className="text-xs text-slate-500">Keep going to unlock more features</p>
            )}
          </div>
        </div>

        {/* XP Gain Toast */}
        {showXpGain.visible && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex animate-bounce items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/30">
              <Zap className="h-4 w-4" />+{showXpGain.amount} XP!
            </div>
          </div>
        )}
      </div>

      {/* Bottom edge fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  )
}
