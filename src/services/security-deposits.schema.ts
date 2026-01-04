import { z } from 'zod'

// Security deposit calculation input
export const depositCalculationSchema = z.object({
  leaseId: z.string().uuid(),
})

// Deduction item for disposition
export const deductionItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.enum([
    'CLEANING',
    'REPAIRS',
    'UNPAID_RENT',
    'LATE_FEES',
    'UTILITIES',
    'OTHER',
  ]),
})

// Create disposition schema
export const createDispositionSchema = z.object({
  leaseId: z.string().uuid(),
  deductions: z.array(deductionItemSchema).default([]),
  notes: z.string().optional(),
})

// Update disposition schema
export const updateDispositionSchema = createDispositionSchema.partial().extend({
  leaseId: z.string().uuid(),
})

// Mark interest paid schema
export const markInterestPaidSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.coerce.date().optional(),
  paymentMethod: z.enum(['CHECK', 'ACH', 'CASH', 'OTHER']).optional(),
  notes: z.string().optional(),
})

// Deposit filters schema
export const depositFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'PENDING_DISPOSITION', 'DISPOSED', 'REFUNDED']).optional(),
  interestDueSoon: z.boolean().optional(), // Within 30 days
  dispositionDueSoon: z.boolean().optional(), // Within 21 days of move-out
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Generate disposition letter schema
export const generateDispositionLetterSchema = z.object({
  leaseId: z.string().uuid(),
  sendEmail: z.boolean().default(false),
})

// Process refund schema
export const processRefundSchema = z.object({
  leaseId: z.string().uuid(),
  refundAmount: z.number().min(0, 'Refund amount must be non-negative'),
  paymentMethod: z.enum(['CHECK', 'ACH', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

// Type exports
export type DeductionItem = z.infer<typeof deductionItemSchema>
export type CreateDispositionInput = z.infer<typeof createDispositionSchema>
export type UpdateDispositionInput = z.infer<typeof updateDispositionSchema>
export type MarkInterestPaidInput = z.infer<typeof markInterestPaidSchema>
export type DepositFilters = z.infer<typeof depositFiltersSchema>
export type GenerateDispositionLetterInput = z.infer<typeof generateDispositionLetterSchema>
export type ProcessRefundInput = z.infer<typeof processRefundSchema>

// Deposit status type
export type DepositStatus = 'ACTIVE' | 'PENDING_DISPOSITION' | 'DISPOSED' | 'REFUNDED'

// Deposit with calculated fields
export interface SecurityDepositDetails {
  leaseId: string
  tenantName: string
  unitNumber: string
  propertyName: string
  depositAmount: number
  depositPaidDate: Date | null
  interestRate: number // 0.01 = 1%
  status: DepositStatus
  // Calculated fields
  daysHeld: number
  interestAccrued: number
  interestPaid: number
  interestOwed: number
  // Move-out details (if applicable)
  moveOutDate: Date | null
  dispositionDueDate: Date | null
  dispositionSentDate: Date | null
  totalDeductions: number
  refundAmount: number
  refundPaidDate: Date | null
}
