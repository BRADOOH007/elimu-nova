'use client'

import { useEffect, useState } from 'react'
import { Logo } from '@/components/ui/logo'

type Role = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'PARENT'

interface RoleConfig {
  accent: string
  badge: string
  headline: string
  subline: string
  tips: string[]
  accentHex: string
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  STUDENT: {
    accent: 'from-blue-500 to-violet-500',
    badge: 'STUDENT',
    headline: 'Ready to learn?',
    subline: 'Your personalised AI lessons and assignments are loading.',
    tips: [
      'Your AI tutor picks up exactly where you left off',
      'Complete today\'s lesson to keep your streak going',
      'Ask the AI anything — it never gets tired of helping',
    ],
    accentHex: '#6d28d9',
  },
  TEACHER: {
    accent: 'from-indigo-500 to-blue-500',
    badge: 'TEACHER',
    headline: 'Your classroom is ready.',
    subline: 'Lesson plans, student progress and AI tools are being prepared.',
    tips: [
      'Generate a complete lesson plan in under 60 seconds',
      'Auto-mark assignments and save hours every week',
      'Student progress updates in real time',
    ],
    accentHex: '#3b82f6',
  },
  SCHOOL_ADMIN: {
    accent: 'from-purple-500 to-pink-500',
    badge: 'ADMIN',
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
    badge: 'SYSTEM',
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
    badge: 'PARENT',
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

function AnimatedElement({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className || ''}`}>
      {children}
    </div>
  )
}

function OrbitingRing({ color, size, duration, delay }: { color: string; size: number; duration: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        border: `1px solid ${color}15`,
        animation: `spin ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: color,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 6px ${color}, 0 0 12px ${color}40`,
        }}
      />
    </div>
  )
}

function FloatingParticle({ index, accentHex }: { index: number; accentHex: string }) {
  const x = 10 + (index * 23) % 80
  const delay = (index * 1.7) % 6
  const duration = 4 + (index % 3) * 2
  const size = 1.5 + (index % 3) * 0.5
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: '-4px',
        width: size,
        height: size,
        borderRadius: '50%',
        background: accentHex,
        opacity: 0.15,
        animation: `particle-rise ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}

export function DashboardSplash({ role, userName, visible }: Props) {
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [quoteVisible, setQuoteVisible] = useState(false)

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT
  const firstName = userName?.split(' ')[0] || 'there'

  useEffect(() => { setMounted(true) }, [])

  const [initialVisible] = useState(visible)

  useEffect(() => {
    const hard = setTimeout(() => setFadeOut(true), 5000)
    return () => clearTimeout(hard)
  }, [])

  useEffect(() => {
    if (!visible) return
    setProgress(0)
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(iv); return 95 }
        // Slower, smoother progression over the 5s window
        return Math.min(p + (p < 30 ? 2 : p < 60 ? 1.2 : p < 80 ? 0.6 : 0.3), 95)
      })
    }, 100)
    return () => clearInterval(iv)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const iv = setInterval(() => setTipIndex(i => (i + 1) % cfg.tips.length), 4000)
    return () => clearInterval(iv)
  }, [visible, cfg.tips.length])

  useEffect(() => {
    if (!visible || !mounted) return
    const t = setTimeout(() => setQuoteVisible(true), 2000)
    return () => clearTimeout(t)
  }, [visible, mounted])

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
        !visible || (!initialVisible && !mounted) ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1230 40%, #0a0e1f 100%)' }}
    >
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingParticle key={i} index={i} accentHex={cfg.accentHex} />
      ))}

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accentHex}18 0%, transparent 70%)`, transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accentHex}10 0%, transparent 70%)`, transform: 'translate(-30%,30%)' }} />

      {/* Orbiting decorative rings */}
      <OrbitingRing color={cfg.accentHex} size={320} duration={20} delay={0} />
      <OrbitingRing color={cfg.accentHex} size={240} duration={15} delay={2} />
      <OrbitingRing color={cfg.accentHex} size={160} duration={10} delay={4} />

      {/* Glass card container */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div
          className="rounded-2xl backdrop-blur-xl border p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: `0 0 40px ${cfg.accentHex}08`,
          }}
        >
          {/* Logo */}
          <AnimatedElement delay={100} className="mb-5">
            <div className="flex flex-col items-center gap-3">
              <Logo size="sm" variant="black" />
              <span
                className="text-[9px] font-bold tracking-[0.25em] px-2.5 py-0.5 rounded-full border"
                style={{
                  color: cfg.accentHex,
                  borderColor: `${cfg.accentHex}40`,
                  background: `${cfg.accentHex}10`,
                }}
              >
                {cfg.badge}
              </span>
            </div>
          </AnimatedElement>

          {/* Greeting */}
          <AnimatedElement delay={250} className="mb-1">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.25em]">
              Welcome back
            </p>
          </AnimatedElement>

          <AnimatedElement delay={350}>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              {firstName}
            </h1>
          </AnimatedElement>

          <AnimatedElement delay={450}>
            <p className="text-slate-400 text-xs leading-relaxed mb-7 max-w-xs mx-auto">
              {cfg.subline}
            </p>
          </AnimatedElement>

          {/* Loading bar */}
          <AnimatedElement delay={550} className="w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-600 font-medium tracking-wide">Loading your dashboard</span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${cfg.accentHex}, ${cfg.accentHex}dd)`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                    animation: 'shimmer-slide 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </AnimatedElement>

          {/* Tip */}
          <AnimatedElement delay={650}>
            <div className="flex items-start gap-2.5 text-slate-500 text-[10px] max-w-xs mx-auto leading-relaxed min-h-[30px]">
              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: cfg.accentHex }} />
              <span className="transition-all duration-500 text-center">{cfg.tips[tipIndex]}</span>
            </div>
          </AnimatedElement>

          {/* Inspirational quote — fades in at 2s */}
          <AnimatedElement delay={2000}>
            {quoteVisible && (
              <p
                className="text-[9px] italic leading-relaxed mt-4 pt-4 border-t"
                style={{
                  color: `${cfg.accentHex}99`,
                  borderColor: `${cfg.accentHex}15`,
                }}
              >
                "Empowering the next generation of African innovators through AI."
              </p>
            )}
          </AnimatedElement>
        </div>
      </div>

      <div className="absolute bottom-5 left-0 right-0 text-center text-slate-700 text-[9px] tracking-[0.15em] font-medium">
        ELIMUNOVA AI &nbsp;·&nbsp; Kenya&apos;s Smart Learning Platform
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes particle-rise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          20%  { opacity: 0.2; }
          80%  { opacity: 0.1; }
          100% { transform: translateY(-600px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
