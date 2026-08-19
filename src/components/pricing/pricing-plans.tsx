'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Zap, Loader2, Users, GraduationCap, Sparkles, ArrowRight, Building2, Home } from "lucide-react"
import { useSubscription } from '@/hooks/use-subscription'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Audience = 'schools' | 'learners' | 'adult'
type Currency = 'kes' | 'usd'

interface PricingPlan {
  key: string
  name: string
  tagline: string
  match: string
  kesPrice: number | null
  usdPrice: number | null
  custom?: boolean
  billingPeriod?: string
  detail?: string
  teachers?: number | string
  students?: number | string
  children?: number | string
  features: string[]
  popular?: boolean
}

const SCHOOL_PLANS: PricingPlan[] = [
  {
    key: 'school_basic', name: 'Basic School Plan', match: 'basic',
    tagline: 'Perfect for small schools getting started with AI.',
    kesPrice: 5000, usdPrice: 49,
    teachers: 5, students: 100,
    features: ['Core AI Tutoring', 'Class Progress Tracking', 'Standard Analytics', 'Email Support'],
  },
  {
    key: 'school_growth', name: 'Growth School Plan', match: 'growth',
    tagline: 'For medium schools scaling AI-powered learning.',
    kesPrice: 15000, usdPrice: 149,
    teachers: 20, students: 500, popular: true,
    features: ['Advanced AI Tutoring', 'Personalized Learning Paths', 'Real-Time Analytics', 'Priority Support', 'Custom Curriculum Alignment'],
  },
  {
    key: 'school_enterprise', name: 'Enterprise School Plan', match: 'enterprise',
    tagline: 'For large school networks and districts.',
    kesPrice: null, usdPrice: null, custom: true,
    teachers: 'Unlimited', students: 'Unlimited',
    features: ['Multi-campus Admin Controls', 'Dedicated Database Tenant', 'LMS Integration', 'Dedicated Account Manager'],
  },
]

const LEARNER_PLANS: PricingPlan[] = [
  {
    key: 'learner_prek3', name: 'Pre K–3', match: 'pre k',
    tagline: 'Early childhood learning for young learners.',
    kesPrice: 500, usdPrice: 100, billingPeriod: '/month', detail: 'Pre K–3',
    features: ['Play-based early learning', 'Phonics & number skills', 'AI tutor for little learners', 'Parent progress reports'],
  },
  {
    key: 'learner_4_8', name: 'Grade 4–8', match: 'grade 4',
    tagline: 'Upper primary & junior secondary.',
    kesPrice: 800, usdPrice: 120, billingPeriod: '/month', detail: 'Grade 4–8', popular: true,
    features: ['Full CBC curriculum', 'AI-powered personal tutor', 'Homework help 24/7', 'Weakness identification & practice'],
  },
  {
    key: 'learner_9_12', name: 'Grade 9–12', match: 'grade 9',
    tagline: 'Senior secondary & exam preparation.',
    kesPrice: 1200, usdPrice: 150, billingPeriod: '/term', detail: 'Grade 9–12',
    features: ['KCSE exam preparation', 'Past papers & marking schemes', 'Subject-focused AI tutoring', 'Progress & performance analytics'],
  },
]

const ADULT_PLANS: PricingPlan[] = [
  {
    key: 'ged', name: 'GED / Adult Diploma', match: 'ged',
    tagline: 'US General Education Diploma preparation.',
    kesPrice: 2000, usdPrice: 100, billingPeriod: '/month', detail: 'Adult learners', popular: true,
    features: ['Full GED curriculum (4 subjects)', 'Computer & AI literacy courses', 'Live lessons with instructors', 'GED certificate of completion'],
  },
  {
    key: 'tutoring_3_8', name: 'Tutoring 3–8', match: 'tutoring 3',
    tagline: '1:1 tutoring for grades 3–8.',
    kesPrice: 600, usdPrice: 50, billingPeriod: '/hour', detail: 'Grades 3–8',
    features: ['1:1 live tutoring', 'Personalised lesson plan', 'Homework & exam help', 'Flexible scheduling'],
  },
  {
    key: 'tutoring_9_12', name: 'Tutoring 9–12', match: 'tutoring 9',
    tagline: '1:1 tutoring for grades 9–12.',
    kesPrice: 800, usdPrice: 60, billingPeriod: '/hour', detail: 'Grades 9–12',
    features: ['1:1 live tutoring', 'KCSE exam coaching', 'Past paper walkthroughs', 'Flexible scheduling'],
  },
]

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

