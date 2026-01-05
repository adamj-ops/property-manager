import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getVendors,
  getVendor,
  getVendorStats,
  createVendor,
  updateVendor,
  deleteVendor,
  type VendorWithStats,
  type VendorFull,
} from './vendors.api'
import type { CreateVendorInput, UpdateVendorInput, VendorFilters } from './vendors.schema'

// Query keys
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilters) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
  stats: () => [...vendorKeys.all, 'stats'] as const,
}

// Default filters
const defaultFilters: Pick<VendorFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const vendorsQueryOptions = (filters: Partial<VendorFilters> = {}) => {
  const mergedFilters: VendorFilters = { ...defaultFilters, ...filters }
  return queryOptions({
    queryKey: vendorKeys.list(mergedFilters),
    queryFn: () => getVendors({ data: mergedFilters }) as Promise<{
      vendors: VendorWithStats[]
      total: number
      limit: number
      offset: number
    }>,
  })
}

export const vendorQueryOptions = (id: string) =>
  queryOptions({
    queryKey: vendorKeys.detail(id),
    queryFn: () => getVendor({ data: { id } }) as Promise<VendorFull>,
  })

export const vendorStatsQueryOptions = () =>
  queryOptions({
    queryKey: vendorKeys.stats(),
    queryFn: () => getVendorStats(),
  })

// Hooks
export const useVendorsQuery = (filters: Partial<VendorFilters> = {}) => {
  return useSuspenseQuery(vendorsQueryOptions(filters))
}

export const useVendorQuery = (id: string) => {
  return useSuspenseQuery(vendorQueryOptions(id))
}

export const useVendorStatsQuery = () => {
  return useSuspenseQuery(vendorStatsQueryOptions())
}

// Mutations
export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVendorInput) => createVendor({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateVendorInput & { id: string }) =>
      updateVendor({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.stats() })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVendor({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}
