'use client'

import { SessionProvider } from 'next-auth/react'
import React, { ReactNode, useEffect } from 'react'
import { Toaster } from 'sonner'
import { SWRegister } from '@/components/sw-register'

interface ProvidersProps {
  children: ReactNode
}

class ClientErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  async componentDidCatch(error: unknown, info: React.ErrorInfo) {
    try {
      await fetch('/api/debug/client-error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'react_error_boundary',
          message: (error as any)?.message ?? String(error),
          stack: (error as any)?.stack,
          componentStack: info.componentStack,
        }),
      })
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-4">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    let sent = false

    const send = async (data: unknown) => {
      if (sent) return
      sent = true
      try {
        await fetch('/api/debug/client-error', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data),
        })
      } catch {}
    }

    const onError = (event: ErrorEvent) => {
      void send({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      void send({
        type: 'unhandledrejection',
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return (
    <SessionProvider
      refetchInterval={5 * 60}        // re-check session every 5 min (not on every focus)
      refetchOnWindowFocus={false}    // don't refetch on tab switch — prevents the loading flash
    >
      <ClientErrorBoundary>{children}</ClientErrorBoundary>
      <Toaster position="top-right" richColors />
      <SWRegister />
    </SessionProvider>
  )
}
