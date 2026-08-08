"use client"

import { Users, TrendingUp, ClipboardList, Calendar, MessageSquare, type LucideIcon } from "lucide-react"
import Link from "next/link"

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  gradient: string
  desc: string
}

const navItems: NavItem[] = [
  { href: "/parent/children",   icon: Users,         label: "My Children",   gradient: "from-blue-500 to-indigo-600",       desc: "View profiles & stats" },
  { href: "/parent/progress",   icon: TrendingUp,    label: "Progress",      gradient: "from-emerald-500 to-teal-600",     desc: "Grades & AI insights" },
  { href: "/parent/assignments",icon: ClipboardList, label: "Assignments",   gradient: "from-violet-500 to-purple-600",    desc: "Homework & tasks" },
  { href: "/parent/schedule",   icon: Calendar,      label: "Schedule",      gradient: "from-rose-500 to-pink-600",        desc: "Classes & events" },
  { href: "/parent/messages",   icon: MessageSquare, label: "Messages",      gradient: "from-amber-500 to-orange-600",     desc: "Talk to teachers" },
]

export default function QuickNav() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {navItems.map(item => (
        <Link key={item.href} href={item.href}>
            <div className="group bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-center min-h-[110px] flex flex-col items-center justify-center">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2.5 shadow-sm group-hover:shadow-md transition-shadow shrink-0`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-800 truncate w-full">{item.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate w-full">{item.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
