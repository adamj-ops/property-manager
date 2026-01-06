import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetHealth,
  getBudgetVsActual,
  recalculateBudgetSpending,
  acknowledgeBudgetAlert,
  getUnacknowledgedAlerts,
} from '~/services/maintenance-budget.api'
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilters,
  BudgetHealthFilters,
  BudgetVsActualFilters,
} from '~/services/maintenance-budget.schema'

// Query keys
export const budgetKeys = {
  all: ['maintenance-budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters: BudgetFilters) => [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  health: (filters: BudgetHealthFilters) => [...budgetKeys.all, 'health', filters] as const,
  vsActual: (filters: BudgetVsActualFilters) => [...budgetKeys.all, 'vs-actual', filters] as const,
  alerts: () => [...budgetKeys.all, 'alerts'] as const,
}

// Default filters
const defaultBudgetFilters: Pick<BudgetFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export const budgetsQueryOptions = (filters: Partial<BudgetFilters> = {}) => {
  const mergedFilters: BudgetFilters = { ...defaultBudgetFilters, ...filters }
  return queryOptions({
    queryKey: budgetKeys.list(mergedFilters),
    queryFn: () => getBudgets({ data: mergedFilters }),
  })
}

export const budgetQueryOptions = (id: string) =>
  queryOptions({
    queryKey: budgetKeys.detail(id),
    queryFn: () => getBudget({ data: { id } }),
  })

export const budgetHealthQueryOptions = (filters: BudgetHealthFilters = {}) =>
  queryOptions({
    queryKey: budgetKeys.health(filters),
    queryFn: () => getBudgetHealth({ data: filters }),
  })

export const budgetVsActualQueryOptions = (filters: BudgetVsActualFilters) =>
  queryOptions({
    queryKey: budgetKeys.vsActual(filters),
    queryFn: () => getBudgetVsActual({ data: filters }),
  })

export const unacknowledgedAlertsQueryOptions = () =>
  queryOptions({
    queryKey: budgetKeys.alerts(),
    queryFn: () => getUnacknowledgedAlerts(),
  })

// =============================================================================
// SUSPENSE QUERY HOOKS
// =============================================================================

export const useBudgetsQuery = (filters: Partial<BudgetFilters> = {}) =>
  useSuspenseQuery(budgetsQueryOptions(filters))

export const useBudgetQuery = (id: string) =>
  useSuspenseQuery(budgetQueryOptions(id))

export const useBudgetHealthQuery = (filters: BudgetHealthFilters = {}) =>
  useSuspenseQuery(budgetHealthQueryOptions(filters))

export const useBudgetVsActualQuery = (filters: BudgetVsActualFilters) =>
  useSuspenseQuery(budgetVsActualQueryOptions(filters))

export const useUnacknowledgedAlertsQuery = () =>
  useSuspenseQuery(unacknowledgedAlertsQueryOptions())

// =============================================================================
// MUTATIONS
// =============================================================================

export const useCreateBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetInput) => createBudget({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}

export const useUpdateBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBudgetInput & { id: string }) =>
      updateBudget({ data: { id, data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.health({}) })
    },
  })
}

export const useDeleteBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBudget({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}

export const useRecalculateBudgetSpending = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => recalculateBudgetSpending({ data: { id } }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.health({}) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.alerts() })
    },
  })
}

export const useAcknowledgeBudgetAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => acknowledgeBudgetAlert({ data: { alertId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.alerts() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.details() })
    },
  })
}
