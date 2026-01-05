import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  startInspection,
  addInspectionItem,
  updateInspectionItem,
  deleteInspectionItem,
  completeInspection,
  cancelInspection,
} from '~/services/inspections.api'
import type {
  InspectionFilters,
  CreateInspectionInput,
  UpdateInspectionInput,
  AddInspectionItemInput,
  UpdateInspectionItemInput,
  CompleteInspectionInput,
  CancelInspectionInput,
} from '~/services/inspections.schema'

// Query keys
export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  list: (filters: Partial<InspectionFilters>) => [...inspectionKeys.lists(), filters] as const,
  details: () => [...inspectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...inspectionKeys.details(), id] as const,
}

// Default filters
const defaultFilters: Pick<InspectionFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const inspectionsQueryOptions = (filters: Partial<InspectionFilters> = {}) => {
  const mergedFilters = { ...defaultFilters, ...filters }
  return queryOptions({
    queryKey: inspectionKeys.list(mergedFilters),
    queryFn: () => getInspections({ data: mergedFilters }),
  })
}

export const inspectionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => getInspection({ data: { id } }),
    enabled: !!id,
  })

// Hooks
export const useInspectionsQuery = (filters: Partial<InspectionFilters> = {}) => {
  return useSuspenseQuery(inspectionsQueryOptions(filters))
}

export const useInspectionQuery = (id: string) => {
  return useSuspenseQuery(inspectionQueryOptions(id))
}

// Mutations
export const useCreateInspection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInspectionInput) => createInspection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all })
    },
  })
}

export const useUpdateInspection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInspectionInput) => updateInspection({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() })
    },
  })
}

export const useStartInspection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => startInspection({ data: { id } }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() })
    },
  })
}

export const useAddInspectionItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddInspectionItemInput) => addInspectionItem({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.inspectionId) })
    },
  })
}

export const useUpdateInspectionItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInspectionItemInput) => updateInspectionItem({ data }),
    onSuccess: () => {
      // Need to invalidate all details since we don't have the inspection ID
      queryClient.invalidateQueries({ queryKey: inspectionKeys.details() })
    },
  })
}

export const useDeleteInspectionItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteInspectionItem({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.details() })
    },
  })
}

export const useCompleteInspection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompleteInspectionInput) => completeInspection({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() })
    },
  })
}

export const useCancelInspection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CancelInspectionInput) => cancelInspection({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() })
    },
  })
}
