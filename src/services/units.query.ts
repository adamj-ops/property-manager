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
  bulkDeleteUnits,
  type UnitWithDetails,
  type UnitFull,
} from '~/services/units.api'
import { propertyKeys } from '~/services/properties.query'
import type {
  CreateUnitInput,
  UpdateUnitInput,
  UnitFilters,
  BulkCreateUnitsInput,
  BulkDeleteUnitsInput,
} from '~/services/units.schema'

// Default filter values to satisfy required schema fields
const defaultFilters: Pick<UnitFilters, 'offset' | 'limit'> = {
  offset: 0,
  limit: 50,
}

// Query keys
export const unitKeys = {
  all: ['units'] as const,
  lists: () => [...unitKeys.all, 'list'] as const,
  list: (filters: UnitFilters) => [...unitKeys.lists(), filters] as const,
  details: () => [...unitKeys.all, 'detail'] as const,
  detail: (id: string) => [...unitKeys.details(), id] as const,
}

// Query options
export const unitsQueryOptions = (filters: Partial<UnitFilters> = {}) => {
  const mergedFilters = { ...defaultFilters, ...filters }
  return queryOptions({
    queryKey: unitKeys.list(mergedFilters),
    queryFn: () => getUnits({ data: mergedFilters }) as Promise<{ units: UnitWithDetails[]; total: number; limit: number; offset: number }>,
  })
}

export const unitQueryOptions = (id: string) =>
  queryOptions({
    queryKey: unitKeys.detail(id),
    queryFn: () => getUnit({ data: { id } }) as Promise<UnitFull>,
  })

// Hooks
export const useUnitsQuery = (filters: Partial<UnitFilters> = {}) => {
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
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: unitKeys.lists() })
      await queryClient.cancelQueries({ queryKey: unitKeys.detail(newData.id) })

      // Snapshot the previous value
      const previousLists = queryClient.getQueriesData({ queryKey: unitKeys.lists() })
      const previousDetail = queryClient.getQueryData(unitKeys.detail(newData.id))

      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: unitKeys.lists() },
        (old: { units: unknown[]; total: number } | undefined) => {
          if (!old) return old
          return {
            ...old,
            units: old.units.map((u: { id: string }) =>
              u.id === newData.id ? { ...u, ...newData } : u
            ),
          }
        }
      )

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData(unitKeys.detail(newData.id), {
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
        queryClient.setQueryData(unitKeys.detail(newData.id), context.previousDetail)
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
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

export const useBulkDeleteUnits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkDeleteUnitsInput) => bulkDeleteUnits({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}
