'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Users,
  Brain,
  Zap,
} from 'lucide-react'

type Role = 'STUDENT' | 'TEACHER' | 'PARENT'

const ROLE_TABS: { id: Role; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'STUDENT', label: 'Student', icon: GraduationCap },
  { id: 'TEACHER', label: 'Teacher', icon: Brain },
  { id: 'PARENT',  label: 'Parent',  icon: Users },
]

const FEATURES = [
  'Personalised AI tutoring 24/7',
  'Multi-curriculum support',
  'Real-time progress insights',
]

export default function SignInPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState('')
  const [activeRole, setActiveRole]     = useState<Role>('STUDENT')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const session = await getSession()

        if (session?.user?.role) {
          const dashboardRoutes: Record<string, string> = {
            SUPER_ADMIN:  '/super-admin/dashboard',
            SCHOOL_ADMIN: '/school-admin/dashboard',
            TEACHER:      '/teacher/dashboard',
            STUDENT:      '/student/dashboard',
            PARENT:       '/parent/dashboard',
          }
          router.push(dashboardRoutes[session.user.role] || '/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a] p-10 relative overflow-hidden">
        {/* grid texture — same as landing hero */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* glow orbs — same as landing hero */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-14">
            <Logo size="xl" variant="white" />
            <div className="mt-4 h-px w-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            AI-Powered Cloud School Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Welcome back to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Elimu Nova.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Your AI-powered school platform. Learn, teach, and manage — all in one place.
          </p>

          {/* Feature list */}
          <ul className="space-y-3 mb-12">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <blockquote className="text-slate-300 text-sm italic leading-relaxed mb-3">
            "Elimu Nova helped my students improve grades within one term."
          </blockquote>
          <div className="text-slate-500 text-xs">
            — Sarah M., Teacher · Hopewell STEM Academy
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <span className="text-sm text-gray-500">
            New user?{' '}
            <Link href="/auth/signup" className="text-purple-600 font-semibold hover:text-purple-700">
              Create account
            </Link>
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-8">Choose your role to continue.</p>

            {/* Role tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8">
              {ROLE_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveRole(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeRole === id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or Username
                </label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  autoComplete="username"
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Access Learning Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Footer hint */}
            <p className="text-center text-xs text-gray-400 mt-5">
              Your account is created by your school. Contact your teacher if you need help.
            </p>
            <p className="text-center text-sm mt-3">
              School or system admin?{' '}
              <Link href="/auth/admin-signin" className="text-purple-600 font-semibold hover:text-purple-700">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
