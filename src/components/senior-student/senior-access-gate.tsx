'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Hourglass, Lock, Loader2, Crown } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null))

interface AccessData {
  approvalStatus: string
  hasActiveAccess?: boolean
  name: string
}

export function SeniorAccessGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useSWR<AccessData>('/api/senior-student/access', fetcher, {
    revalidateOnFocus: true,
  })

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const status = data?.approvalStatus ?? 'PENDING'
  const hasActiveAccess = data?.hasActiveAccess ?? false

  if (status === 'PENDING') {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center mb-4">
              <Hourglass className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Account Pending Approval</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Your General Education Diploma account is awaiting approval by an administrator.
              You&apos;ll be able to start learning as soon as your access is activated.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'LOCKED' || !hasActiveAccess) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-rose-50 items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {status === 'LOCKED' ? 'Access Locked' : 'Subscription Expired'}
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {status === 'LOCKED'
                ? 'Your dashboard access has been paused. Subscribe to continue your General Education Diploma preparation.'
                : 'Your subscription has ended. Renew to continue your General Education Diploma preparation.'}
            </p>
            <div className="mt-5">
              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Subscribe to Continue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
