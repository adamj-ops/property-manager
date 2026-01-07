import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getCostLineItems,
  getCostLineItem,
  createCostLineItem,
  updateCostLineItem,
  deleteCostLineItem,
  bulkCreateCostLineItems,
  bulkDeleteCostLineItems,
  getCostLineItemSummary,
} from '~/services/cost-line-items.api'
import type {
  CreateCostLineItemInput,
  UpdateCostLineItemInput,
  CostLineItemFilters,
  BulkCreateCostLineItemsInput,
  BulkDeleteCostLineItemsInput,
} from '~/services/cost-line-items.schema'
import { maintenanceKeys } from '~/services/maintenance.query'

// =============================================================================
// QUERY KEYS
// =============================================================================

export const costLineItemKeys = {
  all: ['cost-line-items'] as const,
  lists: () => [...costLineItemKeys.all, 'list'] as const,
  list: (filters: CostLineItemFilters) => [...costLineItemKeys.lists(), filters] as const,
  byRequest: (requestId: string) => [...costLineItemKeys.lists(), { requestId }] as const,
  details: () => [...costLineItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...costLineItemKeys.details(), id] as const,
  summaries: () => [...costLineItemKeys.all, 'summary'] as const,
  summary: (requestId: string) => [...costLineItemKeys.summaries(), requestId] as const,
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export const costLineItemsQueryOptions = (filters: CostLineItemFilters) =>
  queryOptions({
    queryKey: costLineItemKeys.list(filters),
    queryFn: () => getCostLineItems({ data: filters }),
  })

export const costLineItemsByRequestQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: costLineItemKeys.byRequest(requestId),
    queryFn: () => getCostLineItems({ data: { requestId } }),
  })

export const costLineItemQueryOptions = (id: string) =>
  queryOptions({
    queryKey: costLineItemKeys.detail(id),
    queryFn: () => getCostLineItem({ data: { id } }),
  })

export const costLineItemSummaryQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: costLineItemKeys.summary(requestId),
    queryFn: () => getCostLineItemSummary({ data: { requestId } }),
  })

// =============================================================================
// SUSPENSE HOOKS
// =============================================================================

export const useCostLineItemsQuery = (filters: CostLineItemFilters) =>
  useSuspenseQuery(costLineItemsQueryOptions(filters))

export const useCostLineItemsByRequestQuery = (requestId: string) =>
  useSuspenseQuery(costLineItemsByRequestQueryOptions(requestId))

export const useCostLineItemQuery = (id: string) =>
  useSuspenseQuery(costLineItemQueryOptions(id))

export const useCostLineItemSummaryQuery = (requestId: string) =>
  useSuspenseQuery(costLineItemSummaryQueryOptions(requestId))

// =============================================================================
// MUTATIONS
// =============================================================================

export const useCreateCostLineItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCostLineItemInput) =>
      createCostLineItem({ data }),
    onSuccess: (_, variables) => {
      // Invalidate list queries for this request
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(variables.requestId),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(variables.requestId),
      })
      // Invalidate maintenance request detail (actualCost changed)
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(variables.requestId),
      })
    },
  })
}

export const useUpdateCostLineItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCostLineItemInput & { id: string; requestId: string }) =>
      updateCostLineItem({ data }),
    onSuccess: (_, variables) => {
      // Invalidate this item's detail
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.detail(variables.id),
      })
      // Invalidate list queries for this request
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(variables.requestId),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(variables.requestId),
      })
      // Invalidate maintenance request detail (actualCost changed)
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(variables.requestId),
      })
    },
  })
}

export const useDeleteCostLineItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; requestId: string }) =>
      deleteCostLineItem({ data: { id: data.id } }),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: costLineItemKeys.detail(variables.id),
      })
      // Invalidate list queries for this request
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(variables.requestId),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(variables.requestId),
      })
      // Invalidate maintenance request detail (actualCost changed)
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(variables.requestId),
      })
    },
  })
}

export const useBulkCreateCostLineItemsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkCreateCostLineItemsInput) =>
      bulkCreateCostLineItems({ data }),
    onSuccess: (_, variables) => {
      // Invalidate list queries for this request
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(variables.requestId),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(variables.requestId),
      })
      // Invalidate maintenance request detail (actualCost changed)
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(variables.requestId),
      })
    },
  })
}

export const useBulkDeleteCostLineItemsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkDeleteCostLineItemsInput & { requestId: string }) =>
      bulkDeleteCostLineItems({ data: { ids: data.ids } }),
    onSuccess: (_, variables) => {
      // Remove deleted items from cache
      for (const id of variables.ids) {
        queryClient.removeQueries({
          queryKey: costLineItemKeys.detail(id),
        })
      }
      // Invalidate list queries for this request
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(variables.requestId),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(variables.requestId),
      })
      // Invalidate maintenance request detail (actualCost changed)
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(variables.requestId),
      })
    },
  })
}
