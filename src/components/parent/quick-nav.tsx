"use client"

import { Users, TrendingUp, ClipboardList, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"

const navItems = [
  { href: "/parent/children", icon: Users, label: "My Children", color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/parent/progress", icon: TrendingUp, label: "Progress", color: "text-green-600", bg: "bg-green-50" },
  { href: "/parent/assignments", icon: ClipboardList, label: "Assignments", color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/parent/schedule", icon: Calendar, label: "Schedule", color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/parent/messages", icon: BookOpen, label: "Messages", color: "text-amber-600", bg: "bg-amber-50" },
]

export default function QuickNav() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {navItems.map(item => (
        <Link key={item.href} href={item.href}>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer text-center">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-2`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-sm font-medium text-slate-700">{item.label}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
