'use client'

import { useLiveMetrics } from '@/hooks/use-live-metrics'
import { TrendingUp, TrendingDown, Activity, DollarSign, School, Users, Clock } from 'lucide-react'

function formatCurrency(n: number) { return `$${n.toLocaleString()}` }
function formatNumber(n: number) { return n.toLocaleString() }

function MetricCard({ icon: Icon, label, value, trend, accent }: {
  icon: any; label: string; value: string; trend?: 'up' | 'down'; accent: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 min-w-0">
      <div className={`p-1.5 rounded-full shrink-0 ${accent}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white tabular-nums">{value}</span>
          {trend && (trend === 'up'
            ? <TrendingUp className="w-3 h-3 text-emerald-400" />
            : <TrendingDown className="w-3 h-3 text-red-400" />
          )}
        </div>
      </div>
    </div>
  )
}

export function LiveMetricsBar() {
  const { metrics } = useLiveMetrics(10000)

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs px-1 py-2">
        <Clock className="w-3 h-3 animate-pulse" />
        Loading live metrics...
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MetricCard icon={School} label="Schools" value={formatNumber(metrics.schools)} trend="up" accent="bg-blue-600" />
      <MetricCard icon={Users} label="Users" value={formatNumber(metrics.users)} accent="bg-violet-600" />
      <MetricCard icon={Activity} label="Active (24h)" value={formatNumber(metrics.active24h)} accent="bg-emerald-600" />
      <MetricCard icon={DollarSign} label="Revenue" value={formatCurrency(metrics.revenue)} trend="up" accent="bg-amber-600" />
      <MetricCard icon={Clock} label="Pending" value={formatNumber(metrics.pendingInvoices)} trend={metrics.pendingInvoices > 0 ? 'down' : undefined} accent="bg-rose-600" />
    </div>
  )
}
