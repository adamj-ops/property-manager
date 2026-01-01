import { z } from 'zod'

export const leaseStatusEnum = z.enum([
  'DRAFT',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'EXPIRED',
  'RENEWED',
  'TERMINATED',
  'MONTH_TO_MONTH',
])

export const leaseTypeEnum = z.enum([
  'FIXED_TERM',
  'MONTH_TO_MONTH',
  'WEEK_TO_WEEK',
])

export const createLeaseSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid(),
  status: leaseStatusEnum.default('DRAFT'),
  type: leaseTypeEnum.default('FIXED_TERM'),

  // Lease Term
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  moveInDate: z.coerce.date().optional(),
  signedDate: z.coerce.date().optional(),

  // Rent Information
  monthlyRent: z.number().positive('Monthly rent is required'),
  rentDueDay: z.number().int().min(1).max(31).default(1),
  lateFeeAmount: z.number().min(0).max(50).default(50), // MN cap
  lateFeeGraceDays: z.number().int().min(0).default(5),

  // Security Deposit
  securityDeposit: z.number().min(0),
  depositPaidDate: z.coerce.date().optional(),
  depositInterestRate: z.number().min(0).max(0.1).default(0.01), // MN: 1%
  depositBankName: z.string().optional(),
  depositAccountLast4: z.string().max(4).optional(),

  // Pet Information
  petsAllowed: z.boolean().default(false),
  petDeposit: z.number().min(0).optional(),
  petRent: z.number().min(0).optional(),

  // Utilities
  utilitiesTenantPays: z.array(z.string()).default([]),
  utilitiesOwnerPays: z.array(z.string()).default([]),

  // Additional Terms
  parkingIncluded: z.boolean().default(false),
  parkingFee: z.number().min(0).optional(),
  storageIncluded: z.boolean().default(false),
  storageFee: z.number().min(0).optional(),

  // Renewal
  autoRenew: z.boolean().default(false),
  renewalNoticeDays: z.number().int().min(0).default(60),
  renewalRentIncrease: z.number().min(0).max(100).optional(),

  // Documents
  leaseDocumentUrl: z.string().url().optional(),
  signedDocumentUrl: z.string().url().optional(),

  // Metadata
  notes: z.string().optional(),
})

export const updateLeaseSchema = createLeaseSchema.omit({ unitId: true, tenantId: true }).partial()

export const leaseFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  status: leaseStatusEnum.optional(),
  expiringWithinDays: z.number().int().min(1).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const leaseIdSchema = z.object({
  id: z.string().uuid(),
})

export type LeaseStatus = z.infer<typeof leaseStatusEnum>
export type LeaseType = z.infer<typeof leaseTypeEnum>
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>
export type LeaseFilters = z.infer<typeof leaseFiltersSchema>
