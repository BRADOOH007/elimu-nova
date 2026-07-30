'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Zap, Loader2, Users, GraduationCap, Sparkles, ArrowRight } from "lucide-react"
import { useSubscription } from '@/hooks/use-subscription'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface PackagePlan {
  id: string
  name: string
  description: string
  price: number
  maxTeachers: number
  maxStudents: number
  features: string[]
  duration: number
}

const FALLBACK_PLANS: PackagePlan[] = [
  {
    id: 'starter', name: 'Starter School Plan',
    description: 'Perfect for small schools starting with AI learning.',
    price: 10, maxTeachers: 5, maxStudents: 100, duration: 1,
    features: ['Basic AI tutoring (All subjects)', 'AI-generated notes', 'Progress tracking', 'Weekly student reports', 'Email support'],
  },
  {
    id: 'growth', name: 'Growth Plan',
    description: 'Great for developing schools that need more automation.',
    price: 25, maxTeachers: 20, maxStudents: 500, duration: 1,
    features: ['All Starter features', 'Advanced AI tutoring', 'Real-time analytics dashboard', 'AI-generated lesson plans', 'AI-generated schemes of work', 'AI assignments (unlimited)', 'AI notes generator (enhanced)', 'Basic AI presentations', 'Homework help assistant'],
  },
  {
    id: 'excellence', name: 'Excellence Plan',
    description: 'A powerful package designed for full school automation.',
    price: 50, maxTeachers: 50, maxStudents: 2000, duration: 1,
    features: ['All Growth Plan features', 'AI-generated professional presentations (PPT style)', 'AI exam paper generation', 'AI rubric creator for marking', 'AI grading assistant with analytics', 'Voice learning mode', 'Teacher training & AI teaching tools', 'Student performance predictions'],
  },
]

