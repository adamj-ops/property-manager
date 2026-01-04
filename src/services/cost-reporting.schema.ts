import { z } from 'zod'
import { maintenanceCategoryEnum } from '~/services/maintenance.schema'

// Cost reporting filter schema
export const costReportingFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
})

// Aggregation period for time-series data
export const aggregationPeriodEnum = z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'])

// Cost by period request
export const costByPeriodSchema = costReportingFiltersSchema.extend({
  period: aggregationPeriodEnum.default('MONTH'),
})

export type CostReportingFilters = z.infer<typeof costReportingFiltersSchema>
export type AggregationPeriod = z.infer<typeof aggregationPeriodEnum>
export type CostByPeriodInput = z.infer<typeof costByPeriodSchema>

// Response types
export interface CostSummary {
  totalEstimated: number
  totalActual: number
  totalTenantCharges: number
  netCost: number
  completedCount: number
  avgCostPerRequest: number
  savingsVsEstimate: number
}

export interface CostByProperty {
  propertyId: string
  propertyName: string
  estimatedCost: number
  actualCost: number
  tenantCharges: number
  requestCount: number
}

export interface CostByCategory {
  category: string
  categoryLabel: string
  estimatedCost: number
  actualCost: number
  tenantCharges: number
  requestCount: number
}

export interface CostByVendor {
  vendorId: string
  vendorName: string
  estimatedCost: number
  actualCost: number
  requestCount: number
  avgCostPerRequest: number
}

export interface CostByPeriod {
  period: string
  periodLabel: string
  estimatedCost: number
  actualCost: number
  tenantCharges: number
  requestCount: number
}

export interface TopExpensiveRequest {
  id: string
  requestNumber: string
  title: string
  category: string
  actualCost: number
  propertyName: string
  unitNumber: string
  completedAt: string | null
}
