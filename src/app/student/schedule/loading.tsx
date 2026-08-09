import { ShimmerBlock, HeaderSkeleton } from '@/components/ui/skeletons'

export default function ScheduleLoading() {
  return (
    <div className="space-y-6 p-4">
      <HeaderSkeleton subtitle />

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <ShimmerBlock className="h-3 w-14 rounded-md" />
              <ShimmerBlock className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Class roster + teacher cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShimmerBlock className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <ShimmerBlock className="h-4 w-48 rounded-md" />
                  <ShimmerBlock className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <ShimmerBlock className="h-8 w-20 rounded-full shrink-0" />
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
              <ShimmerBlock className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <ShimmerBlock className="h-3 w-28 rounded-md" />
                <ShimmerBlock className="h-3 w-16 rounded-md" />
              </div>
              <ShimmerBlock className="h-8 w-24 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
