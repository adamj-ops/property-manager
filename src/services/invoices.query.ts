import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { z } from 'zod'

import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  submitInvoice,
  startReview,
  approveInvoice,
  rejectInvoice,
  markInvoicePaid,
  cancelInvoice,
  getInvoiceSummary,
} from '~/services/invoices.api'
import {
  invoiceFiltersSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  approveInvoiceSchema,
  rejectInvoiceSchema,
  markInvoicePaidSchema,
} from '~/services/invoices.schema'
import { maintenanceKeys } from '~/services/maintenance.query'
import { costLineItemKeys } from '~/services/cost-line-items.query'

// =============================================================================
// INPUT TYPES
// =============================================================================

type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>
type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema> & { id: string }
type ApproveInvoiceInput = z.infer<typeof approveInvoiceSchema>
type RejectInvoiceInput = z.infer<typeof rejectInvoiceSchema>
type MarkInvoicePaidInput = z.infer<typeof markInvoicePaidSchema>

// =============================================================================
// QUERY KEYS
// =============================================================================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  byRequest: (requestId: string) => [...invoiceKeys.lists(), { requestId }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summaries: () => [...invoiceKeys.all, 'summary'] as const,
  summary: (requestId: string) => [...invoiceKeys.summaries(), requestId] as const,
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export const invoicesQueryOptions = (filters: InvoiceFilters) =>
  queryOptions({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => getInvoices({ data: filters }),
  })

export const invoicesByRequestQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: invoiceKeys.byRequest(requestId),
    queryFn: () => getInvoices({ data: { requestId } }),
  })

export const invoiceQueryOptions = (id: string) =>
  queryOptions({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoice({ data: { id } }),
  })

export const invoiceSummaryQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: invoiceKeys.summary(requestId),
    queryFn: () => getInvoiceSummary({ data: { requestId } }),
  })

// =============================================================================
// SUSPENSE HOOKS
// =============================================================================

export const useInvoicesQuery = (filters: InvoiceFilters) =>
  useSuspenseQuery(invoicesQueryOptions(filters))

export const useInvoicesByRequestQuery = (requestId: string) =>
  useSuspenseQuery(invoicesByRequestQueryOptions(requestId))

export const useInvoiceQuery = (id: string) =>
  useSuspenseQuery(invoiceQueryOptions(id))

export const useInvoiceSummaryQuery = (requestId: string) =>
  useSuspenseQuery(invoiceSummaryQueryOptions(requestId))

// =============================================================================
// MUTATIONS
// =============================================================================

export const useCreateInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => createInvoice({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(variables.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(variables.requestId),
      })
    },
  })
}

export const useUpdateInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInvoiceInput) => updateInvoice({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}

export const useDeleteInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; requestId: string }) =>
      deleteInvoice({ data: { id: data.id } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(variables.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(variables.requestId),
      })
    },
  })
}

// =============================================================================
// WORKFLOW MUTATIONS
// =============================================================================

export const useSubmitInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string }) => submitInvoice({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}

export const useStartReviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string }) => startReview({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}

export const useApproveInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApproveInvoiceInput) => approveInvoice({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
      // Also invalidate cost line items if they were created
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: costLineItemKeys.summary(result.requestId),
      })
      // And the maintenance request detail
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(result.requestId),
      })
    },
  })
}

export const useRejectInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RejectInvoiceInput) => rejectInvoice({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}

export const useMarkInvoicePaidMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MarkInvoicePaidInput) => markInvoicePaid({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}

export const useCancelInvoiceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string }) => cancelInvoice({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byRequest(result.requestId),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.id),
      })
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.summary(result.requestId),
      })
    },
  })
}
