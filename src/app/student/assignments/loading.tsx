import { ShimmerBlock, HeaderSkeleton, ContentCardSkeleton } from '@/components/ui/skeletons'

export default function AssignmentsLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <HeaderSkeleton subtitle />

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <ShimmerBlock className="h-10 flex-1 rounded-xl" />
          <ShimmerBlock className="h-10 w-full md:w-40 rounded-xl" />
          <ShimmerBlock className="h-10 w-full md:w-40 rounded-xl" />
        </div>
      </div>

      {/* Assignment cards */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ContentCardSkeleton key={i} lines={2} />
        ))}
      </div>
    </div>
  )
}
