import { z } from 'zod'

export const createLeaseRenewalSchema = z.object({
  leaseId: z.string().uuid('Invalid lease ID'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  rentIncreasePercent: z.number().min(0).max(100).optional(),

  // Optional overrides for renewal
  securityDeposit: z.number().min(0).optional(),
  petRent: z.number().min(0).optional(),
  notes: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const leaseRenewalIdSchema = z.object({
  id: z.string().uuid(),
})

export type CreateLeaseRenewalInput = z.infer<typeof createLeaseRenewalSchema>
