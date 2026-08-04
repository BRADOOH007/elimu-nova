'use client'

import { useEffect, useState } from 'react'

type Role = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'PARENT'

interface RoleConfig {
  accent: string
  badge: string
  subline: string
  tips: string[]
  accentHex: string
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  STUDENT: {
    accent: 'from-blue-500 to-violet-500',
    badge: 'STUDENT PORTAL',
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
    subline: 'Teachers, students, timetables and analytics are coming online.',
    tips: [
      'AI timetable generation is one click away',
      'Real-time stats update across all classes',
    ],
    accentHex: '#a855f7',
  },
  SUPER_ADMIN: {
    accent: 'from-slate-500 to-blue-600',
    badge: 'SYSTEM ADMIN',
    subline: 'Schools, users, billing and system health are being fetched.',
    tips: [
      'Monitor all schools from a single command centre',
      'Manage subscriptions and packages in one place',
    ],
    accentHex: '#64748b',
  },
  PARENT: {
    accent: 'from-rose-500 to-pink-500',
    badge: 'PARENT PORTAL',
    subline: 'Progress reports, assignments and school alerts are loading.',
    tips: [
      'AI flags learning struggles before they appear on reports',
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
  // gone = completely removed from DOM (no z-index, no pointer-events)
  const [gone, setGone] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const cfg       = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT
  const firstName = userName?.split(' ')[0] || 'there'

  // Progress animation
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(iv); return 95 }
        return Math.min(p + (p < 50 ? 5 : p < 80 ? 2.5 : 0.8), 95)
      })
    }, 100)
    return () => clearInterval(iv)
  }, [])

  // Tip rotation
  useEffect(() => {
    const iv = setInterval(() => setTipIndex(i => (i + 1) % cfg.tips.length), 3000)
    return () => clearInterval(iv)
  }, [cfg.tips.length])

  // Dismiss when visible → false, user clicks, OR after hard 3s timeout
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout
    let removeTimer: NodeJS.Timeout

    const dismiss = () => {
      setProgress(100)
      setOpacity(0)
      // Remove from DOM after fade completes
      removeTimer = setTimeout(() => setGone(true), 600)
    }

    if (!visible || dismissed) {
      fadeTimer = setTimeout(dismiss, 100)
    }

    // Hard safety: always dismiss within 3 seconds regardless
    const hardTimer = setTimeout(dismiss, 2000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
      clearTimeout(hardTimer)
    }
  }, [visible, dismissed])

  // Once gone, keep a hidden sentinel so TourLauncher can detect dismissal
  if (gone) return <div id="dashboard-splash" data-gone="true" style={{display:'none'}} />

  const handleDismiss = () => {
    if (!dismissed) setDismissed(true)
  }

  return (
    <div
      id="dashboard-splash"
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        opacity,
        // CRITICAL: once fading out, disable ALL pointer events immediately
        pointerEvents: opacity < 1 ? 'none' : 'auto',
        transition: 'opacity 0.5s ease-out',
        background: 'linear-gradient(135deg, #060918 0%, #0d1230 40%, #0a0e1f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 600, height: 600,
        borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${cfg.accentHex}18 0%, transparent 70%)`,
        transform: 'translate(30%,-30%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 2rem', maxWidth: 480, width: '100%' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <img
            src="/logo-black-removebg-preview.png"
            alt="ElimuNova"
            style={{ height: 56, width: 'auto', objectFit: 'contain', margin: '0 auto', display: 'block' }}
          />
          <span style={{
            display: 'inline-block', marginTop: 12, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.25em', padding: '4px 12px', borderRadius: 999,
            color: cfg.accentHex, border: `1px solid ${cfg.accentHex}50`, background: `${cfg.accentHex}12`,
          }}>
            {cfg.badge}
          </span>
        </div>

        {/* Greeting */}
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Welcome back
        </p>
        <h1 style={{ color: '#fff', fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 16, letterSpacing: -1 }}>
          {firstName}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 40, maxWidth: 360, margin: '0 auto 40px' }}>
          {cfg.subline}
        </p>

        {/* Progress */}
        <div style={{ maxWidth: 280, margin: '0 auto 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Loading your dashboard</span>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: `linear-gradient(90deg, ${cfg.accentHex}, #818cf8)`,
              width: `${progress}%`, transition: 'width 0.15s ease-out',
            }} />
          </div>
        </div>

        {/* Tip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', maxWidth: 300, margin: '0 auto' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.accentHex, flexShrink: 0 }} />
          <span style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{cfg.tips[tipIndex]}</span>
        </div>
      </div>

      {/* Bottom watermark */}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#475569', fontSize: 11, letterSpacing: 1, fontWeight: 500 }}>
        Click anywhere to skip · ElimuNova AI
      </div>
    </div>
  )
}
