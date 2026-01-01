import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getUnits,
  getUnit,
  createUnit,
  bulkCreateUnits,
  updateUnit,
  deleteUnit,
} from '~/services/units.api'
import { propertyKeys } from '~/services/properties.query'
import type {
  CreateUnitInput,
  UpdateUnitInput,
  UnitFilters,
  BulkCreateUnitsInput,
} from '~/services/units.schema'

// Query keys
export const unitKeys = {
  all: ['units'] as const,
  lists: () => [...unitKeys.all, 'list'] as const,
  list: (filters: UnitFilters) => [...unitKeys.lists(), filters] as const,
  details: () => [...unitKeys.all, 'detail'] as const,
  detail: (id: string) => [...unitKeys.details(), id] as const,
}

// Query options
export const unitsQueryOptions = (filters: UnitFilters = {}) =>
  queryOptions({
    queryKey: unitKeys.list(filters),
    queryFn: () => getUnits({ data: filters }),
  })

export const unitQueryOptions = (id: string) =>
  queryOptions({
    queryKey: unitKeys.detail(id),
    queryFn: () => getUnit({ data: { id } }),
  })

// Hooks
export const useUnitsQuery = (filters: UnitFilters = {}) => {
  return useSuspenseQuery(unitsQueryOptions(filters))
}

export const useUnitQuery = (id: string) => {
  return useSuspenseQuery(unitQueryOptions(id))
}

// Mutations
export const useCreateUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUnitInput) => createUnit({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.propertyId) })
    },
  })
}

export const useBulkCreateUnits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkCreateUnitsInput) => bulkCreateUnits({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.propertyId) })
    },
  })
}

export const useUpdateUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUnitInput & { id: string }) =>
      updateUnit({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
    },
  })
}

export const useDeleteUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUnit({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}
