'use client'

import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requiresPremium?: boolean
}

export function SubscriptionGuard({
  children,
  fallback,
  requiresPremium = true
}: SubscriptionGuardProps) {
  const { subscription, loading, hasAccess, error } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading subscription status...</span>
      </div>
    )
  }

  // If subscription check failed (error), allow access rather than blocking
  if (!loading && !subscription && error) {
    return <>{children}</>
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const isExpired = subscription?.isExpired
  const isTrial = subscription?.isTrial

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 ${isExpired ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isExpired ? <Lock className="w-8 h-8 text-white" /> : <Crown className="w-8 h-8 text-white" />}
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            {isExpired && <AlertTriangle className="w-6 h-6 text-orange-500" />}
            {isExpired ? 'Access Revoked' : 'Premium Features Required'}
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            {isExpired
              ? `Your ${isTrial ? '10-day free trial' : 'subscription'} has ended. Subscribe to restore full access to all features.`
              : 'Access advanced AI tools, unlimited lesson plans, and premium features.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {subscription && (
            <div className="p-4 bg-white/70 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Status</span>
                <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                  {isExpired ? 'Expired' : subscription.status.replace('_', ' ')}
                </Badge>
              </div>

              {isTrial && !isExpired && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{subscription.daysRemaining} days remaining in trial</span>
                </div>
              )}

              {subscription.packageName && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>{subscription.packageName} Package</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Premium Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Unlimited AI lesson plans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Advanced AI tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Scheme of work generator
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Student progress tracking
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Additional Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Export capabilities
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Unlimited storage
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <CreditCard className="w-4 h-4 mr-2" />
                View Pricing Plans
              </Button>
            </Link>

            {isExpired && (
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Renew Subscription
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function withSubscriptionGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requiresPremium?: boolean }
) {
  return function ProtectedComponent(props: P) {
    return (
      <SubscriptionGuard requiresPremium={options?.requiresPremium}>
        <Component {...props} />
      </SubscriptionGuard>
    )
  }
}
