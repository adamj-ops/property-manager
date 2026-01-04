import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getExpenses,
  getExpense,
  getExpenseSummary,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
  markExpensePaid,
} from '~/services/expenses.api'
import { propertyKeys } from '~/services/properties.query'
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
  ExpenseSummaryFilters,
} from '~/services/expenses.schema'

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  summary: (filters: ExpenseSummaryFilters) => [...expenseKeys.all, 'summary', filters] as const,
  stats: () => [...expenseKeys.all, 'stats'] as const,
}

// Default filters
const defaultExpenseFilters: Pick<ExpenseFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const expensesQueryOptions = (filters: Partial<ExpenseFilters> = {}) => {
  const mergedFilters: ExpenseFilters = { ...defaultExpenseFilters, ...filters }
  return queryOptions({
    queryKey: expenseKeys.list(mergedFilters),
    queryFn: () => getExpenses({ data: mergedFilters }),
  })
}

export const expenseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: expenseKeys.detail(id),
    queryFn: () => getExpense({ data: { id } }),
  })

export const expenseSummaryQueryOptions = (filters: Partial<ExpenseSummaryFilters> = {}) =>
  queryOptions({
    queryKey: expenseKeys.summary(filters),
    queryFn: () => getExpenseSummary({ data: filters }),
  })

export const expenseStatsQueryOptions = () =>
  queryOptions({
    queryKey: expenseKeys.stats(),
    queryFn: () => getExpenseStats(),
  })

// Hooks
export const useExpensesQuery = (filters: Partial<ExpenseFilters> = {}) => {
  return useSuspenseQuery(expensesQueryOptions(filters))
}

export const useExpenseQuery = (id: string) => {
  return useSuspenseQuery(expenseQueryOptions(id))
}

export const useExpenseSummaryQuery = (filters: Partial<ExpenseSummaryFilters> = {}) => {
  return useSuspenseQuery(expenseSummaryQueryOptions(filters))
}

export const useExpenseStatsQuery = () => {
  return useSuspenseQuery(expenseStatsQueryOptions())
}

// Mutations
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseInput) => createExpense({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.propertyId) })
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateExpenseInput & { id: string }) =>
      updateExpense({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary({}) })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExpense({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useMarkExpensePaid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; paidDate?: Date; referenceNumber?: string }) =>
      markExpensePaid({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() })
    },
  })
}
