import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createLeaseRenewal,
  getLeaseRenewalHistory,
} from '~/services/lease-renewals.api'
import { leaseKeys } from '~/services/leases.query'
import type { CreateLeaseRenewalInput } from '~/services/lease-renewals.schema'

// Query keys
export const leaseRenewalKeys = {
  all: ['lease-renewals'] as const,
  history: (leaseId: string) => [...leaseRenewalKeys.all, 'history', leaseId] as const,
}

// Query options
export const leaseRenewalHistoryQueryOptions = (leaseId: string) =>
  queryOptions({
    queryKey: leaseRenewalKeys.history(leaseId),
    queryFn: () => getLeaseRenewalHistory({ data: { id: leaseId } }),
    enabled: !!leaseId,
  })

// Mutations
export const useCreateLeaseRenewal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeaseRenewalInput) => createLeaseRenewal({ data }),
    onSuccess: (newLease, variables) => {
      // Invalidate all lease queries
      queryClient.invalidateQueries({ queryKey: leaseKeys.all })
      // Invalidate renewal history for original lease
      queryClient.invalidateQueries({
        queryKey: leaseRenewalKeys.history(variables.leaseId),
      })
    },
  })
}
