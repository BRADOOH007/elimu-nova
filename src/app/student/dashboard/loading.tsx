import { ShimmerBlock, StatsGridSkeleton, ContentCardSkeleton, TableRowsSkeleton } from '@/components/ui/skeletons'

export default function StudentDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Top greeting */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <ShimmerBlock className="h-3 w-32 rounded-md" />
            <ShimmerBlock className="h-7 w-60 rounded-lg" />
            <ShimmerBlock className="h-4 w-44 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <ShimmerBlock className="h-9 w-28 rounded-full" />
            <ShimmerBlock className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <StatsGridSkeleton count={4} />

      {/* Learning area grid + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ContentCardSkeleton lines={3} />
          <ContentCardSkeleton lines={2} />
        </div>
        <div className="space-y-5">
          <ContentCardSkeleton lines={4} />
          <TableRowsSkeleton rows={3} />
        </div>
      </div>
    </div>
  )
}
