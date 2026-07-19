"use client"

import { Package, Eye, Loader2, TrendingUp, Users, DollarSign, Layers, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AnimatedCounter } from "./animated-counter"
import type { PackageOverviewData } from "@/types/super-admin"

interface PackageOverviewPanelProps {
  data: PackageOverviewData | null
  loading: boolean
}

function RadialProgress({ value, size = 60 }: { value: number; size?: number }) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = value >= 80 ? "text-emerald-500" : value >= 50 ? "text-amber-500" : "text-red-500"

  return (
    <svg width={size} height={size} className={`${color} -rotate-90`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-gray-900 text-[9px] font-bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value}%
      </text>
    </svg>
  )
}

function PackageSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-3 w-48 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-7 w-12 bg-gray-200 rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PackageOverviewPanel({ data, loading }: PackageOverviewPanelProps) {
  const router = useRouter()

  if (loading) return <PackageSkeleton />

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Package Overview</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/super-admin/packages")}
          className="text-xs h-8"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View All
        </Button>
      </div>
      <p className="text-xs text-gray-400 mb-5">Current subscription packages</p>

      {data && data.packages.length > 0 ? (
        <>
          {(() => {
            const pkg = data.packages[0]
            return (
              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                      {pkg.isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${pkg.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">per {pkg.duration} days</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">
                        <AnimatedCounter value={pkg.metrics.activeSubscriptions} />
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Schools</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
                      <Users className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">
                        <AnimatedCounter value={pkg.metrics.totalStudents} />
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Students</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900">${(pkg.metrics.monthlyRevenue / 1000).toFixed(1)}K</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Monthly</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <RadialProgress value={pkg.metrics.utilizationRate} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>{pkg.maxTeachers} teachers max</span>
                    <span>{pkg.maxStudents} students max</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    pkg.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {pkg.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {pkg.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Features</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.features.slice(0, 4).map((feature, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md">
                          <CheckCircle2 className="w-2.5 h-2.5 text-gray-400" />
                          {feature}
                        </span>
                      ))}
                      {pkg.features.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-md">
                          +{pkg.features.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {data.packages.length > 1 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              +{data.packages.length - 1} more package{data.packages.length > 2 ? "s" : ""} available
            </p>
          )}

          {data.summary && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    <AnimatedCounter value={data.summary.totalPackages} />
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Packages</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    <AnimatedCounter value={data.summary.totalActiveSubscriptions} />
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    ${(data.summary.totalMonthlyRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenue/mo</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No packages found</p>
          <p className="text-xs text-gray-400">Create your first package to get started</p>
        </div>
      )}
    </div>
  )
}
