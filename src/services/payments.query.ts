import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getPayments,
  getPayment,
  getPaymentStats,
  getRentRoll,
  createPayment,
  updatePayment,
  deletePayment,
} from '~/services/payments.api'
import { tenantKeys } from '~/services/tenants.query'
import { leaseKeys } from '~/services/leases.query'
import type { CreatePaymentInput, UpdatePaymentInput, PaymentFilters } from '~/services/payments.schema'

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  stats: () => [...paymentKeys.all, 'stats'] as const,
  rentRoll: () => [...paymentKeys.all, 'rentRoll'] as const,
}

// Default filters
const defaultPaymentFilters: Pick<PaymentFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const paymentsQueryOptions = (filters: Partial<PaymentFilters> = {}) => {
  const mergedFilters: PaymentFilters = { ...defaultPaymentFilters, ...filters }
  return queryOptions({
    queryKey: paymentKeys.list(mergedFilters),
    queryFn: () => getPayments({ data: mergedFilters }),
  })
}

export const paymentQueryOptions = (id: string) =>
  queryOptions({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPayment({ data: { id } }),
  })

export const paymentStatsQueryOptions = () =>
  queryOptions({
    queryKey: paymentKeys.stats(),
    queryFn: () => getPaymentStats(),
  })

export const rentRollQueryOptions = () =>
  queryOptions({
    queryKey: paymentKeys.rentRoll(),
    queryFn: () => getRentRoll(),
  })

// Hooks
export const usePaymentsQuery = (filters: Partial<PaymentFilters> = {}) => {
  return useSuspenseQuery(paymentsQueryOptions(filters))
}

export const usePaymentQuery = (id: string) => {
  return useSuspenseQuery(paymentQueryOptions(id))
}

export const usePaymentStatsQuery = () => {
  return useSuspenseQuery(paymentStatsQueryOptions())
}

export const useRentRollQuery = () => {
  return useSuspenseQuery(rentRollQueryOptions())
}

// Mutations
export const useCreatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentInput) => createPayment({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.tenantId) })
      if (variables.leaseId) {
        queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.leaseId) })
      }
    },
  })
}

export const useUpdatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePaymentInput & { id: string }) =>
      updatePayment({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() })
    },
  })
}

export const useDeletePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePayment({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
