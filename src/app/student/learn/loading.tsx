import { ShimmerBlock, ContentCardSkeleton, TableRowsSkeleton } from '@/components/ui/skeletons'

export default function StudentLearnLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-28 rounded-md bg-white/25" />
              <div className="h-8 w-64 rounded-lg bg-white/35" />
              <div className="h-4 w-72 rounded-md bg-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded-full bg-white/20" />
              <div className="h-8 w-20 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="mt-6 h-24 rounded-2xl border border-white/15 bg-white/10" />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-6">
            <div className="flex items-center gap-2">
              <ShimmerBlock className="h-8 w-8 rounded-lg" />
              <ShimmerBlock className="h-6 w-56 rounded-md" />
            </div>

            {/* Subject / Grade selector dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <ShimmerBlock className="h-3 w-12 rounded-md" />
                <ShimmerBlock className="h-9 w-full rounded-2xl" />
              </div>
              <div className="space-y-2">
                <ShimmerBlock className="h-3 w-12 rounded-md" />
                <ShimmerBlock className="h-9 w-full rounded-2xl" />
              </div>
            </div>

            {/* Curriculum strand cards */}
            <TableRowsSkeleton rows={6} />
          </div>

          <div className="hidden lg:block space-y-6">
            <ContentCardSkeleton lines={4} />
          </div>
        </div>
      </main>
    </div>
  )
}
