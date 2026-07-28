"use client"

import Link from "next/link"
import { type LucideIcon } from "lucide-react"

interface StatCard {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  href?: string
  trend?: { dir: "up" | "down" | "neutral"; text: string }
}

export function ParentStatCard({ label, value, icon: Icon, color, href, trend }: StatCard) {
  const content = (
    <div className="group relative bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl ${color.replace("text-", "bg-").replace("600", "50")} flex items-center justify-center ring-1 ring-black/5`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {trend && (
        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
          {trend.text}
        </p>
      )}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/0 group-hover:ring-blue-500/20 transition-all pointer-events-none" />
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}
