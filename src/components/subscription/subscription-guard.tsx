'use client'

import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Clock, 
  AlertTriangle, 
  Zap,
  CheckCircle,
  Calendar,
  CreditCard
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
  const { subscription, loading, hasAccess, isTrialEligible, startTrial } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading subscription status...</span>
      </div>
    )
  }

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default subscription required UI
  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          {subscription?.isExpired ? (
            <>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Subscription Expired
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Your {subscription.isTrial ? 'free trial' : 'subscription'} has expired. 
                Upgrade to continue using ElimuNova AI.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Premium Features Required
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Access advanced AI tools, unlimited lesson plans, and premium features.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Status */}
          {subscription && (
            <div className="p-4 bg-white/70 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Status</span>
                <Badge variant={subscription.isExpired ? 'destructive' : 'secondary'}>
                  {subscription.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {subscription.isTrial && !subscription.isExpired && (
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

          {/* Trial Option */}
          {isTrialEligible && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start Free Trial
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Get 7 days of full access to all premium features
                  </p>
                </div>
                <Button
                  onClick={startTrial}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Start Trial
                </Button>
              </div>
            </div>
          )}

          {/* Premium Features */}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <CreditCard className="w-4 h-4 mr-2" />
                View Pricing Plans
              </Button>
            </Link>
            
            {subscription?.isExpired && (
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full">
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

// Higher-order component for page-level protection
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