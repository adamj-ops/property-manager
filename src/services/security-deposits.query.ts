import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getSecurityDeposits,
  getSecurityDeposit,
  getDepositStats,
  recordInterestPayment,
  processDepositRefund,
  createDisposition,
} from '~/services/security-deposits.api'
import { paymentKeys } from '~/services/payments.query'
import { leaseKeys } from '~/services/leases.query'
import type {
  DepositFilters,
  MarkInterestPaidInput,
  ProcessRefundInput,
  CreateDispositionInput,
} from '~/services/security-deposits.schema'

// Query keys
export const depositKeys = {
  all: ['security-deposits'] as const,
  lists: () => [...depositKeys.all, 'list'] as const,
  list: (filters: DepositFilters) => [...depositKeys.lists(), filters] as const,
  details: () => [...depositKeys.all, 'detail'] as const,
  detail: (leaseId: string) => [...depositKeys.details(), leaseId] as const,
  stats: () => [...depositKeys.all, 'stats'] as const,
}

// Default filters
const defaultDepositFilters: Pick<DepositFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const depositsQueryOptions = (filters: Partial<DepositFilters> = {}) => {
  const mergedFilters: DepositFilters = { ...defaultDepositFilters, ...filters }
  return queryOptions({
    queryKey: depositKeys.list(mergedFilters),
    queryFn: () => getSecurityDeposits({ data: mergedFilters }),
  })
}

export const depositQueryOptions = (leaseId: string) =>
  queryOptions({
    queryKey: depositKeys.detail(leaseId),
    queryFn: () => getSecurityDeposit({ data: { leaseId } }),
  })

export const depositStatsQueryOptions = () =>
  queryOptions({
    queryKey: depositKeys.stats(),
    queryFn: () => getDepositStats(),
  })

// Hooks
export const useDepositsQuery = (filters: Partial<DepositFilters> = {}) => {
  return useSuspenseQuery(depositsQueryOptions(filters))
}

export const useDepositQuery = (leaseId: string) => {
  return useSuspenseQuery(depositQueryOptions(leaseId))
}

export const useDepositStatsQuery = () => {
  return useSuspenseQuery(depositStatsQueryOptions())
}

// Mutations
export const useRecordInterestPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MarkInterestPaidInput) => recordInterestPayment({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.detail(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.stats() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.leaseId) })
    },
  })
}

export const useProcessDepositRefund = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProcessRefundInput) => processDepositRefund({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.detail(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.stats() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.leaseId) })
    },
  })
}

export const useCreateDisposition = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDispositionInput) => createDisposition({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.detail(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.stats() })
    },
  })
}
