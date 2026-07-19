"use client"

import { Users, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface StatCard {
  label: string
  value: string | number
  icon: any
  color: string
  bg: string
  href?: string
}

export default function ParentStatsCards({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}

export function ParentStatCard({ label, value, icon: Icon, color, bg, href }: StatCard) {
  const content = (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
  if (href) return <Link key={label} href={href}>{content}</Link>
  return <div key={label}>{content}</div>
}
