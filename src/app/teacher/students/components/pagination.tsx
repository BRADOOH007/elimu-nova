import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  totalStudents: number
  studentsCount: number
  onGoToPage: (page: number) => void
}

export function Pagination({ page, totalPages, totalStudents, studentsCount, onGoToPage }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-sm text-gray-600">
        Showing {studentsCount} of {totalStudents} students
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGoToPage(page - 1)}
          disabled={page <= 1}
          className="bg-white/70 border-0 shadow-sm"
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4))
          const p = start + i
          if (p > totalPages) return null
          return (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onGoToPage(p)}
              className={p === page ? 'bg-blue-600 text-white' : 'bg-white/70 border-0 shadow-sm'}
            >
              {p}
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGoToPage(page + 1)}
          disabled={page >= totalPages}
          className="bg-white/70 border-0 shadow-sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
