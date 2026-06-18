'use client'

import { useEffect, useState } from 'react'
import { Logo } from '@/components/ui/logo'
import {
  GraduationCap, Brain, Users, School, Heart,
  Sparkles, BookOpen, Target, TrendingUp, Shield,
  CheckCircle, Zap
} from 'lucide-react'

type Role = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'PARENT'

interface RoleConfig {
  icon: React.ComponentType<any>
  gradient: string
  headline: string
  subline: string
  tips: string[]
  accentColor: string
  particleColor: string
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  STUDENT: {
    icon: GraduationCap,
    gradient: 'from-blue-600 to-purple-600',
    headline: 'Ready to learn something amazing?',
    subline: 'Your AI tutor is warming up, lessons are loading, and your learning journey continues.',
    tips: [
      'Your AI tutor remembers where you left off',
      'Ask it anything — it never gets tired of helping',
      'Complete today\'s lesson to keep your streak alive',
    ],
    accentColor: 'text-blue-400',
    particleColor: 'bg-blue-500',
  },
  TEACHER: {
    icon: Brain,
    gradient: 'from-indigo-600 to-blue-600',
    headline: 'Your classroom is waiting.',
    subline: 'Hope AI is ready to help you plan lessons, generate assessments, and support every student.',
    tips: [
      'Generate a full lesson plan in under 60 seconds',
      'Auto-mark assignments and free up hours every week',
      'Your students\' progress updates in real time',
    ],
    accentColor: 'text-indigo-400',
    particleColor: 'bg-indigo-500',
  },
  SCHOOL_ADMIN: {
    icon: School,
    gradient: 'from-purple-600 to-pink-600',
    headline: 'Your school dashboard is loading.',
    subline: 'Teachers, students, timetables and analytics — everything you need to run a smarter school.',
    tips: [
      'AI timetable generation is one click away',
      'Real-time stats update across all classes',
      'Smart teacher allocation keeps workloads balanced',
    ],
    accentColor: 'text-purple-400',
    particleColor: 'bg-purple-500',
  },
  SUPER_ADMIN: {
    icon: Shield,
    gradient: 'from-slate-600 to-blue-700',
    headline: 'Platform overview loading.',
    subline: 'All schools, users, billing and system health — your command centre is coming online.',
    tips: [
      'Monitor school performance across the platform',
      'Manage subscriptions and packages in one place',
      'System health and security logs at a glance',
    ],
    accentColor: 'text-slate-400',
    particleColor: 'bg-blue-500',
  },
  PARENT: {
    icon: Heart,
    gradient: 'from-pink-600 to-purple-600',
    headline: 'Checking in on your children.',
    subline: 'AI early warnings, progress reports, assignments and schedules — all in one place for you.',
    tips: [
      'AI alerts you before struggles show up on report cards',
      'See exactly what your child is learning today',
      'Message teachers directly from your dashboard',
    ],
    accentColor: 'text-pink-400',
    particleColor: 'bg-pink-500',
  },
}

interface DashboardSplashProps {
  role: Role
  userName: string
  visible: boolean
}

export function DashboardSplash({ role, userName, visible }: DashboardSplashProps) {
  const [progress, setProgress]     = useState(0)
  const [tipIndex, setTipIndex]     = useState(0)
  const [fadeOut, setFadeOut]       = useState(false)
  const [mounted, setMounted]       = useState(false)

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT
  const Icon   = config.icon
  const firstName = userName?.split(' ')[0] || userName || 'there'

  // Mount animation
  useEffect(() => { setMounted(true) }, [])

  // Progress bar
  useEffect(() => {
    if (!visible) return
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(interval); return 95 }
        // Fast at start, slow near end
        const increment = p < 60 ? 8 : p < 80 ? 4 : 1
        return Math.min(p + increment, 95)
      })
    }, 120)
    return () => clearInterval(interval)
  }, [visible])

  // Cycle tips every 2.5s
  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % config.tips.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [visible, config.tips.length])

  // When parent says ready — complete progress and fade
  useEffect(() => {
    if (!visible && mounted) {
      setProgress(100)
      const t = setTimeout(() => setFadeOut(true), 300)
      return () => clearTimeout(t)
    }
  }, [visible, mounted])

  if (fadeOut) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        !visible && mounted ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full ${config.particleColor} opacity-40`}
          style={{
            left:      `${15 + i * 14}%`,
            top:       `${20 + (i % 3) * 25}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">

        {/* Logo */}
        <div className="mb-10">
          <Logo size="xl" variant="white" />
          <div className="mt-3 h-px w-12 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
        </div>

        {/* Role icon */}
        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 shadow-2xl`}
          style={{ boxShadow: `0 0 40px rgba(99,102,241,0.3)` }}
        >
          <Icon className="h-10 w-10 text-white" />
        </div>

        {/* Greeting */}
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-2">
          Welcome back
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
          {firstName}
        </h1>
        <h2 className={`text-xl font-bold ${config.accentColor} mb-3`}>
          {config.headline}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm">
          {config.subline}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Loading your dashboard</span>
            <span className="text-xs text-slate-400 font-mono">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rotating tips */}
        <div className="h-12 flex items-center justify-center">
          <div className="flex items-start gap-2 max-w-xs">
            <Sparkles className={`h-4 w-4 ${config.accentColor} shrink-0 mt-0.5`} />
            <p className="text-slate-300 text-xs leading-relaxed transition-all duration-500">
              {config.tips[tipIndex]}
            </p>
          </div>
        </div>

      </div>

      {/* Bottom brand tag */}
      <div className="absolute bottom-6 text-slate-600 text-xs">
        ElimuNova AI · Powered by intelligence
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
