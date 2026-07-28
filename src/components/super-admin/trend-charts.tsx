'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendsData {
  revenue30d: { date: string; revenue: number }[]
  schoolSignups: { week: string; count: number }[]
  userGrowth: { date: string; count: number }[]
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-4 h-64">
      <div className="h-4 w-32 bg-white/10 rounded mb-4" />
      <div className="h-48 bg-white/5 rounded" />
    </div>
  )
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <Minus className="w-3 h-3 text-slate-500" />
  const pct = ((current - previous) / previous * 100).toFixed(1)
  const isUp = current >= previous
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct}%
    </span>
  )
}

export function TrendCharts() {
  const [data, setData] = useState<TrendsData | null>(null)

  useEffect(() => {
    fetch('/api/super-admin/trends')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return <ChartSkeleton />

  const revenueTotal = data.revenue30d.reduce((s, d) => s + d.revenue, 0)
  const prevRevenueTotal = data.revenue30d.slice(0, -1).reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Revenue 30d */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Revenue (30d)</p>
            <p className="text-lg font-bold text-white">${revenueTotal.toLocaleString()}</p>
          </div>
          <TrendBadge current={revenueTotal} previous={prevRevenueTotal} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.revenue30d}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* School Signups */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">School Signups (12w)</p>
            <p className="text-lg font-bold text-white">{data.schoolSignups.reduce((s, d) => s + d.count, 0)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.schoolSignups}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Growth */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User Growth (30d)</p>
            <p className="text-lg font-bold text-white">{data.userGrowth[data.userGrowth.length - 1]?.count.toLocaleString() || 0}</p>
          </div>
          <TrendBadge
            current={data.userGrowth[data.userGrowth.length - 1]?.count || 0}
            previous={data.userGrowth[0]?.count || 0}
          />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.userGrowth}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#userGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
