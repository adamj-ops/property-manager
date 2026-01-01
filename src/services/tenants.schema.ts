import { z } from 'zod'

export const tenantStatusEnum = z.enum([
  'APPLICANT',
  'APPROVED',
  'ACTIVE',
  'PAST',
  'EVICTED',
  'DENIED',
])

export const createTenantSchema = z.object({
  status: tenantStatusEnum.default('APPLICANT'),

  // Personal Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),

  // Identification
  ssn: z.string().max(4).optional(), // Last 4 only
  driversLicense: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Employment
  employer: z.string().optional(),
  employerPhone: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.number().min(0).optional(),

  // Previous Rental
  previousAddress: z.string().optional(),
  previousLandlord: z.string().optional(),
  previousLandlordPhone: z.string().optional(),
  reasonForLeaving: z.string().optional(),

  // Vehicle
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional(),
  vehicleColor: z.string().optional(),
  licensePlate: z.string().optional(),

  // Preferences
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).default('email'),

  // Metadata
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

export const updateTenantSchema = createTenantSchema.partial()

export const tenantFiltersSchema = z.object({
  status: tenantStatusEnum.optional(),
  search: z.string().optional(),
  hasActiveLease: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const tenantIdSchema = z.object({
  id: z.string().uuid(),
})

export type TenantStatus = z.infer<typeof tenantStatusEnum>
export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
export type TenantFilters = z.infer<typeof tenantFiltersSchema>
