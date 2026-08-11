'use client'

import { useSubscription } from '@/hooks/use-subscription'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Clock,
  Crown,
  Zap,
  CreditCard,
  Calendar,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

function useBillingPath() {
  const { data: session } = useSession()
  const role = session?.user?.role
  if (role === 'TEACHER')      return '/teacher/billing'
  if (role === 'SCHOOL_ADMIN') return '/school-admin/billing'
  if (role === 'STUDENT')      return '/student/billing'
  if (role === 'PARENT')       return '/parent/billing'
  return '/billing'
}

export function SubscriptionAlert() {
  const { subscription, hasAccess, context } = useSubscription()
  const billingPath = useBillingPath()
  const [dismissed, setDismissed] = useState(false)

  // Students never see subscription alerts — parent/school manages it
  if (context?.userRole === 'STUDENT') return null
  if (dismissed) return null
  if (!subscription) return null
  if (subscription.status === 'SCHOOL_MANAGED') return null
  if (subscription.status === 'UNKNOWN') return null
  if (hasAccess && !subscription.isTrial) return null

  // ── Trial expiring ≤ 3 days ──
  if (subscription.isTrial && subscription.daysRemaining <= 3 && subscription.daysRemaining > 0) {
    return (
      <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Trial Expiring Soon</h3>
                <p className="text-orange-700 text-sm mb-3">
                  Your free trial expires in {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? 's' : ''}.
                  Upgrade now to keep all premium features.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/pricing">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                      <CreditCard className="w-4 h-4 mr-2" />Upgrade Now
                    </Button>
                  </Link>
                  <Link href={billingPath}>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      <Calendar className="w-4 h-4 mr-2" />View Billing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-orange-600 hover:bg-orange-100 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Trial expired ──
  if (subscription.isExpired && subscription.isTrial) {
    return (
      <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Trial Expired</h3>
                <p className="text-red-700 text-sm mb-3">
                  Your 10-day free trial has ended. Subscribe to a plan to restore access.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/pricing">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      <CreditCard className="w-4 h-4 mr-2" />Upgrade Now
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-red-600 hover:bg-red-100 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Active trial > 3 days ──
  if (subscription.isTrial && subscription.daysRemaining > 3) {
    return (
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  Free Trial Active
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    {subscription.daysRemaining} days left
                  </Badge>
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  You have full access until{' '}
                  {new Date(subscription.trialEndsAt!).toLocaleDateString()}.
                  Upgrade anytime to keep access after your trial.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/pricing">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Crown className="w-4 h-4 mr-2" />Upgrade Early
                    </Button>
                  </Link>
                  <Link href={billingPath}>
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Calendar className="w-4 h-4 mr-2" />View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-blue-600 hover:bg-blue-100 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
