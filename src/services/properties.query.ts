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
    onSuccess: (_, variables) => {
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
