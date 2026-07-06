'use client'

import { useEffect, useState } from 'react'

const TIPS = [
  'Preparing your personalised learning environment…',
  'Loading CBC curriculum data…',
  'Connecting to AI tutors…',
  'Syncing your latest progress…',
  'Almost ready — setting up your dashboard…',
]

export function DashboardLoading() {
  const [progress, setProgress]   = useState(0)
  const [tipIndex, setTipIndex]   = useState(0)
  const [dotCount, setDotCount]   = useState(1)

  // Progress bar fills over ~8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(interval); return 95 }
        // Fast start, slow finish
        const step = p < 40 ? 4 : p < 70 ? 2 : 0.8
        return Math.min(95, p + step)
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  // Rotate tips every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(d => (d % 3) + 1)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 px-8 text-center max-w-sm w-full">

        {/* Logo with pulse ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', animationDuration: '2s' }} />
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <img
              src="/logo-black-removebg-preview.png"
              alt="ElimuNova"
              className="w-16 h-16 object-contain"
              style={{ filter: 'invert(1) brightness(2)' }}
              onError={e => {
                // Fallback: show text logo if image fails
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {/* Text fallback shown by CSS if img fails */}
            <span className="text-white font-black text-2xl hidden">E</span>
          </div>
        </div>

        {/* Brand name */}
        <div>
          <h1 className="text-white font-black text-3xl tracking-tight"
            style={{ textShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
            ElimuNova <span style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kenya's Smart Learning Platform</p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #2563eb, #7c3aed)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>
          <p className="text-slate-400 text-xs min-h-[1.2em] transition-all duration-500">
            {TIPS[tipIndex]}{'.'.repeat(dotCount)}
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['CBC Curriculum','AI Tutoring','Smart Exams','Live Classes'].map(f => (
            <span key={f}
              className="text-xs px-3 py-1 rounded-full border border-white/10 text-slate-400 bg-white/5">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-600 text-xs">Powered by ElimuNova AI · Kenya</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
