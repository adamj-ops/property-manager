import { z } from 'zod'

// =============================================================================
// Enums matching Prisma
// =============================================================================

export const depositDispositionStatusEnum = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'SENT',
  'ACKNOWLEDGED',
  'DISPUTED',
])

export const sendMethodEnum = z.enum([
  'CERTIFIED_MAIL',
  'REGULAR_MAIL',
  'EMAIL',
  'HAND_DELIVERED',
])

export const refundMethodEnum = z.enum(['CHECK', 'ACH', 'CASH'])

export type DepositDispositionStatus = z.infer<typeof depositDispositionStatusEnum>
export type SendMethod = z.infer<typeof sendMethodEnum>
export type RefundMethod = z.infer<typeof refundMethodEnum>

// =============================================================================
// Move-Out Process Schemas
// =============================================================================

// Initiate move-out
export const initiateMoveOutSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
  moveOutDate: z.coerce.date(),
  notes: z.string().optional(),
})

// Get move-out status
export const getMoveOutStatusSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
})

// =============================================================================
// Damage Item Schemas
// =============================================================================

export const createDamageItemSchema = z.object({
  inspectionId: z.string().uuid('Valid inspection ID required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  repairCost: z.coerce.number().min(0, 'Repair cost must be positive'),
  isNormalWear: z.boolean().default(false),
  isPreExisting: z.boolean().default(false),
  photoUrls: z.array(z.string().url()).default([]),
  notes: z.string().optional(),
  moveInItemId: z.string().uuid().optional(),
})

export const updateDamageItemSchema = z.object({
  id: z.string().uuid('Valid damage item ID required'),
  description: z.string().min(1).optional(),
  location: z.string().optional(),
  repairCost: z.coerce.number().min(0).optional(),
  isNormalWear: z.boolean().optional(),
  isPreExisting: z.boolean().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
})

export const deleteDamageItemSchema = z.object({
  id: z.string().uuid('Valid damage item ID required'),
})

// =============================================================================
// Deposit Disposition Schemas
// =============================================================================

export const createDepositDispositionSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
  moveOutDate: z.coerce.date(),
  moveInInspectionId: z.string().uuid().optional(),
  moveOutInspectionId: z.string().uuid().optional(),
})

export const updateDepositDispositionSchema = z.object({
  id: z.string().uuid('Valid disposition ID required'),
  bankName: z.string().optional(),
  accountLast4: z.string().max(4).optional(),
  notes: z.string().optional(),
})

// Calculate deposit disposition
export const calculateDispositionSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
})

// Send disposition letter
export const sendDispositionLetterSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
  method: sendMethodEnum,
  trackingNumber: z.string().optional(),
})

// Process refund
export const processRefundSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
  method: refundMethodEnum,
  checkNumber: z.string().optional(),
  amount: z.coerce.number().min(0),
})

// =============================================================================
// Comparison Schemas
// =============================================================================

export const compareMoveInMoveOutSchema = z.object({
  leaseId: z.string().uuid('Valid lease ID required'),
})

// =============================================================================
// Query/Filter Schemas
// =============================================================================

export const moveOutFiltersSchema = z.object({
  status: depositDispositionStatusEnum.optional(),
  overdueOnly: z.boolean().optional(),
  propertyId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

// =============================================================================
// MN Compliance Constants
// =============================================================================

// Minnesota Statute 504B.178 - Security Deposit Return
export const MN_COMPLIANCE = {
  // Landlord must return deposit within 21 days of move-out
  RETURN_DEADLINE_DAYS: 21,

  // Default interest rate (1% annually per MN law)
  INTEREST_RATE: 0.01,

  // Required disclosures in disposition letter
  REQUIRED_DISCLOSURES: [
    'Bank name where deposit was held',
    'Last 4 digits of account number',
    'Itemized list of deductions',
    'Reason for each deduction',
    'Amount of each deduction',
  ],

  // Normal wear and tear examples (not deductible)
  NORMAL_WEAR_EXAMPLES: [
    'Minor scuffs on walls',
    'Faded paint from sunlight',
    'Worn carpet in high-traffic areas',
    'Minor nail holes from pictures',
    'Loose door handles from normal use',
  ],

  // Deductible damage examples
  DEDUCTIBLE_DAMAGE_EXAMPLES: [
    'Holes in walls larger than nail holes',
    'Stains on carpet beyond normal wear',
    'Broken windows or doors',
    'Missing fixtures or appliances',
    'Excessive dirt requiring professional cleaning',
    'Pet damage',
    'Unauthorized alterations',
  ],
} as const

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate the deadline date for deposit disposition (21 days from move-out)
 */
export function calculateDeadlineDate(moveOutDate: Date): Date {
  const deadline = new Date(moveOutDate)
  deadline.setDate(deadline.getDate() + MN_COMPLIANCE.RETURN_DEADLINE_DAYS)
  return deadline
}

/**
 * Calculate interest accrued on security deposit
 * MN requires 1% simple annual interest
 */
export function calculateDepositInterest(
  depositAmount: number,
  depositDate: Date,
  moveOutDate: Date,
  interestRate: number = MN_COMPLIANCE.INTEREST_RATE
): number {
  const msPerYear = 1000 * 60 * 60 * 24 * 365
  const yearsHeld = (moveOutDate.getTime() - depositDate.getTime()) / msPerYear
  const interest = depositAmount * interestRate * yearsHeld
  // Round to 2 decimal places
  return Math.round(interest * 100) / 100
}

/**
 * Check if disposition is overdue (past 21-day deadline)
 */
export function isDispositionOverdue(deadlineDate: Date, sentDate?: Date | null): boolean {
  if (sentDate) return false
  return new Date() > deadlineDate
}

/**
 * Calculate days remaining until deadline
 */
export function getDaysUntilDeadline(deadlineDate: Date): number {
  const now = new Date()
  const diffMs = deadlineDate.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// =============================================================================
// Type Exports
// =============================================================================

export type InitiateMoveOutInput = z.infer<typeof initiateMoveOutSchema>
export type CreateDamageItemInput = z.infer<typeof createDamageItemSchema>
export type UpdateDamageItemInput = z.infer<typeof updateDamageItemSchema>
export type CreateDepositDispositionInput = z.infer<typeof createDepositDispositionSchema>
export type UpdateDepositDispositionInput = z.infer<typeof updateDepositDispositionSchema>
export type SendDispositionLetterInput = z.infer<typeof sendDispositionLetterSchema>
export type ProcessRefundInput = z.infer<typeof processRefundSchema>
export type MoveOutFiltersInput = z.infer<typeof moveOutFiltersSchema>
