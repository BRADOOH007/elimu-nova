// ──────────────────────────────────────────────────────────────
// Pagination utility for list endpoints.
// All paginated GET routes return { data, pagination } shape.
//
// Usage:
//   const pg = parsePagination(searchParams)        // page=1, pageSize=50
//   const [items, total] = await Promise.all([
//     prisma.student.findMany({ skip, take, ... }),
//     prisma.student.count({ ... }),
//   ])
//   return NextResponse.json(paginate(items, total, pg))
// ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function parsePagination(searchParams: URLSearchParams, defaults = { page: 1, pageSize: 50 }): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page), 10) || defaults.page)
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || String(defaults.pageSize), 10) || defaults.pageSize))
  return { page, pageSize }
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize),
  }
}

export function paginate<T>(items: T[], total: number, params: PaginationParams) {
  return {
    data: items,
    pagination: buildPaginationMeta(total, params),
  }
}
