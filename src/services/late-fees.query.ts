import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  calculateLateFee,
  applyLateFee,
  waiveLateFee,
  getLateFees,
  getLateFeeStats,
  checkAndApplyLateFees,
} from '~/services/late-fees.api'
import { paymentKeys } from '~/services/payments.query'
import { leaseKeys } from '~/services/leases.query'
import type {
  CalculateLateFeeInput,
  ApplyLateFeeInput,
  WaiveLateFeeInput,
  LateFeeFilters,
  BulkLateFeeCheckInput,
} from '~/services/late-fees.schema'

// Query keys
export const lateFeeKeys = {
  all: ['late-fees'] as const,
  calculation: (leaseId: string, forMonth?: Date) =>
    [...lateFeeKeys.all, 'calculation', leaseId, forMonth?.toISOString()] as const,
  lists: () => [...lateFeeKeys.all, 'list'] as const,
  list: (filters: LateFeeFilters) => [...lateFeeKeys.lists(), filters] as const,
  stats: () => [...lateFeeKeys.all, 'stats'] as const,
}

// Default filters
const defaultLateFeeFilters: Pick<LateFeeFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const lateFeeCalculationQueryOptions = (input: CalculateLateFeeInput) =>
  queryOptions({
    queryKey: lateFeeKeys.calculation(input.leaseId, input.forMonth),
    queryFn: () => calculateLateFee({ data: input }),
  })

export const lateFeesQueryOptions = (filters: Partial<LateFeeFilters> = {}) => {
  const mergedFilters: LateFeeFilters = { ...defaultLateFeeFilters, ...filters }
  return queryOptions({
    queryKey: lateFeeKeys.list(mergedFilters),
    queryFn: () => getLateFees({ data: mergedFilters }),
  })
}

export const lateFeeStatsQueryOptions = () =>
  queryOptions({
    queryKey: lateFeeKeys.stats(),
    queryFn: () => getLateFeeStats(),
  })

// Hooks
export const useLateFeeCalculationQuery = (input: CalculateLateFeeInput) => {
  return useSuspenseQuery(lateFeeCalculationQueryOptions(input))
}

export const useLateFeesQuery = (filters: Partial<LateFeeFilters> = {}) => {
  return useSuspenseQuery(lateFeesQueryOptions(filters))
}

export const useLateFeeStatsQuery = () => {
  return useSuspenseQuery(lateFeeStatsQueryOptions())
}

// Mutations
export const useApplyLateFee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApplyLateFeeInput) => applyLateFee({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lateFeeKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.leaseId) })
    },
  })
}

export const useWaiveLateFee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WaiveLateFeeInput) => waiveLateFee({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lateFeeKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

export const useCheckAndApplyLateFees = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkLateFeeCheckInput) => checkAndApplyLateFees({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lateFeeKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
