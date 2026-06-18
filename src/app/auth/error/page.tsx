'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':       return 'Invalid email or password. Please try again.'
      case 'OAuthSignin':             return 'Error occurred during sign in. Please try again.'
      case 'OAuthCallback':           return 'Error occurred during callback. Please try again.'
      case 'OAuthCreateAccount':      return 'Could not create account. Please try again.'
      case 'EmailCreateAccount':      return 'Could not create account. Please try again.'
      case 'Callback':                return 'Error occurred during callback. Please try again.'
      case 'OAuthAccountNotLinked':   return 'Account already exists with a different provider.'
      case 'EmailSignin':             return 'Check your email for the sign in link.'
      case 'SessionRequired':         return 'Please sign in to access this page.'
      default:                        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — same as signin/signup */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a] p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="mb-14">
            <Logo size="xl" variant="white" />
            <div className="mt-4 h-px w-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Something went{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              wrong.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Don't worry — your data is safe. Try signing in again or contact support if the problem persists.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-slate-500 text-xs">Need help? Contact us at support@elimunova.app</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-500 text-sm mb-8">{getErrorMessage(error)}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-left">
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> Use the email and password you registered with. 
                Students should use credentials provided by their school.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl">
                  Try signing in again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200 text-gray-600">
                  Go to home
                </Button>
              </Link>
            </div>

            {error && (
              <p className="text-xs text-gray-400 mt-6">Error code: {error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
