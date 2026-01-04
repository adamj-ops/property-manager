import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getProperties,
  getProperty,
  getPropertyStats,
  createProperty,
  updateProperty,
  deleteProperty,
} from '~/services/properties.api'
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from '~/services/properties.schema'

// Query keys
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  stats: () => [...propertyKeys.all, 'stats'] as const,
}

// Query options
export const propertiesQueryOptions = (filters: PropertyFilters = {}) =>
  queryOptions({
    queryKey: propertyKeys.list(filters),
    queryFn: () => getProperties({ data: filters }),
  })

export const propertyQueryOptions = (id: string) =>
  queryOptions({
    queryKey: propertyKeys.detail(id),
    queryFn: () => getProperty({ data: { id } }),
  })

export const propertyStatsQueryOptions = () =>
  queryOptions({
    queryKey: propertyKeys.stats(),
    queryFn: () => getPropertyStats(),
  })

// Hooks
export const usePropertiesQuery = (filters: PropertyFilters = {}) => {
  return useSuspenseQuery(propertiesQueryOptions(filters))
}

export const usePropertyQuery = (id: string) => {
  return useSuspenseQuery(propertyQueryOptions(id))
}

export const usePropertyStatsQuery = () => {
  return useSuspenseQuery(propertyStatsQueryOptions())
}

// Mutations
export const useCreateProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePropertyInput) => createProperty({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export const useUpdateProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePropertyInput & { id: string }) =>
      updateProperty({ data: { id, ...data } }),
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.lists() })
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(newData.id) })

      // Snapshot the previous value
      const previousLists = queryClient.getQueriesData({ queryKey: propertyKeys.lists() })
      const previousDetail = queryClient.getQueryData(propertyKeys.detail(newData.id))

      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: propertyKeys.lists() },
        (old: { properties: unknown[]; total: number } | undefined) => {
          if (!old) return old
          return {
            ...old,
            properties: old.properties.map((p: { id: string }) =>
              p.id === newData.id ? { ...p, ...newData } : p
            ),
          }
        }
      )

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData(propertyKeys.detail(newData.id), {
          ...previousDetail,
          ...newData,
        })
      }

      return { previousLists, previousDetail }
    },
    onError: (_, newData, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(propertyKeys.detail(newData.id), context.previousDetail)
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

export const useDeleteProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProperty({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}
