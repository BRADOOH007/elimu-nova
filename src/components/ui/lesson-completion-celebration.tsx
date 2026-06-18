'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, Zap, ArrowRight } from 'lucide-react'

interface Props {
  show:         boolean
  lessonTitle?: string
  xpEarned?:   number
  onClose?:    () => void
  onNext?:     () => void
}

export function LessonCompletionCelebration({ show, lessonTitle, xpEarned = 50, onClose, onNext }: Props) {
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; delay: number }[]>([])

  useEffect(() => {
    if (!show) return
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      x:     Math.random() * 100,
      y:     Math.random() * 60,
      color: colors[i % colors.length],
      delay: Math.random() * 0.8,
    })))
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center p-4">
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left:            `${p.x}%`,
              top:             `-20px`,
              backgroundColor: p.color,
              animation:       `confettiFall 2s ease-in ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 opacity-60" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Lesson Complete!</h2>
          {lessonTitle && <p className="text-slate-500 text-sm mb-4">{lessonTitle}</p>}

          {/* XP badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm mb-5 shadow-md">
            <Zap className="h-4 w-4" /> +{xpEarned} XP earned
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-6 w-6 fill-yellow-400 text-yellow-400"
                style={{ animation: `starPop 0.3s ease-out ${i * 0.1}s both` }}
              />
            ))}
          </div>

          <p className="text-slate-500 text-sm mb-6">
            Amazing work! Keep going to maintain your learning streak. 🔥
          </p>

          <div className="flex gap-3">
            {onClose && (
              <button onClick={onClose}
                className="flex-1 h-11 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Back to Dashboard
              </button>
            )}
            {onNext && (
              <button onClick={onNext}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                Next Lesson <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes starPop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
