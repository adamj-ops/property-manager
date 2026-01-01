import { z } from 'zod'

export const maintenanceStatusEnum = z.enum([
  'SUBMITTED',
  'ACKNOWLEDGED',
  'SCHEDULED',
  'IN_PROGRESS',
  'PENDING_PARTS',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
])

export const maintenancePriorityEnum = z.enum([
  'EMERGENCY',
  'HIGH',
  'MEDIUM',
  'LOW',
])

export const maintenanceCategoryEnum = z.enum([
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'STRUCTURAL',
  'PEST_CONTROL',
  'LANDSCAPING',
  'CLEANING',
  'PAINTING',
  'FLOORING',
  'WINDOWS_DOORS',
  'ROOF',
  'SAFETY',
  'OTHER',
])

export const createMaintenanceSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),

  category: maintenanceCategoryEnum,
  priority: maintenancePriorityEnum.default('MEDIUM'),
  status: maintenanceStatusEnum.default('SUBMITTED'),

  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  permissionToEnter: z.boolean().default(true),
  preferredTimes: z.string().optional(),

  scheduledDate: z.coerce.date().optional(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().min(0).optional(),

  estimatedCost: z.number().min(0).optional(),
  tenantCharge: z.number().min(0).optional(),

  photoUrls: z.array(z.string().url()).default([]),
  notes: z.string().optional(),
})

export const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  actualCost: z.number().min(0).optional(),
  completedAt: z.coerce.date().optional(),
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),
})

export const maintenanceFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  status: maintenanceStatusEnum.optional(),
  priority: maintenancePriorityEnum.optional(),
  category: maintenanceCategoryEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const maintenanceIdSchema = z.object({
  id: z.string().uuid(),
})

export const addCommentSchema = z.object({
  requestId: z.string().uuid(),
  content: z.string().min(1),
  isInternal: z.boolean().default(false),
})

export type MaintenanceStatus = z.infer<typeof maintenanceStatusEnum>
export type MaintenancePriority = z.infer<typeof maintenancePriorityEnum>
export type MaintenanceCategory = z.infer<typeof maintenanceCategoryEnum>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>
export type MaintenanceFilters = z.infer<typeof maintenanceFiltersSchema>
