export const shimmer =
  'bg-gradient-to-r from-slate-100 via-purple-50/70 to-slate-100 bg-[length:200%_100%] animate-shimmer'

export function ShimmerBlock({ className = '' }: { className?: string }) {
  return <div className={`${shimmer} ${className}`} aria-hidden="true" />
}

export function HeaderSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="space-y-2">
      <ShimmerBlock className="h-8 w-64 rounded-lg" />
      {subtitle && <ShimmerBlock className="h-4 w-96 max-w-full rounded-md" />}
    </div>
  )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-3 w-20 rounded-md" />
              <ShimmerBlock className="h-5 w-12 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ContentCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 space-y-2">
        <ShimmerBlock className="h-5 w-40 rounded-md" />
        <ShimmerBlock className="h-3 w-24 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <ShimmerBlock key={i} className={`h-4 rounded-md ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <ShimmerBlock className="h-9 w-24 rounded-xl" />
        <ShimmerBlock className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3">
          <ShimmerBlock className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-3.5 w-2/5 rounded-md" />
            <ShimmerBlock className="h-3 w-1/3 rounded-md" />
          </div>
          <ShimmerBlock className="h-6 w-20 rounded-full shrink-0" />
          <ShimmerBlock className="hidden sm:block h-8 w-16 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  )
}
