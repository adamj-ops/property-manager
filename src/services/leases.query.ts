import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getLeases,
  getLease,
  getExpiringLeases,
  createLease,
  updateLease,
} from '~/services/leases.api'
import { unitKeys } from '~/services/units.query'
import { tenantKeys } from '~/services/tenants.query'
import type { CreateLeaseInput, UpdateLeaseInput, LeaseFilters } from '~/services/leases.schema'

// Query keys
export const leaseKeys = {
  all: ['leases'] as const,
  lists: () => [...leaseKeys.all, 'list'] as const,
  list: (filters: LeaseFilters) => [...leaseKeys.lists(), filters] as const,
  details: () => [...leaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaseKeys.details(), id] as const,
  expiring: () => [...leaseKeys.all, 'expiring'] as const,
}

// Default filters
const defaultLeaseFilters: Pick<LeaseFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const leasesQueryOptions = (filters: Partial<LeaseFilters> = {}) => {
  const mergedFilters: LeaseFilters = { ...defaultLeaseFilters, ...filters }
  return queryOptions({
    queryKey: leaseKeys.list(mergedFilters),
    queryFn: () => getLeases({ data: mergedFilters }),
  })
}

export const leaseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: leaseKeys.detail(id),
    queryFn: () => getLease({ data: { id } }),
  })

export const expiringLeasesQueryOptions = () =>
  queryOptions({
    queryKey: leaseKeys.expiring(),
    queryFn: () => getExpiringLeases(),
  })

// Hooks
export const useLeasesQuery = (filters: Partial<LeaseFilters> = {}) => {
  return useSuspenseQuery(leasesQueryOptions(filters))
}

export const useLeaseQuery = (id: string) => {
  return useSuspenseQuery(leaseQueryOptions(id))
}

export const useExpiringLeasesQuery = () => {
  return useSuspenseQuery(expiringLeasesQueryOptions())
}

// Mutations
export const useCreateLease = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeaseInput) => createLease({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.all })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.unitId) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.tenantId) })
    },
  })
}

export const useUpdateLease = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateLeaseInput & { id: string }) =>
      updateLease({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: leaseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}
