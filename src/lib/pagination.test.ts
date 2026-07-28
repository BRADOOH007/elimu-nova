import { describe, it, expect } from 'vitest'
import { parsePagination, buildPaginationMeta, paginate } from '@/lib/pagination'

describe('parsePagination', () => {
  it('returns defaults when no params', () => {
    const params = parsePagination(new URLSearchParams())
    expect(params.page).toBe(1)
    expect(params.pageSize).toBe(50)
  })

  it('parses page and pageSize from params', () => {
    const params = parsePagination(new URLSearchParams('page=3&pageSize=20'))
    expect(params.page).toBe(3)
    expect(params.pageSize).toBe(20)
  })

  it('clamps pageSize to max 200', () => {
    const params = parsePagination(new URLSearchParams('pageSize=500'))
    expect(params.pageSize).toBe(200)
  })

  it('clamps page to minimum 1', () => {
    const params = parsePagination(new URLSearchParams('page=0'))
    expect(params.page).toBe(1)
  })
})

describe('buildPaginationMeta', () => {
  it('calculates total pages correctly', () => {
    const meta = buildPaginationMeta(100, { page: 1, pageSize: 20 })
    expect(meta.total).toBe(100)
    expect(meta.totalPages).toBe(5)
  })

  it('rounds up partial pages', () => {
    const meta = buildPaginationMeta(101, { page: 1, pageSize: 20 })
    expect(meta.totalPages).toBe(6)
  })

  it('returns 0 totalPages when total is 0', () => {
    const meta = buildPaginationMeta(0, { page: 1, pageSize: 20 })
    expect(meta.totalPages).toBe(0)
  })
})

describe('paginate', () => {
  it('returns data with pagination', () => {
    const result = paginate(['a', 'b', 'c'], 3, { page: 1, pageSize: 10 })
    expect(result.data).toEqual(['a', 'b', 'c'])
    expect(result.pagination.total).toBe(3)
    expect(result.pagination.page).toBe(1)
  })
})
