/**
 * Pagination Utilities Unit Tests
 *
 * Tests pagination helper functions
 */

import { describe, expect, it } from 'vitest'

import {
  buildPaginationQuery,
  cursorPaginatedResponse,
  getNextPageParams,
  getPrevPageParams,
  offsetToPage,
  pageToOffset,
  paginatedResponse,
  parsePagination,
  toPrismaArgs,
  toPrismaOrderBy,
  toPrismaQueryArgs,
} from '~/server/pagination'

describe('parsePagination', () => {
  it('returns default values when no params provided', () => {
    const result = parsePagination({})

    expect(result.limit).toBe(20)
    expect(result.offset).toBe(0)
  })

  it('respects provided values within bounds', () => {
    const result = parsePagination({ limit: 50, offset: 100 })

    expect(result.limit).toBe(50)
    expect(result.offset).toBe(100)
  })

  it('clamps limit to maximum of 100', () => {
    const result = parsePagination({ limit: 200 })

    expect(result.limit).toBe(100)
  })

  it('clamps limit to minimum of 1', () => {
    // Note: The implementation uses Math.max(params.limit || 20, 1)
    // So 0 is falsy and defaults to 20, while negative numbers get clamped to 1
    const result = parsePagination({ limit: 0 })
    expect(result.limit).toBe(20) // 0 is falsy, falls back to default 20

    const result2 = parsePagination({ limit: -5 })
    expect(result2.limit).toBe(1) // Negative numbers get clamped to 1
  })

  it('clamps offset to minimum of 0', () => {
    const result = parsePagination({ offset: -10 })

    expect(result.offset).toBe(0)
  })
})

describe('paginatedResponse', () => {
  const sampleData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ]

  it('creates correct paginated response structure', () => {
    const result = paginatedResponse(sampleData, 100, { limit: 10, offset: 0 })

    expect(result.data).toEqual(sampleData)
    expect(result.pagination).toEqual({
      total: 100,
      limit: 10,
      offset: 0,
      hasMore: true,
      totalPages: 10,
      currentPage: 1,
    })
  })

  it('calculates hasMore correctly when at end', () => {
    const result = paginatedResponse(sampleData, 3, { limit: 10, offset: 0 })

    expect(result.pagination.hasMore).toBe(false)
  })

  it('calculates hasMore correctly when more data available', () => {
    const result = paginatedResponse(sampleData, 10, { limit: 3, offset: 0 })

    expect(result.pagination.hasMore).toBe(true)
  })

  it('calculates current page correctly', () => {
    expect(
      paginatedResponse(sampleData, 100, { limit: 10, offset: 0 }).pagination.currentPage
    ).toBe(1)

    expect(
      paginatedResponse(sampleData, 100, { limit: 10, offset: 10 }).pagination.currentPage
    ).toBe(2)

    expect(
      paginatedResponse(sampleData, 100, { limit: 10, offset: 90 }).pagination.currentPage
    ).toBe(10)
  })

  it('calculates total pages correctly', () => {
    expect(
      paginatedResponse(sampleData, 100, { limit: 10, offset: 0 }).pagination.totalPages
    ).toBe(10)

    expect(
      paginatedResponse(sampleData, 95, { limit: 10, offset: 0 }).pagination.totalPages
    ).toBe(10)

    expect(
      paginatedResponse(sampleData, 1, { limit: 10, offset: 0 }).pagination.totalPages
    ).toBe(1)
  })
})

describe('cursorPaginatedResponse', () => {
  const sampleData = [
    { id: 'abc-1', name: 'Item 1' },
    { id: 'abc-2', name: 'Item 2' },
    { id: 'abc-3', name: 'Item 3' },
  ]

  it('creates correct cursor-based response', () => {
    const result = cursorPaginatedResponse(
      sampleData,
      { limit: 10, direction: 'forward' },
      true
    )

    expect(result.data).toEqual(sampleData)
    expect(result.pagination).toEqual({
      limit: 10,
      nextCursor: 'abc-3',
      prevCursor: 'abc-1',
      hasMore: true,
    })
  })

  it('returns null nextCursor when no more data', () => {
    const result = cursorPaginatedResponse(
      sampleData,
      { limit: 10, direction: 'forward' },
      false
    )

    expect(result.pagination.nextCursor).toBeNull()
    expect(result.pagination.hasMore).toBe(false)
  })

  it('handles empty data array', () => {
    const result = cursorPaginatedResponse(
      [],
      { limit: 10, direction: 'forward' },
      false
    )

    expect(result.pagination.nextCursor).toBeNull()
    expect(result.pagination.prevCursor).toBeNull()
  })
})

