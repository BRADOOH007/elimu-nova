'use client'

import { useState, useEffect, useRef } from 'react'
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
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchSubscription = async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort(new DOMException('superseded', 'AbortError'))
    }

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => {
      controller.abort(new DOMException('timeout', 'AbortError'))
    }, 8_000)

    try {
      setLoading(true)
      const response = await fetch('/api/subscription/status', {
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!mountedRef.current) return
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const data = await response.json()
      setSubscription(data.subscription)
      setContext(data.context)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Error fetching subscription:', err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

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
    mountedRef.current = true
    fetchSubscription()
    return () => {
      mountedRef.current = false
      if (abortRef.current) {
        abortRef.current.abort(new DOMException('unmounted', 'AbortError'))
        abortRef.current = null
      }
    }
  }, [session?.user?.id])

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
