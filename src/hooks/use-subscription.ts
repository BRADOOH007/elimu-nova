'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SubscriptionInfo {
  isActive: boolean
  isTrial: boolean
  isExpired: boolean
  daysRemaining: number
  status: string
  packageName?: string
  trialEndsAt?: string
  endDate?: string
}

interface SubscriptionContext {
  userId?: string
  schoolId?: string
  userRole: string
}

export function useSubscription() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [context, setContext] = useState<SubscriptionContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const fetchSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const id = ++fetchIdRef.current

    try {
      setLoading(true)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'AbortError')), 8_000)

      const response = await fetch('/api/subscription/status', {
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (id !== fetchIdRef.current) return

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const data = await response.json()
      if (id !== fetchIdRef.current) return
      setSubscription(data.subscription)
      setContext(data.context)
      setError(null)
    } catch (err) {
      if (id !== fetchIdRef.current) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      if (id === fetchIdRef.current) setLoading(false)
    }
  }, [session?.user?.id])

  const startTrial = async () => {
    try {
      const response = await fetch('/api/subscription/start-trial', {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start trial')
      }

      await fetchSubscription()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial')
      return false
    }
  }

  const createCheckout = async (packageId: string, currency?: string) => {
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
          currency
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout')
      }

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout')
      throw err
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    context,
    loading,
    error,
    hasAccess: subscription?.isActive || false,
    isTrialEligible: !subscription && !loading,
    startTrial,
    createCheckout,
    refetch: fetchSubscription
  }
}
