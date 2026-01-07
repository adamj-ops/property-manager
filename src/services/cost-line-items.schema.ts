import { z } from 'zod'

// =============================================================================
// ENUMS
// =============================================================================

export const costLineItemTypeEnum = z.enum([
  'LABOR',
  'PARTS',
  'MATERIALS',
  'PERMITS',
  'TRAVEL',
  'EMERGENCY_FEE',
  'DISPOSAL',
  'SUBCONTRACTOR',
  'OTHER',
])

export type CostLineItemType = z.infer<typeof costLineItemTypeEnum>

// Type labels for display
export const costLineItemTypeLabels: Record<CostLineItemType, string> = {
  LABOR: 'Labor',
  PARTS: 'Parts',
  MATERIALS: 'Materials',
  PERMITS: 'Permits',
  TRAVEL: 'Travel',
  EMERGENCY_FEE: 'Emergency Fee',
  DISPOSAL: 'Disposal',
  SUBCONTRACTOR: 'Subcontractor',
  OTHER: 'Other',
}

// Type icons for display (emoji)
export const costLineItemTypeIcons: Record<CostLineItemType, string> = {
  LABOR: '🔧',
  PARTS: '🔩',
  MATERIALS: '📦',
  PERMITS: '📋',
  TRAVEL: '🚗',
  EMERGENCY_FEE: '🚨',
  DISPOSAL: '🗑️',
  SUBCONTRACTOR: '👷',
  OTHER: '📝',
}

// =============================================================================
// CREATE & UPDATE SCHEMAS
// =============================================================================

export const createCostLineItemSchema = z.object({
  requestId: z.string().uuid(),
  type: costLineItemTypeEnum,
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unitCost: z.number().nonnegative('Unit cost cannot be negative'),

  // Parts tracking
  partNumber: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  warranty: z.boolean().default(false),
  warrantyExpiry: z.coerce.date().optional().nullable(),

  // Labor tracking
  laborHours: z.number().positive().optional().nullable(),
  laborRate: z.number().positive().optional().nullable(),
  workerId: z.string().max(100).optional(),

  // Documentation
  receiptUrl: z.string().url().optional().nullable(),

  // Tenant billing
  chargeToTenant: z.boolean().default(false),
  tenantChargeAmount: z.number().nonnegative().optional().nullable(),
})

export const updateCostLineItemSchema = createCostLineItemSchema
  .partial()
  .omit({ requestId: true })

// =============================================================================
// ID & FILTER SCHEMAS
// =============================================================================

export const costLineItemIdSchema = z.object({
  id: z.string().uuid(),
})

export const costLineItemFiltersSchema = z.object({
  requestId: z.string().uuid(),
  type: costLineItemTypeEnum.optional(),
})

// =============================================================================
// BULK OPERATIONS
// =============================================================================

export const bulkCreateCostLineItemsSchema = z.object({
  requestId: z.string().uuid(),
  items: z
    .array(createCostLineItemSchema.omit({ requestId: true }))
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per request'),
})

export const bulkDeleteCostLineItemsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one item must be selected'),
})

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface CostLineItemSummary {
  totalCost: number
  laborCost: number
  partsCost: number
  materialsCost: number
  otherCosts: number
  tenantCharges: number
  netCost: number
  itemCount: number
  byType: {
    type: CostLineItemType
    label: string
    icon: string
    total: number
    count: number
  }[]
}

export interface CostLineItemWithDetails {
  id: string
  requestId: string
  type: CostLineItemType
  description: string
  quantity: number
  unitCost: number
  totalCost: number
  partNumber: string | null
  supplier: string | null
  warranty: boolean
  warrantyExpiry: string | null
  laborHours: number | null
  laborRate: number | null
  workerId: string | null
  receiptUrl: string | null
  chargeToTenant: boolean
  tenantChargeAmount: number | null
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateCostLineItemInput = z.infer<typeof createCostLineItemSchema>
export type UpdateCostLineItemInput = z.infer<typeof updateCostLineItemSchema>
export type CostLineItemFilters = z.infer<typeof costLineItemFiltersSchema>
export type BulkCreateCostLineItemsInput = z.infer<typeof bulkCreateCostLineItemsSchema>
export type BulkDeleteCostLineItemsInput = z.infer<typeof bulkDeleteCostLineItemsSchema>
