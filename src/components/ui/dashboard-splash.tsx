'use client'

import { useEffect, useState } from 'react'

type Role = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'PARENT'

interface RoleConfig {
  accent: string        // tailwind gradient classes for the progress bar
  badge: string         // small role badge
  headline: string
  subline: string
  tips: string[]
  accentHex: string     // used for glow
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  STUDENT: {
    accent: 'from-blue-500 to-violet-500',
    badge: 'STUDENT PORTAL',
    headline: 'Ready to learn?',
    subline: 'Your personalised AI lessons, quizzes and assignments are loading.',
    tips: [
      'Your AI tutor picks up exactly where you left off',
      'Complete today\'s lesson to keep your streak going',
      'Ask the AI anything — it never gets tired of helping',
    ],
    accentHex: '#6d28d9',
  },
  TEACHER: {
    accent: 'from-indigo-500 to-blue-500',
    badge: 'TEACHER PORTAL',
    headline: 'Your classroom is ready.',
    subline: 'Lesson plans, student progress and AI tools are being prepared for you.',
    tips: [
      'Generate a complete lesson plan in under 60 seconds',
      'Auto-mark assignments and save hours every week',
      'Student progress updates in real time',
    ],
    accentHex: '#3b82f6',
  },
  SCHOOL_ADMIN: {
    accent: 'from-purple-500 to-pink-500',
    badge: 'ADMIN PORTAL',
    headline: 'School overview loading.',
    subline: 'Teachers, students, timetables and analytics are coming online.',
    tips: [
      'AI timetable generation is one click away',
      'Real-time stats update across all classes',
      'Smart teacher allocation keeps workloads balanced',
    ],
    accentHex: '#a855f7',
  },
  SUPER_ADMIN: {
    accent: 'from-slate-500 to-blue-600',
    badge: 'SYSTEM ADMIN',
    headline: 'Platform dashboard loading.',
    subline: 'Schools, users, billing and system health are being fetched.',
    tips: [
      'Monitor all schools from a single command centre',
      'Manage subscriptions and packages in one place',
      'Security logs and health metrics at a glance',
    ],
    accentHex: '#64748b',
  },
  PARENT: {
    accent: 'from-rose-500 to-pink-500',
    badge: 'PARENT PORTAL',
    headline: 'Checking on your children.',
    subline: 'Progress reports, assignments and school alerts are loading.',
    tips: [
      'AI flags learning struggles before they appear on reports',
      'See exactly what your child is studying today',
      'Message teachers directly from your dashboard',
    ],
    accentHex: '#f43f5e',
  },
}

interface Props {
  role: Role
  userName: string
  visible: boolean
}

export function DashboardSplash({ role, userName, visible }: Props) {
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [fadeOut, setFadeOut]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  const cfg       = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT
  const firstName = userName?.split(' ')[0] || 'there'

  useEffect(() => { setMounted(true) }, [])

  // Hard safety timeout — if visible never goes false, dismiss after 5s
  useEffect(() => {
    const hard = setTimeout(() => setFadeOut(true), 5000)
    return () => clearTimeout(hard)
  }, [])

  // Progress animation
  useEffect(() => {
    if (!visible) return
    setProgress(0)
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(iv); return 95 }
        return Math.min(p + (p < 50 ? 5 : p < 80 ? 2.5 : 0.8), 95)
      })
    }, 100)
    return () => clearInterval(iv)
  }, [visible])

  // Tip rotation
  useEffect(() => {
    if (!visible) return
    const iv = setInterval(() => setTipIndex(i => (i + 1) % cfg.tips.length), 3000)
    return () => clearInterval(iv)
  }, [visible, cfg.tips.length])

  // Dismiss
  useEffect(() => {
    if (!visible && mounted) {
      setProgress(100)
      const t = setTimeout(() => setFadeOut(true), 400)
      return () => clearTimeout(t)
    }
  }, [visible, mounted])

  if (fadeOut) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        !visible && mounted ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1230 40%, #0a0e1f 100%)' }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      {/* Ambient glow — top right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accentHex}18 0%, transparent 70%)`, transform: 'translate(30%,-30%)' }} />
      {/* Ambient glow — bottom left */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accentHex}10 0%, transparent 70%)`, transform: 'translate(-30%,30%)' }} />

      {/* ── MAIN CARD ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto px-8 py-10 text-center">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo-black-removebg-preview.png"
            alt="ElimuNova"
            className="h-14 w-auto object-contain"
          />
          <span
            className="text-[10px] font-bold tracking-[0.25em] px-3 py-1 rounded-full border"
            style={{
              color: cfg.accentHex,
              borderColor: `${cfg.accentHex}50`,
              background: `${cfg.accentHex}12`,
            }}
          >
            {cfg.badge}
          </span>
        </div>

        {/* Greeting */}
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
          Welcome back
        </p>
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-none tracking-tight">
          {firstName}
        </h1>
        <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
          {cfg.subline}
        </p>

        {/* Progress */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-slate-600 font-medium">Loading your dashboard</span>
            <span className="text-xs font-mono text-slate-500">{Math.round(progress)}%</span>
          </div>
          {/* Track */}
          <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${cfg.accent} rounded-full transition-all duration-150 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-center gap-2.5 text-slate-500 text-xs max-w-xs">
          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: cfg.accentHex }} />
          <span className="transition-all duration-500 text-center leading-relaxed">{cfg.tips[tipIndex]}</span>
        </div>

      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-5 left-0 right-0 text-center text-slate-700 text-[11px] tracking-wider font-medium">
        ELIMUNOVA AI &nbsp;·&nbsp; Kenya's Smart Learning Platform
      </div>
    </div>
  )
}
