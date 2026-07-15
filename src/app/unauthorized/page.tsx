'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

const DASHBOARD_ROUTES: Record<string, string> = {
  SUPER_ADMIN:  '/super-admin/dashboard',
  SCHOOL_ADMIN: '/school-admin/dashboard',
  TEACHER:      '/teacher/dashboard',
  STUDENT:      '/student/dashboard',
  PARENT:       '/parent/dashboard',
}

export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // If the user is logged in, redirect them to their correct dashboard automatically
  useEffect(() => {
    if (session?.user?.role) {
      const correctPath = DASHBOARD_ROUTES[session.user.role]
      if (correctPath) {
        const timer = setTimeout(() => router.replace(correctPath), 2500)
        return () => clearTimeout(timer)
      }
    }
  }, [session, router])

  const correctDashboard = session?.user?.role ? DASHBOARD_ROUTES[session.user.role] : null
  const roleLabel = session?.user?.role
    ? session.user.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a] p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-red-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="mb-14">
            <Logo size="xl" variant="black" />
            <div className="mt-4 h-px w-12 bg-gradient-to-r from-red-400 to-orange-400 rounded-full" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Wrong{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Each account type has its own dedicated space. You're being redirected to the right one.
          </p>
        </div>
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-slate-500 text-xs">Need help? Contact your school administrator</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Access Restricted</h2>

            {correctDashboard ? (
              <>
                <p className="text-gray-500 text-sm mb-2">
                  You're signed in as a <span className="font-semibold text-gray-800">{roleLabel}</span>.
                  That page is not available for your account type.
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium mb-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting you to your dashboard…
                </div>
                <Link href={correctDashboard}>
                  <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl">
                    Go to My Dashboard Now
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-8">
                  You don't have permission to access this page. Please sign in with the correct account.
                </p>
                <Link href="/auth/signin">
                  <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl mb-3">
                    Sign In
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200 text-gray-600">
                    <Home className="w-4 h-4 mr-2" />Go to home
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
