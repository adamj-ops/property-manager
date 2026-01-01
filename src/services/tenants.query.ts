import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
} from '~/services/tenants.api'
import type {
  CreateTenantInput,
  UpdateTenantInput,
  TenantFilters,
} from '~/services/tenants.schema'

// Query keys
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (filters: TenantFilters) => [...tenantKeys.lists(), filters] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
}

// Query options
export const tenantsQueryOptions = (filters: TenantFilters = {}) =>
  queryOptions({
    queryKey: tenantKeys.list(filters),
    queryFn: () => getTenants({ data: filters }),
  })

export const tenantQueryOptions = (id: string) =>
  queryOptions({
    queryKey: tenantKeys.detail(id),
    queryFn: () => getTenant({ data: { id } }),
  })

// Hooks
export const useTenantsQuery = (filters: TenantFilters = {}) => {
  return useSuspenseQuery(tenantsQueryOptions(filters))
}

export const useTenantQuery = (id: string) => {
  return useSuspenseQuery(tenantQueryOptions(id))
}

// Mutations
export const useCreateTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTenantInput) => createTenant({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    },
  })
}

export const useUpdateTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTenantInput & { id: string }) =>
      updateTenant({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

export const useDeleteTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTenant({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    },
  })
}