export function PricingPlans() {
  const { data: session } = useSession()
  const router = useRouter()
  const { subscription, isTrialEligible, startTrial, createCheckout } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)
  const [dbPackages, setDbPackages] = useState<PackagePlan[]>([])
  const [currency, setCurrency] = useState<Currency>('kes')

  const role = session?.user?.role as string | undefined
  const [audience, setAudience] = useState<Audience>(
    role === 'PARENT' ? 'learners' : role === 'SENIOR_STUDENT' ? 'adult' : 'schools'
  )

  useEffect(() => {
    fetch('/api/packages/public')
      .then(r => r.json())
      .then(data => {
        if (data?.packages?.length > 0) setDbPackages(data.packages)
      })
      .catch(() => {})
  }, [])

  const gradients = [
    { card: "from-blue-500/10 via-purple-500/5 to-transparent", border: "from-blue-500 to-purple-600", icon: "from-blue-500 to-purple-600", btn: "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700", accent: "text-blue-400" },
    { card: "from-purple-500/10 via-pink-500/5 to-transparent", border: "from-purple-500 to-pink-600", icon: "from-purple-500 to-pink-600", btn: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700", accent: "text-purple-400" },
    { card: "from-pink-500/10 via-rose-500/5 to-transparent", border: "from-pink-500 to-rose-600", icon: "from-pink-500 to-rose-600", btn: "from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700", accent: "text-pink-400" },
  ] as const

  const activePlans =
    audience === 'schools' ? SCHOOL_PLANS : audience === 'learners' ? LEARNER_PLANS : ADULT_PLANS

  const handleStartTrial = async () => {
    if (!session) { router.push('/auth/signin'); return }
    setLoading('trial')
    try { const success = await startTrial(); if (success) router.push('/teacher/dashboard') }
    catch (error) { console.error('Failed to start trial:', error) }
    finally { setLoading(null) }
  }

  const handleUpgrade = async (plan: PricingPlan, method: 'stripe' | 'paypal' = 'stripe') => {
    if (plan.custom) { router.push('/contact'); return }
    if (!session) { router.push('/auth/signin'); return }

    if (audience === 'schools' && isTrialEligible) {
      handleStartTrial()
      return
    }

    // Prefer an existing DB package that matches this plan; otherwise send the plan key
    // so the backend can resolve/find-or-create it.
    const match = dbPackages.find(p => p.name.toLowerCase().includes(plan.match))
    setLoading(`${plan.key}:${method}`)
    try {
      if (method === 'paypal') {
        const res = await fetch('/api/subscription/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: match ? match.id : plan.key, currency }),
        })
        const data = await res.json()
        if (data.approvalUrl) {
          router.push(data.approvalUrl)
        } else {
          console.error('Failed to create PayPal order:', data)
        }
      } else {
        await createCheckout(match ? match.id : plan.key, currency)
      }
    } catch (error) { console.error('Failed to create checkout:', error) }
    finally { setLoading(null) }
  }

  const formatPrice = (plan: PricingPlan) => {
    if (plan.custom) return 'Custom Pricing'
    if (plan.kesPrice == null || plan.usdPrice == null) return 'Custom Pricing'
    return currency === 'kes' ? `KES ${plan.kesPrice.toLocaleString()}` : `$${plan.usdPrice} USD`
  }

  const priceSuffix = (plan: PricingPlan) => {
    if (plan.custom) return ''
    return plan.billingPeriod || '/month'
  }

  const isCurrentPlan = (plan: PricingPlan) => {
    if (!subscription?.packageName) return false
    return subscription.packageName.toLowerCase().includes(plan.match)
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-14">
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
          {audience === 'schools'
            ? 'Flexible school & institutional plans. Start with a 14-day full access trial.'
            : audience === 'learners'
            ? 'Affordable AI tutoring for your child — at a fraction of private tuition.'
            : 'US GED & adult learning with live tutoring — built for adult learners.'}
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

        {/* Audience Toggle */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1 p-1 bg-slate-800/60 rounded-full border border-slate-700/40">
          <button
            type="button"
            onClick={() => setAudience('schools')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              audience === 'schools' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:block"><Building2 className="w-4 h-4" /></span>
            Schools
          </button>
          <button
            type="button"
            onClick={() => setAudience('learners')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              audience === 'learners' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:block"><Home className="w-4 h-4" /></span>
            Parents
          </button>
          <button
            type="button"
            onClick={() => setAudience('adult')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              audience === 'adult' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:block"><GraduationCap className="w-4 h-4" /></span>
            Adult &amp; GED
          </button>
        </div>

        {/* Currency Toggle */}
        <div className="mt-6 inline-flex items-center gap-1 p-1 bg-slate-800/60 rounded-full border border-slate-700/40">
          <button
            type="button"
            onClick={() => setCurrency('kes')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currency === 'kes' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            KES
          </button>
          <button
            type="button"
            onClick={() => setCurrency('usd')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currency === 'usd' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            USD
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-14 items-start">
        {activePlans.map((plan, index) => {
          const g = gradients[index] || gradients[0]
          const current = isCurrentPlan(plan)
          const popular = plan.popular || false
          return (
            <div key={plan.key} className="relative group">
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
                    <p className="text-sm text-slate-400 leading-relaxed">{plan.tagline}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`font-extrabold tracking-tight ${
                        popular
                          ? 'text-5xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent'
                          : 'text-4xl text-white'
                      }`}>
                        {formatPrice(plan)}
                      </span>
                      <span className={`${popular ? 'text-slate-400' : 'text-slate-500'} text-sm`}>{priceSuffix(plan)}</span>
                    </div>
                    {popular && <p className="text-xs text-purple-300/70 mt-1">best value</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {audience === 'schools' ? (
                      <>
                        <div className={`rounded-xl p-3.5 text-center ${
                          popular ? 'bg-purple-900/30 border border-purple-500/25' : 'bg-slate-900/60 border border-slate-700/50'
                        }`}>
                          <Users className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                          <div className="text-lg font-bold text-white">{plan.teachers}</div>
                          <div className="text-xs text-slate-400">Teachers</div>
                        </div>
                        <div className={`rounded-xl p-3.5 text-center ${
                          popular ? 'bg-purple-900/30 border border-purple-500/25' : 'bg-slate-900/60 border border-slate-700/50'
                        }`}>
                          <GraduationCap className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                          <div className="text-lg font-bold text-white">{plan.students}</div>
                          <div className="text-xs text-slate-400">Students</div>
                        </div>
                      </>
                    ) : (
                      <div className={`col-span-2 rounded-xl p-3.5 text-center ${
                        popular ? 'bg-purple-900/30 border border-purple-500/25' : 'bg-slate-900/60 border border-slate-700/50'
                      }`}>
                        <GraduationCap className={`w-4 h-4 mx-auto mb-1.5 ${g.accent}`} />
                        <div className="text-lg font-bold text-white">{plan.detail || plan.name}</div>
                        <div className="text-xs text-slate-400">{audience === 'adult' ? 'Program' : 'Level'}</div>
                      </div>
                    )}
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
                    onClick={current ? () => {} : plan.custom ? () => { router.push('/contact') } : !session ? () => router.push('/auth/signin') : audience === 'schools' && isTrialEligible ? handleStartTrial : () => handleUpgrade(plan, 'stripe')}
                    disabled={loading === `${plan.key}:stripe` || loading === `${plan.key}:paypal` || loading === 'trial' || current}
                    className={`w-full py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                      current
                        ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                        : popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5'
                        : `bg-gradient-to-r ${g.btn} text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:-translate-y-0.5`
                    }`}
                  >
                    {loading === `${plan.key}:stripe` || loading === `${plan.key}:paypal` || loading === 'trial' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {current ? 'Current Plan' : plan.custom ? 'Contact Sales' : !session ? 'Get Started' : audience === 'schools' && isTrialEligible ? 'Start Free Trial' : 'Pay with Card'}
                        {!current && <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </Button>

                  {!current && !plan.custom && session && !(audience === 'schools' && isTrialEligible) && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpgrade(plan, 'paypal')}
                      disabled={loading === `${plan.key}:stripe` || loading === `${plan.key}:paypal` || loading === 'trial'}
                      className="w-full mt-3 py-3 text-sm font-semibold rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/40 hover:text-white hover:border-slate-500 transition-all"
                    >
                      {loading === `${plan.key}:paypal` ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <span className="flex items-center justify-center gap-2">Pay with PayPal</span>
                      )}
                    </Button>
                  )}

                  {popular && !current && (
                    <div className="mt-3 text-center">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-1.5 text-xs font-bold shadow-lg shadow-purple-500/20 border-0">
                        <Star className="w-3 h-3 mr-1.5 fill-current" /> Most Popular
                      </Badge>
                    </div>
                  )}

                  {audience === 'schools' && isTrialEligible && !session && (
                    <p className="mt-3 text-center text-xs text-slate-500">Sign in to start your free trial</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Value Proposition Banner */}
      <div className="mb-16">
        <div className="relative bg-gradient-to-br from-blue-900/40 via-slate-800/80 to-purple-900/60 backdrop-blur-sm rounded-2xl p-8 sm:p-10 border border-blue-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {audience === 'schools' ? 'Start free, scale when you are ready.' : audience === 'learners' ? 'Premium tutoring without the premium price.' : 'Your pathway to a GED diploma.'}
              </h3>
              <p className="text-slate-300 max-w-xl mx-auto sm:mx-0">
                {audience === 'schools'
                  ? 'Starts with a 14-day full access trial. All plans include automated CBC & STEM curriculum tools.'
                  : audience === 'learners'
                  ? '24/7 AI tutoring at a fraction of the cost of traditional private tutoring (avg. KES 15,000/mo).'
                  : 'Earn a US GED diploma with AI tutoring, live lessons, and computer literacy — all in one plan.'}
              </p>
            </div>
            <Link href={audience === 'schools' ? '/contact' : '/auth/signup'}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30">
                {audience === 'schools' ? 'Talk to Sales' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="relative bg-gradient-to-br from-purple-900/40 via-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 sm:p-10 border border-purple-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Still have questions?</h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              {audience === 'schools'
                ? 'All school plans include a 14-day full access trial. No credit card required. Cancel anytime.'
                : audience === 'learners'
                ? 'No hidden fees. Start with your first child today and add more anytime.'
                : 'No hidden fees. Includes GED prep, live lessons, and tutoring — cancel anytime.'}
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
