import { z } from 'zod'
import { maintenanceCategoryEnum } from './maintenance.schema'

// =============================================================================
// BUDGET ENUMS
// =============================================================================

export const budgetPeriodEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])

export const budgetAlertTypeEnum = z.enum(['WARNING', 'CRITICAL', 'EXCEEDED'])

// =============================================================================
// BUDGET CRUD SCHEMAS
// =============================================================================

export const createBudgetSchema = z.object({
  propertyId: z.string().uuid(),
  category: maintenanceCategoryEnum,
  budgetAmount: z.number().positive('Budget amount must be positive').max(999999999.99),
  period: budgetPeriodEnum.default('ANNUAL'),
  fiscalYear: z.number().int().min(2020).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  warningThreshold: z.number().int().min(1).max(100).default(80),
  criticalThreshold: z.number().int().min(1).max(100).default(95),
  notes: z.string().max(1000).optional(),
})

export const updateBudgetSchema = z.object({
  budgetAmount: z.number().positive().max(999999999.99).optional(),
  warningThreshold: z.number().int().min(1).max(100).optional(),
  criticalThreshold: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
})

export const budgetIdSchema = z.object({
  id: z.string().uuid(),
})

export const budgetFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  period: budgetPeriodEnum.optional(),
  fiscalYear: z.number().int().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// =============================================================================
// BUDGET ALERT SCHEMAS
// =============================================================================

export const acknowledgeBudgetAlertSchema = z.object({
  alertId: z.string().uuid(),
})

export const budgetAlertFiltersSchema = z.object({
  budgetId: z.string().uuid().optional(),
  alertType: budgetAlertTypeEnum.optional(),
  acknowledged: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// =============================================================================
// BUDGET HEALTH & COMPARISON SCHEMAS
// =============================================================================

export const budgetHealthFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  fiscalYear: z.number().int().optional(),
})

export const budgetVsActualFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  fiscalYear: z.number().int(),
  period: budgetPeriodEnum.optional(),
  groupBy: z.enum(['category', 'property', 'month']).default('category'),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BudgetPeriod = z.infer<typeof budgetPeriodEnum>
export type BudgetAlertType = z.infer<typeof budgetAlertTypeEnum>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>
export type BudgetHealthFilters = z.infer<typeof budgetHealthFiltersSchema>
export type BudgetVsActualFilters = z.infer<typeof budgetVsActualFiltersSchema>
export type BudgetAlertFilters = z.infer<typeof budgetAlertFiltersSchema>
