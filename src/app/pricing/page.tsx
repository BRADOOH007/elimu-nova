import { PublicLayout } from '@/components/ui/public-layout'
import { PricingPlans } from '@/components/pricing/pricing-plans'
import { Sparkles } from 'lucide-react'

export default function PricingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Plans for every{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            school and family
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Tiered plans for schools &amp; institutions, plus premium plans for parents.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <PricingPlans />
      </section>
    </PublicLayout>
  )
}
