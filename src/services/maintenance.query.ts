import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  getMaintenanceStats,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  addMaintenanceComment,
} from '~/services/maintenance.api'
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceFilters,
} from '~/services/maintenance.schema'

// Query keys
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: MaintenanceFilters) => [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  stats: () => [...maintenanceKeys.all, 'stats'] as const,
}

// Default filters
const defaultMaintenanceFilters: Pick<MaintenanceFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const maintenanceRequestsQueryOptions = (filters: Partial<MaintenanceFilters> = {}) => {
  const mergedFilters: MaintenanceFilters = { ...defaultMaintenanceFilters, ...filters }
  return queryOptions({
    queryKey: maintenanceKeys.list(mergedFilters),
    queryFn: () => getMaintenanceRequests({ data: mergedFilters }),
  })
}

export const maintenanceRequestQueryOptions = (id: string) =>
  queryOptions({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => getMaintenanceRequest({ data: { id } }),
  })

export const maintenanceStatsQueryOptions = () =>
  queryOptions({
    queryKey: maintenanceKeys.stats(),
    queryFn: () => getMaintenanceStats(),
  })

// Hooks
export const useMaintenanceRequestsQuery = (filters: Partial<MaintenanceFilters> = {}) => {
  return useSuspenseQuery(maintenanceRequestsQueryOptions(filters))
}

export const useMaintenanceRequestQuery = (id: string) => {
  return useSuspenseQuery(maintenanceRequestQueryOptions(id))
}

export const useMaintenanceStatsQuery = () => {
  return useSuspenseQuery(maintenanceStatsQueryOptions())
}

// Mutations
export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMaintenanceInput) => createMaintenanceRequest({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export const useUpdateMaintenanceRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMaintenanceInput & { id: string }) =>
      updateMaintenanceRequest({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.stats() })
    },
  })
}

export const useAddMaintenanceComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { requestId: string; content: string; isInternal?: boolean }) =>
      addMaintenanceComment({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.requestId) })
    },
  })
}
