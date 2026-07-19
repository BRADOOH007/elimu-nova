"use client"

import { School, Eye, Loader2, Building2, Calendar, Users as UsersIcon, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { RecentSchool } from "@/types/super-admin"

interface RecentSchoolsSectionProps {
  schools: RecentSchool[]
  loading: boolean
  onSchoolClick: (id: string) => void
}

function SchoolAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
  ]
  const colorIndex = name.length % colors.length
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  )
}

function SchoolSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-4 rounded-xl bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="text-right space-y-1">
        <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
        <div className="h-5 w-14 bg-gray-200 rounded ml-auto" />
      </div>
    </div>
  )
}

export function RecentSchoolsSection({ schools, loading, onSchoolClick }: RecentSchoolsSectionProps) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Recent Schools</h3>
          {!loading && schools.length > 0 && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{schools.length}</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/super-admin/schools")}
          className="text-xs h-8"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View All
        </Button>
      </div>
      <p className="text-xs text-gray-400 mb-5">Latest school registrations and activity</p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SchoolSkeleton key={i} />)}
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center py-12">
          <School className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No schools found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schools.map((school, index) => (
            <button
              key={school.id}
              onClick={() => onSchoolClick(school.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-violet-50/50 hover:border-violet-200/30 transition-all duration-200 text-left group cursor-pointer border border-transparent"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <SchoolAvatar name={school.name} />
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-violet-600 transition-colors">
                    {school.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{school.admin}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(school.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <UsersIcon className="w-3 h-3" />
                      {school.students}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{school.revenue}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  school.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    : "bg-amber-50 text-amber-700 border border-amber-200/50"
                }`}>
                  {school.status}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
