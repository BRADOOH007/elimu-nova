'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { BrandLoader } from '@/components/ui/brand-loader'

interface DashboardSkeletonProps {
  variant?: 'student' | 'admin'
  loadingLabel?: string
}

export default function DashboardSkeleton({
  variant = 'student',
  loadingLabel,
}: DashboardSkeletonProps = {}) {
  const label = loadingLabel ?? (variant === 'admin' ? 'Loading dashboard statistics...' : 'Loading your dashboard...')
  if (variant === 'admin') return <AdminSkeleton loadingLabel={label} />
  return <StudentSkeleton loadingLabel={label} />
}

function SpinnerHeader({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm w-full max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-purple-50/40 pointer-events-none" />
        <div className="relative">
          <BrandLoader label={loadingLabel} />
        </div>
      </div>
    </div>
  )
}

function StudentSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6" aria-hidden="true">
      <SpinnerHeader loadingLabel={loadingLabel} />

      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-xl overflow-hidden">
        <div className="p-5 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="animate-pulse h-3 w-36 rounded-full bg-white/25" />
            <div className="animate-pulse h-7 w-52 md:w-64 rounded-lg bg-white/25" />
            <div className="flex items-center gap-4 pt-1">
              <div className="animate-pulse h-4 w-20 rounded-full bg-white/25" />
              <div className="animate-pulse h-4 w-24 rounded-full bg-white/25" />
              <div className="animate-pulse h-4 w-28 rounded-full bg-white/25" />
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-8 w-24 rounded-full bg-white/25" />
              <div className="animate-pulse h-9 w-36 rounded-xl bg-white/25" />
              <div className="animate-pulse h-9 w-9 rounded-full bg-white/25" />
            </div>
            <div className="animate-pulse hidden sm:block h-2 w-48 rounded-full bg-white/25" />
          </div>
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's Focus */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          </div>

          {/* My Learning Areas */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-lg" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-3 flex flex-col items-center justify-center gap-1.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            </div>
          </div>

          {/* Study Recommendations */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border-l-4 border-l-slate-200 p-3 rounded-r-lg space-y-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upcoming */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-5 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="animate-pulse h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-5 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6" aria-hidden="true">
      <SpinnerHeader loadingLabel={loadingLabel} />

      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>

      {/* Top: 4-card metric grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36 mt-2" />
          </div>
        ))}
      </div>

      {/* Main 3-column area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        {/* Left 2/3: AI Insights + Usage, Quick Actions, Teachers/Students */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Recent Teachers & Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {["Teachers", "Students"].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50/70 p-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1/3: Activity Log + Upcoming Meetings */}
        <div className="space-y-4 md:space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-2">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-2">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
