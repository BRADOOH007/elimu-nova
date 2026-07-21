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

      {/* Decorative orbital rings */}
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: 280, height: 280, left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(124,58,237,0.08)',
          animation: 'spin 25s linear infinite',
        }}
      >
        <div className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: '#7c3aed', top: 0, left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 6px #7c3aed' }} />
      </div>
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: 200, height: 200, left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(37,99,235,0.08)',
          animation: 'spin 18s linear infinite reverse',
        }}
      >
        <div className="absolute w-1 h-1 rounded-full"
          style={{ background: '#2563eb', top: '50%', right: 0, transform: 'translate(50%, -50%)', boxShadow: '0 0 6px #2563eb' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div
          className="rounded-2xl backdrop-blur-xl border p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="mb-7 flex flex-col items-center gap-4">
            {/* Logo mark with glow ring */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', transform: 'scale(1.2)' }}
              />
              <div
                className="relative w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                <img
                  src="/logo-black-removebg-preview.png"
                  alt="ElimuNova"
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                ElimuNova <span style={{
                  background: 'linear-gradient(90deg,#7c3aed,#2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>AI</span>
              </h1>
              <p className="text-slate-500 text-[10px] mt-0.5 tracking-widest font-medium uppercase">
                Kenya&apos;s Smart Learning Platform
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full mb-4">
            <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#7c3aed,#2563eb)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer-slide 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <p className="text-slate-500 text-[11px] min-h-[1.25rem] transition-all duration-300">
            {STEPS[stepIndex]}{'.'.repeat(dots)}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-7">
            {['CBC Curriculum', 'AI Tutoring', 'Smart Exams', 'Live Classes'].map((f, i) => (
              <span
                key={f}
                className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-all duration-500"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b',
                  animation: `pulse-fade 3s ease-in-out ${i * 0.4}s infinite`,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
