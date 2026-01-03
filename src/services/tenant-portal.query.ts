import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import {
  getTenantDashboardData,
  getTenantPaymentHistory,
  getTenantLeaseInfo,
  getTenantBalance,
} from '~/services/tenant-portal.api'

// Query options
export const tenantDashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['tenant', 'dashboard'],
    queryFn: () => getTenantDashboardData(),
  })

export const tenantPaymentHistoryQueryOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: ['tenant', 'payments', 'history', page, limit],
    queryFn: () => getTenantPaymentHistory({ data: { page, limit } }),
  })

export const tenantLeaseInfoQueryOptions = () =>
  queryOptions({
    queryKey: ['tenant', 'lease'],
    queryFn: () => getTenantLeaseInfo(),
  })

export const tenantBalanceQueryOptions = () =>
  queryOptions({
    queryKey: ['tenant', 'balance'],
    queryFn: () => getTenantBalance(),
  })

// Hooks
export const useTenantDashboardQuery = () => {
  return useSuspenseQuery(tenantDashboardQueryOptions())
}

export const useTenantPaymentHistoryQuery = (page = 1, limit = 10) => {
  return useSuspenseQuery(tenantPaymentHistoryQueryOptions(page, limit))
}

export const useTenantLeaseInfoQuery = () => {
  return useSuspenseQuery(tenantLeaseInfoQueryOptions())
}

export const useTenantBalanceQuery = () => {
  return useSuspenseQuery(tenantBalanceQueryOptions())
}

