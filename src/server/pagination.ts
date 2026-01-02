/**
 * Pagination Utilities for Property Management Platform
 *
 * Provides consistent pagination patterns across all API endpoints.
 *
 * Usage:
 *   const { limit, offset, cursor } = parsePagination(data)
 *   const response = paginatedResponse(items, total, { limit, offset })
 */

import { z } from 'zod'

// =============================================================================
// PAGINATION SCHEMAS
// =============================================================================

/**
 * Standard offset-based pagination schema
 * Use with .merge() in your endpoint schemas
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

/**
 * Cursor-based pagination schema for large datasets
 */
export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  direction: z.enum(['forward', 'backward']).default('forward'),
})

/**
 * Sorting schema - commonly combined with pagination
 */
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Combined pagination and sorting schema
 */
export const paginatedSortedSchema = paginationSchema.merge(sortingSchema)

// =============================================================================
// PAGINATION TYPES
// =============================================================================

export interface PaginationParams {
  limit: number
  offset: number
}

export interface CursorPaginationParams {
  limit: number
  cursor?: string
  direction: 'forward' | 'backward'
}

export interface SortingParams {
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
    totalPages: number
    currentPage: number
  }
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  pagination: {
    limit: number
    nextCursor: string | null
    prevCursor: string | null
    hasMore: boolean
  }
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

/**
 * Parse and validate pagination parameters with defaults
 */
export function parsePagination(
  params: Partial<PaginationParams>
): PaginationParams {
  return {
    limit: Math.min(Math.max(params.limit || 20, 1), 100),
    offset: Math.max(params.offset || 0, 0),
  }
}

/**
 * Create a paginated response envelope
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { limit, offset } = params
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      totalPages,
      currentPage,
    },
  }
}

/**
 * Create a cursor-paginated response envelope
 */
export function cursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  params: CursorPaginationParams,
  hasMore: boolean
): CursorPaginatedResponse<T> {
  const { limit } = params
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null
  const prevCursor = data.length > 0 ? data[0].id : null

  return {
    data,
    pagination: {
      limit,
      nextCursor,
      prevCursor,
      hasMore,
    },
  }
}

/**
 * Convert page number to offset
 */
export function pageToOffset(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit)
}

/**
 * Convert offset to page number
 */
export function offsetToPage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1
}

// =============================================================================
// PRISMA HELPERS
// =============================================================================

/**
 * Convert pagination params to Prisma take/skip
 */
export function toPrismaArgs(params: PaginationParams): {
  take: number
  skip: number
} {
  return {
    take: params.limit,
    skip: params.offset,
  }
}

/**
 * Convert sorting params to Prisma orderBy
 * Only applies sorting if the field is in the allowed list
 */
export function toPrismaOrderBy(
  params: SortingParams,
  allowedFields: string[],
  defaultField = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field =
    params.sortBy && allowedFields.includes(params.sortBy)
      ? params.sortBy
      : defaultField
  return { [field]: params.sortOrder }
}

/**
 * Combined pagination and sorting to Prisma args
 */
export function toPrismaQueryArgs(
  pagination: PaginationParams,
  sorting: SortingParams,
  allowedSortFields: string[],
  defaultSortField = 'createdAt'
): {
  take: number
  skip: number
  orderBy: Record<string, 'asc' | 'desc'>
} {
  return {
    ...toPrismaArgs(pagination),
    orderBy: toPrismaOrderBy(sorting, allowedSortFields, defaultSortField),
  }
}

// =============================================================================
// URL HELPERS
// =============================================================================

/**
 * Build pagination query string
 */
export function buildPaginationQuery(params: PaginationParams): string {
  return new URLSearchParams({
    limit: params.limit.toString(),
    offset: params.offset.toString(),
  }).toString()
}

/**
 * Get next page params
 */
export function getNextPageParams(
  current: PaginationParams,
  total: number
): PaginationParams | null {
  const nextOffset = current.offset + current.limit
  if (nextOffset >= total) return null
  return { limit: current.limit, offset: nextOffset }
}

/**
 * Get previous page params
 */
export function getPrevPageParams(
  current: PaginationParams
): PaginationParams | null {
  if (current.offset === 0) return null
  const prevOffset = Math.max(0, current.offset - current.limit)
  return { limit: current.limit, offset: prevOffset }
}