export function PricingPlans() {
  const { data: session } = useSession()
  const { subscription, hasAccess, isTrialEligible, startTrial, createCheckout } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)
  const [plans, setPlans] = useState<PackagePlan[]>(FALLBACK_PLANS)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/packages/public')
      .then(r => r.json())
      .then(data => {
        if (data?.packages?.length > 0) {
          setPlans(data.packages)
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  const gradients = [
    { card: "from-blue-500/10 via-purple-500/5 to-transparent", border: "from-blue-500 to-purple-600", icon: "from-blue-500 to-purple-600", btn: "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700", accent: "text-blue-400" },
    { card: "from-purple-500/10 via-pink-500/5 to-transparent", border: "from-purple-500 to-pink-600", icon: "from-purple-500 to-pink-600", btn: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700", accent: "text-purple-400" },
    { card: "from-pink-500/10 via-rose-500/5 to-transparent", border: "from-pink-500 to-rose-600", icon: "from-pink-500 to-rose-600", btn: "from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700", accent: "text-pink-400" },
  ] as const

  const handleStartTrial = async () => {
    if (!session) { window.location.href = '/auth/signin'; return }
    setLoading('trial')
    try { const success = await startTrial(); if (success) window.location.href = '/teacher/dashboard' }
    catch (error) { console.error('Failed to start trial:', error) }
    finally { setLoading(null) }
  }

  const handleUpgrade = async (planId: string) => {
    if (!session) { window.location.href = '/auth/signin'; return }
    setLoading(planId)
    try { await createCheckout(planId) }
    catch (error) { console.error('Failed to create checkout:', error) }
    finally { setLoading(null) }
  }

  const currentPlanName = subscription?.packageName || ''

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Simple, transparent pricing
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Choose your{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ideal plan
          </span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Start with a 10-day free trial. No credit card required. Cancel anytime.
        </p>

        {session && subscription && (
          <div className="mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700/60">
            {subscription.isTrial ? (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-300">
                  Free Trial &mdash; {subscription.daysRemaining} days remaining
                </span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">
                  Current plan: {subscription.packageName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      {fetching ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 items-start">
          {plans.map((plan, index) => {
            const g = gradients[index] || gradients[0]
            const current = currentPlanName.toLowerCase().includes(plan.name.toLowerCase().split(' ')[0])
            const popular = index === 1
            return (
              <div key={plan.id} className="relative group">
                <div
                  className={`relative h-full rounded-2xl border backdrop-blur-sm transition-all duration-500 flex flex-col opacity-0 animate-card-fade-in card-stagger-${(index % 6) + 1} ${
                    current
                      ? 'border-purple-500/60 bg-slate-800/90 shadow-xl shadow-purple-500/15'
                      : popular
                      ? 'border-purple-500/40 bg-slate-800/80 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/15 hover:-translate-y-1'
                      : 'border-slate-700/40 bg-slate-800/50 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                  } hover:border-slate-500/80`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${g.card} animate-gradient-shift opacity-60 pointer-events-none`} />

                  <div className="relative z-10 p-8 flex flex-col h-full">
                    {popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-1.5 text-xs font-bold shadow-lg shadow-purple-500/20 border-0">
                          <Star className="w-3 h-3 mr-1.5 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    {current && (
                      <div className="absolute -top-3 right-6">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 text-xs font-bold border-0 shadow-lg shadow-emerald-500/20">
                          <Crown className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    )}

                    <div className="text-center mb-5">
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${g.icon} flex items-center justify-center shadow-lg animate-icon-glow ${popular ? 'scale-110' : ''}`}>
                        <Crown className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-extrabold tracking-tight ${
                          popular
                            ? 'text-5xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent'
                            : 'text-4xl text-white'
                        }`}>
                          {usd(plan.price)}
                        </span>
                        <span className={`${popular ? 'text-slate-400' : 'text-slate-500'} text-sm`}>/month</span>
                      </div>
                      {popular && <p className="text-xs text-purple-300/70 mt-1">best value</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className={`rounded-xl p-3.5 text-center ${
                        popular ? 'bg-purple-900/30 border border-purple-500/25' : 'bg-slate-900/60 border border-slate-700/50'
                      }`}>
                        <Users className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                        <div className="text-lg font-bold text-white">{plan.maxTeachers}</div>
                        <div className="text-xs text-slate-400">Teachers</div>
                      </div>
                      <div className={`rounded-xl p-3.5 text-center ${
                        popular ? 'bg-purple-900/30 border border-purple-500/25' : 'bg-slate-900/60 border border-slate-700/50'
                      }`}>
                        <GraduationCap className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                        <div className="text-lg font-bold text-white">{plan.maxStudents}</div>
                        <div className="text-xs text-slate-400">Students</div>
                      </div>
                    </div>

                    <div className="mb-8 flex-1">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features included:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-3">
                            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${g.accent}`} />
                            <span className="text-sm text-slate-300 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={current ? () => {} : !session ? () => window.location.href = '/auth/signin' : isTrialEligible ? handleStartTrial : () => handleUpgrade(plan.id)}
                      disabled={loading === plan.id || loading === 'trial' || current}
                      className={`w-full py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                        current
                          ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                          : popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5'
                          : `bg-gradient-to-r ${g.btn} text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:-translate-y-0.5`
                      }`}
                    >
                      {loading === plan.id || loading === 'trial' ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {current ? 'Current Plan' : !session ? 'Get Started' : isTrialEligible ? 'Start Free Trial' : 'Upgrade Now'}
                          {!current && <ArrowRight className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </Button>

                    {popular && !current && (
                      <div className="mt-3 text-center">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-1.5 text-xs font-bold shadow-lg shadow-purple-500/20 border-0">
                          <Star className="w-3 h-3 mr-1.5 fill-current" /> Most Popular
                        </Badge>
                      </div>
                    )}

                    {isTrialEligible && !session && (
                      <p className="mt-3 text-center text-xs text-slate-500">Sign in to start your free trial</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="relative bg-gradient-to-br from-purple-900/40 via-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 sm:p-10 border border-purple-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Still have questions?</h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              All plans include a 10-day free trial. No credit card required. Cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button variant="outline" className="bg-white/5 border-purple-400/30 text-slate-200 hover:bg-purple-500/10 hover:text-white rounded-xl px-6 backdrop-blur-sm">
                  Contact Sales
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" className="bg-white/5 border-purple-400/30 text-slate-200 hover:bg-purple-500/10 hover:text-white rounded-xl px-6 backdrop-blur-sm">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
