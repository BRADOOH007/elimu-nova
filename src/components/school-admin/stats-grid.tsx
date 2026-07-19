"use client"

import { GraduationCap, Users, BookOpen, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatItem {
  value: number
  change: string
}

interface SchoolAdminStats {
  totalTeachers: StatItem
  totalStudents: StatItem
  activeClasses: StatItem
  monthlyRevenue: StatItem
  activeTeachers: StatItem
}

interface StatsGridProps {
  stats: SchoolAdminStats | null
  formatCurrency: (amount: number) => string
}

const statConfig = [
  { key: "totalTeachers" as const, label: "Total Teachers", icon: GraduationCap, color: "from-blue-500 to-purple-600" },
  { key: "totalStudents" as const, label: "Total Students", icon: Users, color: "from-purple-500 to-pink-600" },
  { key: "activeClasses" as const, label: "Active Classes", icon: BookOpen, color: "from-pink-500 to-rose-600" },
  { key: "monthlyRevenue" as const, label: "Monthly Revenue", icon: DollarSign, color: "from-rose-500 to-red-600" },
]

export default function StatsGrid({ stats, formatCurrency }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {statConfig.map(({ key, label, icon: Icon, color }) => {
        const s = stats?.[key]
        const value = s ? (key === "monthlyRevenue" ? formatCurrency(s.value) : s.value.toString()) : "0"
        return (
          <Card key={key} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg group hover:scale-105 transition-all duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">{label}</CardTitle>
              <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1 break-words">{value}</div>
              <p className="text-xs text-gray-500">{s?.change || "Loading..."}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
