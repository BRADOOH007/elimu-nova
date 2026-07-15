'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Zap, Loader2, Users, GraduationCap, Sparkles, ArrowRight } from "lucide-react"
import { useSubscription } from '@/hooks/use-subscription'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Package {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  maxTeachers: number
  maxStudents: number
  features: string[]
  isActive: boolean
}

interface PricingPlansProps {
  packages: Package[]
}

export function PricingPlans({ packages }: PricingPlansProps) {
  const { data: session } = useSession()
  const { subscription, hasAccess, isTrialEligible, startTrial, createCheckout } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)

  const usd = (n: number) => new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD" 
  }).format(n)

  const gradients = [
    { card: "from-blue-500/10 via-purple-500/5 to-transparent", border: "from-blue-500 to-purple-600", icon: "from-blue-500 to-purple-600", btn: "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700", accent: "text-blue-400" },
    { card: "from-purple-500/10 via-pink-500/5 to-transparent", border: "from-purple-500 to-pink-600", icon: "from-purple-500 to-pink-600", btn: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700", accent: "text-purple-400" },
    { card: "from-pink-500/10 via-rose-500/5 to-transparent", border: "from-pink-500 to-rose-600", icon: "from-pink-500 to-rose-600", btn: "from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700", accent: "text-pink-400" },
    { card: "from-green-500/10 via-emerald-500/5 to-transparent", border: "from-green-500 to-emerald-600", icon: "from-green-500 to-emerald-600", btn: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700", accent: "text-green-400" },
    { card: "from-orange-500/10 via-red-500/5 to-transparent", border: "from-orange-500 to-red-600", icon: "from-orange-500 to-red-600", btn: "from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700", accent: "text-orange-400" },
    { card: "from-indigo-500/10 via-blue-500/5 to-transparent", border: "from-indigo-500 to-blue-600", icon: "from-indigo-500 to-blue-600", btn: "from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700", accent: "text-indigo-400" },
  ] as const

  const handleStartTrial = async () => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }
    setLoading('trial')
    try {
      const success = await startTrial()
      if (success) window.location.href = '/teacher/dashboard'
    } catch (error) {
      console.error('Failed to start trial:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpgrade = async (packageId: string) => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }
    setLoading(packageId)
    try {
      await createCheckout(packageId)
    } catch (error) {
      console.error('Failed to create checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  const getButtonText = (pkg: Package) => {
    if (!session) return 'Get Started'
    if (subscription?.packageName === pkg.name && hasAccess) return 'Current Plan'
    if (isTrialEligible) return 'Start Free Trial'
    return 'Upgrade Now'
  }

  const getButtonAction = (pkg: Package) => {
    if (!session) return () => window.location.href = '/auth/signin'
    if (subscription?.packageName === pkg.name && hasAccess) return () => {}
    if (isTrialEligible) return handleStartTrial
    return () => handleUpgrade(pkg.id)
  }

  const isCurrentPlan = (pkg: Package) => subscription?.packageName === pkg.name && hasAccess

  const isPopular = (_pkg: Package, index: number) =>
    packages.length >= 3 && index === Math.floor(packages.length / 2)

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
          Start with a 7-day free trial. No credit card required. Cancel anytime.
        </p>
        
        {/* Current Subscription Status */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 items-start">
        {packages.map((pkg, index) => {
          const g = gradients[index % gradients.length]
          const popular = isPopular(pkg, index)
          const current = isCurrentPlan(pkg)
          const tier = packages.length === 3 ? index : 0

          return (
            <div
              key={pkg.id}
              className={`relative group ${popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {/* Card */}
              <div
                className={`relative h-full rounded-2xl border backdrop-blur-sm transition-all duration-500 flex flex-col opacity-0 animate-card-fade-in card-stagger-${(index % 6) + 1} ${
                  current
                    ? 'border-purple-500/60 bg-slate-800/90 shadow-xl shadow-purple-500/15'
                    : popular
                    ? 'border-purple-500/40 bg-slate-800/80 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/15 hover:-translate-y-1'
                    : tier === 0
                    ? 'border-slate-700/40 bg-slate-800/50 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    : 'border-slate-700/70 bg-slate-800/70 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                } hover:border-slate-500/80`}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${g.card} animate-gradient-shift opacity-60 pointer-events-none`} />

                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col h-full">
                  {/* Popular Badge */}
                  {popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-1.5 text-xs font-bold shadow-lg shadow-purple-500/20 border-0">
                        <Star className="w-3 h-3 mr-1.5 fill-current" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {current && (
                    <div className="absolute -top-3 right-6">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 text-xs font-bold border-0 shadow-lg shadow-emerald-500/20">
                        <Crown className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}

                  {/* Icon & Name */}
                  <div className="text-center mb-5">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${g.icon} flex items-center justify-center shadow-lg animate-icon-glow ${popular ? 'scale-110' : ''}`}>
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-slate-400 leading-relaxed">{pkg.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`font-extrabold tracking-tight ${
                        popular
                          ? 'text-5xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent'
                          : 'text-4xl text-white'
                      }`}>
                        {usd(pkg.price)}
                      </span>
                      <span className={`${popular ? 'text-slate-400' : 'text-slate-500'} text-sm`}>/mo</span>
                    </div>
                    {popular && (
                      <p className="text-xs text-purple-300/70 mt-1">best value</p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`rounded-xl p-3.5 text-center ${
                      popular
                        ? 'bg-purple-900/30 border border-purple-500/25'
                        : 'bg-slate-900/60 border border-slate-700/50'
                    }`}>
                      <Users className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                      <div className="text-lg font-bold text-white">{pkg.maxTeachers}</div>
                      <div className="text-xs text-slate-400">Teachers</div>
                    </div>
                    <div className={`rounded-xl p-3.5 text-center ${
                      popular
                        ? 'bg-purple-900/30 border border-purple-500/25'
                        : 'bg-slate-900/60 border border-slate-700/50'
                    }`}>
                      <GraduationCap className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                      <div className="text-lg font-bold text-white">{pkg.maxStudents}</div>
                      <div className="text-xs text-slate-400">Students</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-1">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Everything included
                    </h4>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${g.accent}`} />
                          <span className="text-sm text-slate-300 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button */}
                  <Button
                    onClick={getButtonAction(pkg)}
                    disabled={loading === pkg.id || loading === 'trial' || current}
                    className={`w-full py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                      current
                        ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                        : popular
                        ? `bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5`
                        : `bg-gradient-to-r ${g.btn} text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:-translate-y-0.5`
                    }`}
                  >
                    {loading === pkg.id || loading === 'trial' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {getButtonText(pkg)}
                        {!current && <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </Button>

                  {/* Trial Info */}
                  {isTrialEligible && !session && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      Sign in to start your free trial
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="relative bg-gradient-to-br from-purple-900/40 via-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 sm:p-10 border border-purple-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              All plans include a 7-day free trial. No credit card required.
              Cancel anytime.
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