'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Logo size="sm" variant="white" />
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Back to home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-8">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset} className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline" className="h-11 rounded-xl border-gray-200 text-gray-600">
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
