/**
 * Lease Documents React Query Hooks
 * EPM-43: Lease Document Generation
 */

import { useMutation, useQuery } from '@tanstack/react-query'

import {
  generateLeasePdf,
  regenerateLeasePdf,
  getLeasePdfDownloadUrl,
} from './lease-documents.api'

/**
 * Hook to generate a lease PDF document.
 */
export function useGenerateLeasePdf() {
  return useMutation({
    mutationFn: generateLeasePdf,
  })
}

/**
 * Hook to regenerate a lease PDF document.
 */
export function useRegenerateLeasePdf() {
  return useMutation({
    mutationFn: regenerateLeasePdf,
  })
}

/**
 * Hook to get a lease PDF download URL.
 */
export function useGetLeasePdfDownloadUrl(leaseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['lease-document-download-url', leaseId],
    queryFn: () => getLeasePdfDownloadUrl({ data: { leaseId: leaseId! } }),
    enabled: enabled && !!leaseId,
  })
}

