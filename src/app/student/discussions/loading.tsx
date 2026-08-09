import { ShimmerBlock } from '@/components/ui/skeletons'

export default function DiscussionsLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Active presence bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-4">
        <ShimmerBlock className="h-7 w-48 rounded-lg" />
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-8 w-24 rounded-full" />
          <ShimmerBlock className="h-8 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 pb-4">
        <div className="flex -space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-8 w-8 rounded-full border-2 border-white" />
          ))}
        </div>
        <ShimmerBlock className="h-4 w-36 rounded-md" />
      </div>

      {/* Chat message thread */}
      <div className="flex-1 overflow-hidden mx-4 sm:mx-6 mb-2 p-4 space-y-4 bg-slate-50/60 rounded-3xl border border-slate-200/80">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
            <ShimmerBlock className="h-9 w-9 rounded-full shrink-0" />
            <div className={`space-y-2 max-w-[80%] ${i % 2 === 1 ? 'flex flex-col items-end' : ''}`}>
              <ShimmerBlock className="h-3 w-28 rounded-md" />
              <ShimmerBlock className={`h-16 rounded-2xl ${i % 2 === 1 ? 'w-56' : 'w-64'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Message composer */}
      <div className="p-4">
        <ShimmerBlock className="h-12 w-full rounded-full" />
      </div>
    </div>
  )
}
