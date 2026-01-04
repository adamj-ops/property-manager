import { z } from 'zod'

// Calculate late fee for a lease
export const calculateLateFeeSchema = z.object({
  leaseId: z.string().uuid(),
  forMonth: z.coerce.date().optional(), // Defaults to current month
})

// Apply late fee manually
export const applyLateFeeSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  forMonth: z.coerce.date(),
  reason: z.string().optional(),
})

// Waive late fee
export const waiveLateFeeSchema = z.object({
  paymentId: z.string().uuid(), // The late fee payment record to waive
  reason: z.enum([
    'FIRST_TIME_OFFENSE',
    'PAYMENT_PROCESSING_DELAY',
    'HARDSHIP',
    'PROPERTY_ISSUE',
    'ADMINISTRATIVE_ERROR',
    'COURTESY',
    'OTHER',
  ]),
  notes: z.string().optional(),
})

// Late fee filters
export const lateFeeFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPLIED', 'WAIVED', 'PAID']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Bulk late fee check (for background job)
export const bulkLateFeeCheckSchema = z.object({
  propertyId: z.string().uuid().optional(), // If not provided, check all properties
  dryRun: z.boolean().default(false), // If true, don't apply fees, just calculate
})

// Type exports
export type CalculateLateFeeInput = z.infer<typeof calculateLateFeeSchema>
export type ApplyLateFeeInput = z.infer<typeof applyLateFeeSchema>
export type WaiveLateFeeInput = z.infer<typeof waiveLateFeeSchema>
export type LateFeeFilters = z.infer<typeof lateFeeFiltersSchema>
export type BulkLateFeeCheckInput = z.infer<typeof bulkLateFeeCheckSchema>

// Late fee calculation result
export interface LateFeeCalculation {
  leaseId: string
  tenantName: string
  unitNumber: string
  propertyName: string
  monthlyRent: number
  rentDueDay: number
  gracePeriodDays: number
  lateFeeAmount: number
  // Calculation details
  forMonth: Date
  dueDate: Date
  gracePeriodEndDate: Date
  daysPastDue: number
  isLate: boolean
  feeApplicable: boolean
  calculatedFee: number
  // MN compliance
  mnMaxFee: number // Greater of $50 or 8% of rent
  appliedFee: number // Actual fee (min of lateFeeAmount and mnMaxFee)
  // Payment status
  rentPaidAmount: number
  rentBalance: number
  hasExistingLateFee: boolean
}

// Late fee waiver reason type
export type WaiverReason = z.infer<typeof waiveLateFeeSchema>['reason']
