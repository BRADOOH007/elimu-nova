"use client"

import { School, Users, DollarSign, Package, TrendingUp, TrendingDown } from "lucide-react"
import type { DashboardStats } from "@/types/super-admin"
import { AnimatedCounter } from "./animated-counter"

interface StatsCardsProps {
  stats: DashboardStats | null
  loading: boolean
}

const statConfigs = [
  {
    key: "schools" as const,
    title: "Total Schools",
    icon: School,
    gradient: "from-violet-500 to-indigo-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-600",
    borderColor: "border-violet-200/50",
  },
  {
    key: "users" as const,
    title: "Active Users",
    icon: Users,
    gradient: "from-blue-500 to-cyan-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-600",
    borderColor: "border-blue-200/50",
  },
  {
    key: "revenue" as const,
    title: "Revenue",
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-600",
    borderColor: "border-emerald-200/50",
  },
  {
    key: "packages" as const,
    title: "Active Packages",
    icon: Package,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    lightText: "text-amber-600",
    borderColor: "border-amber-200/50",
  },
]

function TrendBar({ change, isPositive }: { change: number; isPositive: boolean }) {
  const barWidth = Math.min(Math.abs(change), 100)
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isPositive ? "bg-emerald-400" : "bg-red-400"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-10 w-10 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-28 bg-gray-200 rounded" />
    </div>
  )
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statConfigs.map((cfg) => {
        const data = stats?.[cfg.key]
        const numericValue = data
          ? cfg.key === "revenue"
            ? parseInt(data.total.replace(/[^0-9]/g, "")) || 0
            : data.total
          : 0
        const displayValue = data
          ? cfg.key === "revenue"
            ? data.total
            : undefined
          : "—"
        const isPositive = data ? data.change >= 0 : false
        const showAnimated = cfg.key !== "revenue"

        return (
          <div
            key={cfg.key}
            className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{cfg.title}</span>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}>
                <cfg.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1.5 font-mono tracking-tight">
              {showAnimated && data ? (
                <AnimatedCounter value={numericValue} />
              ) : (
                displayValue
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {data && (
                <>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    isPositive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(data.change)}%
                  </span>
                  <span className="text-xs text-gray-400">{data.changeText}</span>
                </>
              )}
            </div>
            {data && <TrendBar change={data.change} isPositive={isPositive} />}
          </div>
        )
      })}
    </div>
  )
}
