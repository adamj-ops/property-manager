import { z } from 'zod'

export const paymentTypeEnum = z.enum([
  'RENT',
  'SECURITY_DEPOSIT',
  'PET_DEPOSIT',
  'PET_RENT',
  'LATE_FEE',
  'PARKING',
  'STORAGE',
  'UTILITY',
  'MOVE_IN_FEE',
  'APPLICATION_FEE',
  'OTHER',
])

export const paymentMethodEnum = z.enum([
  'CHECK',
  'CASH',
  'ACH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'MONEY_ORDER',
  'ONLINE_PORTAL',
  'OTHER',
])

export const paymentStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PARTIAL',
  'CANCELLED',
])

export const createPaymentSchema = z.object({
  tenantId: z.string().uuid(),
  leaseId: z.string().uuid().optional(),

  type: paymentTypeEnum,
  method: paymentMethodEnum,
  status: paymentStatusEnum.default('PENDING'),

  amount: z.number().positive('Amount is required'),
  appliedAmount: z.number().min(0).optional(),

  paymentDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  receivedDate: z.coerce.date().optional(),

  referenceNumber: z.string().optional(),
  memo: z.string().optional(),

  forPeriodStart: z.coerce.date().optional(),
  forPeriodEnd: z.coerce.date().optional(),

  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
})

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  processedAt: z.coerce.date().optional(),
  processingFee: z.number().min(0).optional(),
})

export const paymentFiltersSchema = z.object({
  tenantId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  type: paymentTypeEnum.optional(),
  status: paymentStatusEnum.optional(),
  method: paymentMethodEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const paymentIdSchema = z.object({
  id: z.string().uuid(),
})

export type PaymentType = z.infer<typeof paymentTypeEnum>
export type PaymentMethod = z.infer<typeof paymentMethodEnum>
export type PaymentStatus = z.infer<typeof paymentStatusEnum>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>
