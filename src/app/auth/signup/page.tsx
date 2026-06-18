'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Eye, EyeOff, Loader2, User, Mail, Lock, Building,
  ArrowLeft, CheckCircle2, GraduationCap, Users, Brain,
  Zap, UserPlus, Heart,
} from 'lucide-react'

const FEATURES = [
  'Personalised AI tutoring 24/7',
  'Multi-curriculum support',
  'Real-time progress insights',
]

const ROLE_PERKS: Record<string, string[]> = {
  STUDENT:      ['AI-powered personal tutor', 'Track your own progress', 'Curriculum-aligned courses'],
  TEACHER:      ['Generate lesson plans in seconds', 'Auto-mark assignments', 'Monitor student performance'],
  SCHOOL_ADMIN: ['Full school dashboard', 'Manage teachers & students', 'Analytics & billing in one place'],
  PARENT:       ['Follow your child\'s progress daily', 'Get AI-powered alerts on performance', 'Stay connected without needing a school invite'],
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'PARENT',
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
  })
  const [showPassword, setShowPassword]             = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading]                   = useState(false)
  const [error, setError]                           = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?message=Account created successfully. Please sign in.')
      } else {
        setError(data.error || 'An error occurred during registration')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const perks = ROLE_PERKS[formData.role] ?? FEATURES

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a] p-10 relative overflow-hidden">
        {/* grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* glow orbs */}
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
            Start your journey with{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Elimu Nova.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Join thousands of students, teachers and schools already using AI to transform learning.
          </p>

          {/* Dynamic perks based on selected role */}
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              {formData.role === 'STUDENT' ? 'For Students' : formData.role === 'TEACHER' ? 'For Teachers' : formData.role === 'PARENT' ? 'For Parents' : 'For Schools'}
            </p>
            <ul className="space-y-3">
              {perks.map(p => (
                <li key={p} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <blockquote className="text-slate-300 text-sm italic leading-relaxed mb-3">
            "Setting up our school on Elimu Nova took less than a day. Our teachers love it."
          </blockquote>
          <div className="text-slate-500 text-xs">
            — James O., Principal · Greenfields Academy
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
          <span className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-purple-600 font-semibold hover:text-purple-700">
              Sign in
            </Link>
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start justify-center px-8 py-10">
          <div className="w-full max-w-lg">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Create account</h2>
            <p className="text-gray-500 text-sm mb-8">Fill in your details to get started.</p>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName" name="firstName" type="text"
                      value={formData.firstName} onChange={handleInputChange}
                      placeholder="First name" required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName" name="lastName" type="text"
                      value={formData.lastName} onChange={handleInputChange}
                      placeholder="Last name" required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email" name="email" type="email"
                    value={formData.email} onChange={handleInputChange}
                    placeholder="email@example.com" required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white pl-9"
                  />
                </div>
              </div>

              {/* Account type — styled tabs like signin role tabs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {([
                    { value: 'STUDENT',      label: 'Student',  icon: GraduationCap },
                    { value: 'TEACHER',      label: 'Teacher',  icon: Brain         },
                    { value: 'SCHOOL_ADMIN', label: 'School',   icon: Users         },
                    { value: 'PARENT',       label: 'Parent',   icon: Heart         },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: value }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.role === value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* School info — shown only for SCHOOL_ADMIN */}
              {formData.role === 'SCHOOL_ADMIN' && (
                <div className="space-y-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm font-semibold text-indigo-900">School Information</p>
                  <div>
                    <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      School Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="schoolName" name="schoolName" type="text"
                        value={formData.schoolName} onChange={handleInputChange}
                        placeholder="Enter school name" required
                        className="h-11 bg-white border-gray-200 pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                      School Address
                    </label>
                    <Input
                      id="schoolAddress" name="schoolAddress" type="text"
                      value={formData.schoolAddress} onChange={handleInputChange}
                      placeholder="Enter school address" required
                      className="h-11 bg-white border-gray-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      School Phone
                    </label>
                    <Input
                      id="schoolPhone" name="schoolPhone" type="tel"
                      value={formData.schoolPhone} onChange={handleInputChange}
                      placeholder="Enter school phone number"
                      className="h-11 bg-white border-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={handleInputChange}
                      placeholder="Min. 8 characters" required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white pl-9 pr-10"
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword" name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword} onChange={handleInputChange}
                      placeholder="Repeat password" required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white pl-9 pr-10"
                    />
                    <button
                      type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit" disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Parent note */}
              {formData.role === 'PARENT' && (
                <p className="text-xs text-gray-500 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                  <span className="font-semibold text-purple-700">Independent parent account.</span> You can link your children and connect to their school from your dashboard after signing up — no school invite needed.
                </p>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
