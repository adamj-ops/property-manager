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

  // SLA fields
  slaResponseHours: z.number().int().min(1).optional(),
  slaResolutionHours: z.number().int().min(1).optional(),

  // Template reference
  templateId: z.string().uuid().optional(),
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
  attachments: z.array(z.string()).optional(),
})

export type MaintenanceStatus = z.infer<typeof maintenanceStatusEnum>
export type MaintenancePriority = z.infer<typeof maintenancePriorityEnum>
export type MaintenanceCategory = z.infer<typeof maintenanceCategoryEnum>
// Photo upload schemas
export const photoUploadRequestSchema = z.object({
  requestId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  photoType: z.enum(['initial', 'completion']).default('initial'),
})

export const photoUrlsSchema = z.object({
  requestId: z.string().uuid(),
  photoType: z.enum(['initial', 'completion']).optional(),
})

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>
export type MaintenanceFilters = z.infer<typeof maintenanceFiltersSchema>
export type PhotoUploadRequest = z.infer<typeof photoUploadRequestSchema>

// =============================================================================
// BULK ACTIONS
// =============================================================================

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one work order must be selected'),
  status: maintenanceStatusEnum,
})

export const bulkAssignVendorSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one work order must be selected'),
  vendorId: z.string().uuid(),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one work order must be selected'),
})

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>
export type BulkAssignVendorInput = z.infer<typeof bulkAssignVendorSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>

// =============================================================================
// WORK ORDER TEMPLATES
// =============================================================================

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: maintenanceCategoryEnum,
  priority: maintenancePriorityEnum.default('MEDIUM'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  slaResponseHours: z.number().int().min(1).optional(),
  slaResolutionHours: z.number().int().min(1).optional(),
  estimatedCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  suggestVendorByCategory: z.boolean().default(true),
})

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const templateIdSchema = z.object({
  id: z.string().uuid(),
})

export const templateFiltersSchema = z.object({
  category: maintenanceCategoryEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type TemplateFilters = z.infer<typeof templateFiltersSchema>

// =============================================================================
// EXPORT
// =============================================================================

export const exportFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: maintenanceStatusEnum.optional(),
  priority: maintenancePriorityEnum.optional(),
  category: maintenanceCategoryEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

export type ExportFilters = z.infer<typeof exportFiltersSchema>

// =============================================================================
// COMMENT ATTACHMENTS
// =============================================================================

export const commentAttachmentUploadSchema = z.object({
  requestId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
})

export const commentIdSchema = z.object({
  commentId: z.string().uuid(),
})

export type CommentAttachmentUpload = z.infer<typeof commentAttachmentUploadSchema>
