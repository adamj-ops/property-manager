import { z } from 'zod'
import { maintenanceCategoryEnum } from './maintenance.schema'

// Vendor status enum
export const vendorStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PENDING_APPROVAL',
  'SUSPENDED',
])

export type VendorStatus = z.infer<typeof vendorStatusEnum>

// Create vendor schema
export const createVendorSchema = z.object({
  // Business Information
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  altPhone: z.string().optional(),

  // Address
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  // Services
  categories: z.array(maintenanceCategoryEnum).min(1, 'Select at least one service category'),
  serviceAreas: z.array(z.string()).default([]),
  hourlyRate: z.number().min(0).optional(),

  // Insurance & Licensing
  insuranceProvider: z.string().optional(),
  insurancePolicyNum: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.coerce.date().optional(),

  // Payment
  taxId: z.string().optional(),
  paymentTerms: z.number().int().default(30),

  // Notes
  notes: z.string().optional(),
})

// Update vendor schema
export const updateVendorSchema = createVendorSchema.partial().extend({
  status: vendorStatusEnum.optional(),
  rating: z.number().min(1).max(5).optional(),
})

// Vendor filters schema
export const vendorFiltersSchema = z.object({
  status: vendorStatusEnum.optional(),
  category: maintenanceCategoryEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Vendor ID schema
export const vendorIdSchema = z.object({
  id: z.string().uuid(),
})

// Types
export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type VendorFilters = z.infer<typeof vendorFiltersSchema>
