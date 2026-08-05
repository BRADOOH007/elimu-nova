'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

/**
 * Session gate for all role dashboards.
 *
 * Guarantees the dashboard can NEVER be stuck on a loading screen:
 *  - shows the loader only while NextAuth is actively hydrating (max 5s)
 *  - if the session is definitively absent, redirects to sign-in
 *  - if the session endpoint hangs past the timeout, redirects to sign-in
 *
 * Every branch terminates in either the real dashboard or a redirect.
 */
const MAX_LOADING_MS = 5000

export function DashboardSessionGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), MAX_LOADING_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated' || (timedOut && !session)) {
      router.replace('/auth/signin')
    }
  }, [status, timedOut, session, router])

  // Session is still resolving — show loader (bounded by the timeout above)
  if (status === 'loading' && !timedOut) return <DashboardLoading />

  // No session after auth resolved or after the timeout — redirect is firing,
  // render the loader only for the brief moment before navigation completes.
  if (status === 'unauthenticated' || (timedOut && !session)) return <DashboardLoading />

  // Authenticated (or session arrived just after the timeout): render the app.
  return <>{children}</>
}
