"use client"

import { Sparkles, AlertTriangle, CalendarClock } from "lucide-react"

interface Subscription {
  packageName: string
  status: string
  amount: number
  daysRemaining: number
}

interface SubscriptionBadgeProps {
  subscription: Subscription | null
  formatCurrency: (amount: number) => string
}

export default function SubscriptionBadge({ subscription, formatCurrency }: SubscriptionBadgeProps) {
  if (!subscription) return null

  const days = subscription.daysRemaining
  const urgent = days <= 7
  const warning = days <= 30

  const pill = urgent ? "bg-red-50 text-red-700 border-red-200" : warning ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
  const Icon = urgent || warning ? AlertTriangle : Sparkles

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${pill}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold truncate max-w-[10rem]">{subscription.packageName}</span>
      {subscription.amount > 0 && <span className="hidden sm:inline opacity-80">· {formatCurrency(subscription.amount)}</span>}
      <span className="hidden sm:inline opacity-80">·</span>
      <span className="flex items-center gap-1">
        <CalendarClock className="w-3 h-3" />
        {days} days left
      </span>
    </div>
  )
}
