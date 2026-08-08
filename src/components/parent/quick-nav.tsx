"use client"

import { Users, TrendingUp, ClipboardList, Calendar, MessageSquare, CreditCard, type LucideIcon } from "lucide-react"
import Link from "next/link"

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  sublabel: string
  gradient: string
}

const navItems: NavItem[] = [
  { href: "/parent/children",    icon: Users,         label: "My Children",            sublabel: "Profiles & stats",     gradient: "from-blue-500 to-indigo-600" },
  { href: "/parent/progress",    icon: TrendingUp,    label: "Progress & Grades",      sublabel: "AI insights & reports", gradient: "from-emerald-500 to-teal-600" },
  { href: "/parent/assignments", icon: ClipboardList, label: "Homework & Tasks",       sublabel: "Assignments & due dates", gradient: "from-violet-500 to-purple-600" },
  { href: "/parent/schedule",    icon: Calendar,      label: "Class Schedule",         sublabel: "Timetable & events",    gradient: "from-rose-500 to-pink-600" },
  { href: "/parent/messages",    icon: MessageSquare, label: "Message Teacher",        sublabel: "Direct communication",  gradient: "from-amber-500 to-orange-600" },
  { href: "/parent/billing",     icon: CreditCard,    label: "Fee & Billing",          sublabel: "Payments & invoices",   gradient: "from-cyan-500 to-blue-600" },
]

export default function QuickNav() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {navItems.map(item => (
        <Link key={item.href} href={item.href}>
          <div className="group bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col items-center justify-center text-center h-auto min-h-[90px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-shadow shrink-0`}>
              <item.icon className="h-4.5 w-4.5 text-white" />
            </div>
            <p className="text-[11px] font-semibold text-slate-800 leading-tight truncate w-full">{item.label}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate w-full leading-tight">{item.sublabel}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
