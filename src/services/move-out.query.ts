import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getDepositDispositions,
  getDepositDisposition,
  initiateMoveOut,
  getMoveOutStatus,
  createDamageItem,
  updateDamageItem,
  deleteDamageItem,
  calculateDisposition,
  linkMoveOutInspection,
  sendDispositionLetter,
  processRefund,
  compareMoveInMoveOut,
} from './move-out.api'
import type {
  MoveOutFiltersInput,
  InitiateMoveOutInput,
  CreateDamageItemInput,
  UpdateDamageItemInput,
  SendDispositionLetterInput,
  ProcessRefundInput,
} from './move-out.schema'

// =============================================================================
// Query Keys
// =============================================================================

export const moveOutKeys = {
  all: ['move-out'] as const,
  dispositions: (filters?: MoveOutFiltersInput) =>
    [...moveOutKeys.all, 'dispositions', filters] as const,
  disposition: (leaseId: string) =>
    [...moveOutKeys.all, 'disposition', leaseId] as const,
  status: (leaseId: string) =>
    [...moveOutKeys.all, 'status', leaseId] as const,
  comparison: (leaseId: string) =>
    [...moveOutKeys.all, 'comparison', leaseId] as const,
}

// =============================================================================
// Query Options
// =============================================================================

export function depositDispositionsQueryOptions(filters: MoveOutFiltersInput = {}) {
  return queryOptions({
    queryKey: moveOutKeys.dispositions(filters),
    queryFn: () => getDepositDispositions({ data: filters }),
  })
}

export function depositDispositionQueryOptions(leaseId: string) {
  return queryOptions({
    queryKey: moveOutKeys.disposition(leaseId),
    queryFn: () => getDepositDisposition({ data: { leaseId } }),
  })
}

export function moveOutStatusQueryOptions(leaseId: string) {
  return queryOptions({
    queryKey: moveOutKeys.status(leaseId),
    queryFn: () => getMoveOutStatus({ data: { leaseId } }),
  })
}

export function moveOutComparisonQueryOptions(leaseId: string) {
  return queryOptions({
    queryKey: moveOutKeys.comparison(leaseId),
    queryFn: () => compareMoveInMoveOut({ data: { leaseId } }),
  })
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Initiate move-out process
 */
export function useInitiateMoveOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InitiateMoveOutInput) => initiateMoveOut({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leases', 'detail', variables.leaseId] })
    },
  })
}

/**
 * Create damage item
 */
export function useCreateDamageItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDamageItemInput) => createDamageItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}

/**
 * Update damage item
 */
export function useUpdateDamageItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateDamageItemInput) => updateDamageItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}

/**
 * Delete damage item
 */
export function useDeleteDamageItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDamageItem({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}

/**
 * Calculate/recalculate disposition
 */
export function useCalculateDisposition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leaseId: string) => calculateDisposition({ data: { leaseId } }),
    onSuccess: (_, leaseId) => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.disposition(leaseId) })
      queryClient.invalidateQueries({ queryKey: moveOutKeys.status(leaseId) })
    },
  })
}

/**
 * Link move-out inspection
 */
export function useLinkMoveOutInspection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { leaseId: string; inspectionId: string }) =>
      linkMoveOutInspection({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.disposition(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: moveOutKeys.status(variables.leaseId) })
    },
  })
}

/**
 * Send disposition letter
 */
export function useSendDispositionLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendDispositionLetterInput) => sendDispositionLetter({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.disposition(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: moveOutKeys.status(variables.leaseId) })
      queryClient.invalidateQueries({ queryKey: moveOutKeys.dispositions() })
    },
  })
}

/**
 * Process refund
 */
export function useProcessRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProcessRefundInput) => processRefund({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moveOutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leases', 'detail', variables.leaseId] })
    },
  })
}
