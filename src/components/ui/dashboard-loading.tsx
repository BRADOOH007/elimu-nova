'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  'Verifying your session…',
  'Loading curriculum data…',
  'Connecting AI services…',
  'Preparing your workspace…',
  'Almost there…',
]

export function DashboardLoading() {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState(1)

  // Smooth progress to 90
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(iv); return 90 }
        return Math.min(p + (p < 40 ? 3 : p < 70 ? 1.5 : 0.5), 90)
      })
    }, 80)
    return () => clearInterval(iv)
  }, [])

  // Rotate steps every 1.8s
  useEffect(() => {
    const iv = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(iv)
  }, [])

  // Animated dots
  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d % 3) + 1), 450)
    return () => clearInterval(iv)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1230 40%, #0a0e1f 100%)' }}
    >
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed18 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563eb12 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-8 text-center">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          {/* Logo mark with glow ring */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-60"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', transform: 'scale(1.2)' }}
            />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
            >
              <img
                src="/logo-white-removebg-preview.png"
                alt="ElimuNova"
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ElimuNova <span style={{
                background: 'linear-gradient(90deg,#7c3aed,#2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>AI</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 tracking-widest font-medium uppercase">
              Kenya's Smart Learning Platform
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full mb-5">
          <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg,#7c3aed,#2563eb,#7c3aed)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Step indicator */}
        <p className="text-slate-500 text-xs min-h-[1.25rem] transition-all duration-300">
          {STEPS[stepIndex]}{'.'.repeat(dots)}
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          {['CBC Curriculum', 'AI Tutoring', 'Smart Exams', 'Live Classes'].map(f => (
            <span
              key={f}
              className="text-[11px] px-3 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b',
              }}
            >
              {f}
            </span>
          ))}
        </div>
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
