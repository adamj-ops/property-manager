import { z } from 'zod'

// Enums matching database
export const propertyTypeEnum = z.enum([
  'SINGLE_FAMILY',
  'MULTI_FAMILY',
  'APARTMENT',
  'CONDO',
  'TOWNHOUSE',
  'COMMERCIAL',
  'MIXED_USE',
])

export const propertyStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'UNDER_RENOVATION',
  'FOR_SALE',
])

// Create property schema
export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  type: propertyTypeEnum.default('MULTI_FAMILY'),
  status: propertyStatusEnum.default('ACTIVE'),

  // Address
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().default('MN'),
  zipCode: z.string().min(5, 'Valid zip code required'),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Property Details
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  totalUnits: z.number().int().min(1).default(1),
  totalSqFt: z.number().int().positive().optional(),
  lotSize: z.number().positive().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).default([]),

  // Compliance
  rentalLicenseNumber: z.string().optional(),
  rentalLicenseExpiry: z.coerce.date().optional(),
  leadPaintDisclosure: z.boolean().default(false),
  builtBefore1978: z.boolean().default(false),

  // Financial
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.coerce.date().optional(),
  currentValue: z.number().positive().optional(),
  mortgageBalance: z.number().min(0).optional(),

  // Metadata
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

// Update property schema (all fields optional)
export const updatePropertySchema = createPropertySchema.partial()

// Query filters
export const propertyFiltersSchema = z.object({
  status: propertyStatusEnum.optional(),
  type: propertyTypeEnum.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// ID param schema
export const propertyIdSchema = z.object({
  id: z.string().uuid(),
})

export type PropertyType = z.infer<typeof propertyTypeEnum>
export type PropertyStatus = z.infer<typeof propertyStatusEnum>
export type CreatePropertyInput = z.infer<typeof createPropertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>
