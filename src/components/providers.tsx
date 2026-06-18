'use client'

import { SessionProvider } from 'next-auth/react'
import React, { ReactNode, useEffect } from 'react'
import { Toaster } from 'sonner'

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
    if (this.state.hasError) return null
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
    <SessionProvider>
      <ClientErrorBoundary>{children}</ClientErrorBoundary>
      <Toaster position="top-right" richColors />
    </SessionProvider>
  )
}
