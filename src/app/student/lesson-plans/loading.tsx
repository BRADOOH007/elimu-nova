import { ShimmerBlock, HeaderSkeleton, ContentCardSkeleton } from '@/components/ui/skeletons'

export default function LessonPlansLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <HeaderSkeleton subtitle />

      {/* Tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Lesson catalog grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ContentCardSkeleton key={i} lines={3} />
        ))}
      </div>
    </div>
  )
}
