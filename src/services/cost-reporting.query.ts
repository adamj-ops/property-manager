import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import {
  getCostSummary,
  getCostsByProperty,
  getCostsByCategory,
  getCostsByVendor,
  getCostsByPeriod,
  getTopExpensiveRequests,
} from '~/services/cost-reporting.api'
import type {
  CostReportingFilters,
  CostByPeriodInput,
} from '~/services/cost-reporting.schema'

// Query keys
export const costReportingKeys = {
  all: ['cost-reporting'] as const,
  summary: (filters: CostReportingFilters) => [...costReportingKeys.all, 'summary', filters] as const,
  byProperty: (filters: CostReportingFilters) => [...costReportingKeys.all, 'by-property', filters] as const,
  byCategory: (filters: CostReportingFilters) => [...costReportingKeys.all, 'by-category', filters] as const,
  byVendor: (filters: CostReportingFilters) => [...costReportingKeys.all, 'by-vendor', filters] as const,
  byPeriod: (filters: CostByPeriodInput) => [...costReportingKeys.all, 'by-period', filters] as const,
  topExpensive: (filters: CostReportingFilters & { limit?: number }) =>
    [...costReportingKeys.all, 'top-expensive', filters] as const,
}

// Query options
export const costSummaryQueryOptions = (filters: CostReportingFilters = {}) =>
  queryOptions({
    queryKey: costReportingKeys.summary(filters),
    queryFn: () => getCostSummary({ data: filters }),
  })

export const costsByPropertyQueryOptions = (filters: CostReportingFilters = {}) =>
  queryOptions({
    queryKey: costReportingKeys.byProperty(filters),
    queryFn: () => getCostsByProperty({ data: filters }),
  })

export const costsByCategoryQueryOptions = (filters: CostReportingFilters = {}) =>
  queryOptions({
    queryKey: costReportingKeys.byCategory(filters),
    queryFn: () => getCostsByCategory({ data: filters }),
  })

export const costsByVendorQueryOptions = (filters: CostReportingFilters = {}) =>
  queryOptions({
    queryKey: costReportingKeys.byVendor(filters),
    queryFn: () => getCostsByVendor({ data: filters }),
  })

export const costsByPeriodQueryOptions = (filters: CostByPeriodInput) =>
  queryOptions({
    queryKey: costReportingKeys.byPeriod(filters),
    queryFn: () => getCostsByPeriod({ data: filters }),
  })

export const topExpensiveRequestsQueryOptions = (
  filters: CostReportingFilters & { limit?: number } = {}
) =>
  queryOptions({
    queryKey: costReportingKeys.topExpensive(filters),
    queryFn: () => getTopExpensiveRequests({ data: { ...filters, limit: filters.limit ?? 10 } }),
  })

// Suspense hooks
export const useCostSummaryQuery = (filters: CostReportingFilters = {}) =>
  useSuspenseQuery(costSummaryQueryOptions(filters))

export const useCostsByPropertyQuery = (filters: CostReportingFilters = {}) =>
  useSuspenseQuery(costsByPropertyQueryOptions(filters))

export const useCostsByCategoryQuery = (filters: CostReportingFilters = {}) =>
  useSuspenseQuery(costsByCategoryQueryOptions(filters))

export const useCostsByVendorQuery = (filters: CostReportingFilters = {}) =>
  useSuspenseQuery(costsByVendorQueryOptions(filters))

export const useCostsByPeriodQuery = (filters: CostByPeriodInput) =>
  useSuspenseQuery(costsByPeriodQueryOptions(filters))

export const useTopExpensiveRequestsQuery = (
  filters: CostReportingFilters & { limit?: number } = {}
) => useSuspenseQuery(topExpensiveRequestsQueryOptions(filters))
