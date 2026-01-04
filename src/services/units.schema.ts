import { z } from 'zod'

export const unitStatusEnum = z.enum([
  'VACANT',
  'OCCUPIED',
  'NOTICE_GIVEN',
  'UNDER_RENOVATION',
  'OFF_MARKET',
])

export const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1, 'Unit number is required'),
  status: unitStatusEnum.default('VACANT'),

  // Unit Details
  floorPlan: z.string().optional(),
  bedrooms: z.number().int().min(0).default(1),
  bathrooms: z.number().min(0).default(1),
  sqFt: z.number().int().positive().optional(),
  floor: z.number().int().optional(),

  // Rent Information
  marketRent: z.number().positive('Market rent is required'),
  currentRent: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),

  // Features
  features: z.array(z.string()).default([]),
  petFriendly: z.boolean().default(false),
  petDeposit: z.number().min(0).optional(),
  petRent: z.number().min(0).optional(),

  // Appliances & Utilities
  appliances: z.array(z.string()).default([]),
  utilitiesIncluded: z.array(z.string()).default([]),

  // Metadata
  notes: z.string().optional(),
  imageUrls: z.array(z.string().url()).default([]),
})

export const updateUnitSchema = createUnitSchema.omit({ propertyId: true }).partial()

export const unitFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: unitStatusEnum.optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxRent: z.number().positive().optional(),
  petFriendly: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const unitIdSchema = z.object({
  id: z.string().uuid(),
})

export const bulkCreateUnitsSchema = z.object({
  propertyId: z.string().uuid(),
  units: z.array(createUnitSchema.omit({ propertyId: true })).min(1).max(100),
})

export const bulkDeleteUnitsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one unit').max(100),
})

export type UnitStatus = z.infer<typeof unitStatusEnum>
export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>
export type UnitFilters = z.infer<typeof unitFiltersSchema>
export type BulkCreateUnitsInput = z.infer<typeof bulkCreateUnitsSchema>
export type BulkDeleteUnitsInput = z.infer<typeof bulkDeleteUnitsSchema>