describe('pageToOffset', () => {
  it('converts page 1 to offset 0', () => {
    expect(pageToOffset(1, 10)).toBe(0)
  })

  it('converts page 2 to offset equal to limit', () => {
    expect(pageToOffset(2, 10)).toBe(10)
    expect(pageToOffset(2, 25)).toBe(25)
  })

  it('calculates offset for any page', () => {
    expect(pageToOffset(5, 10)).toBe(40)
    expect(pageToOffset(10, 20)).toBe(180)
  })

  it('handles page 0 as page 1', () => {
    expect(pageToOffset(0, 10)).toBe(0)
  })

  it('handles negative page numbers', () => {
    expect(pageToOffset(-1, 10)).toBe(0)
  })
})

describe('offsetToPage', () => {
  it('converts offset 0 to page 1', () => {
    expect(offsetToPage(0, 10)).toBe(1)
  })

  it('calculates correct page for offset at page boundary', () => {
    expect(offsetToPage(10, 10)).toBe(2)
    expect(offsetToPage(20, 10)).toBe(3)
  })

  it('calculates correct page for offset within a page', () => {
    expect(offsetToPage(5, 10)).toBe(1)
    expect(offsetToPage(15, 10)).toBe(2)
    expect(offsetToPage(25, 10)).toBe(3)
  })
})

describe('toPrismaArgs', () => {
  it('converts pagination params to Prisma take/skip', () => {
    const result = toPrismaArgs({ limit: 20, offset: 40 })

    expect(result).toEqual({
      take: 20,
      skip: 40,
    })
  })
})

describe('toPrismaOrderBy', () => {
  const allowedFields = ['createdAt', 'updatedAt', 'name']

  it('uses provided field when allowed', () => {
    const result = toPrismaOrderBy(
      { sortBy: 'name', sortOrder: 'asc' },
      allowedFields
    )

    expect(result).toEqual({ name: 'asc' })
  })

  it('falls back to default field when sortBy not allowed', () => {
    const result = toPrismaOrderBy(
      { sortBy: 'invalidField', sortOrder: 'desc' },
      allowedFields
    )

    expect(result).toEqual({ createdAt: 'desc' })
  })

  it('uses provided default field', () => {
    const result = toPrismaOrderBy(
      { sortBy: 'invalidField', sortOrder: 'asc' },
      allowedFields,
      'updatedAt'
    )

    expect(result).toEqual({ updatedAt: 'asc' })
  })

  it('uses default field when sortBy is undefined', () => {
    const result = toPrismaOrderBy(
      { sortOrder: 'desc' },
      allowedFields
    )

    expect(result).toEqual({ createdAt: 'desc' })
  })
})

describe('toPrismaQueryArgs', () => {
  it('combines pagination and sorting args', () => {
    const result = toPrismaQueryArgs(
      { limit: 25, offset: 50 },
      { sortBy: 'name', sortOrder: 'asc' },
      ['name', 'createdAt']
    )

    expect(result).toEqual({
      take: 25,
      skip: 50,
      orderBy: { name: 'asc' },
    })
  })
})

describe('buildPaginationQuery', () => {
  it('builds URL query string', () => {
    const result = buildPaginationQuery({ limit: 20, offset: 40 })

    expect(result).toBe('limit=20&offset=40')
  })
})

describe('getNextPageParams', () => {
  it('returns next page params when more data available', () => {
    const result = getNextPageParams({ limit: 10, offset: 0 }, 50)

    expect(result).toEqual({ limit: 10, offset: 10 })
  })

  it('returns null when at last page', () => {
    const result = getNextPageParams({ limit: 10, offset: 40 }, 50)

    expect(result).toBeNull()
  })

  it('returns null when beyond total', () => {
    const result = getNextPageParams({ limit: 10, offset: 50 }, 50)

    expect(result).toBeNull()
  })
})

describe('getPrevPageParams', () => {
  it('returns previous page params when not at first page', () => {
    const result = getPrevPageParams({ limit: 10, offset: 20 })

    expect(result).toEqual({ limit: 10, offset: 10 })
  })

  it('returns null when at first page', () => {
    const result = getPrevPageParams({ limit: 10, offset: 0 })

    expect(result).toBeNull()
  })

  it('clamps to offset 0 when going negative', () => {
    const result = getPrevPageParams({ limit: 10, offset: 5 })

    expect(result).toEqual({ limit: 10, offset: 0 })
  })
})

