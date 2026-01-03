/**
 * Lease Templates Zod Schemas
 * EPM-83: Lease Template Import & Management
 */

import { z } from 'zod'

// Template type enum matching database
export const leaseTemplateTypeEnum = z.enum([
  'MAIN_LEASE',
  'ADDENDUM_PET',
  'ADDENDUM_PARKING',
  'ADDENDUM_CRIME_FREE',
  'ADDENDUM_LEAD_PAINT',
  'ADDENDUM_SECURITY_DEPOSIT',
  'ADDENDUM_UTILITIES',
  'ADDENDUM_SMOKING',
  'ADDENDUM_GUEST',
  'ADDENDUM_CUSTOM',
])

export type LeaseTemplateType = z.infer<typeof leaseTemplateTypeEnum>

// Template type labels for UI
export const TEMPLATE_TYPE_LABELS: Record<LeaseTemplateType, string> = {
  MAIN_LEASE: 'Main Lease Agreement',
  ADDENDUM_PET: 'Pet Addendum',
  ADDENDUM_PARKING: 'Parking Addendum',
  ADDENDUM_CRIME_FREE: 'Crime-Free Housing Addendum',
  ADDENDUM_LEAD_PAINT: 'Lead Paint Disclosure',
  ADDENDUM_SECURITY_DEPOSIT: 'Security Deposit Addendum',
  ADDENDUM_UTILITIES: 'Utilities Addendum',
  ADDENDUM_SMOKING: 'Smoking Policy Addendum',
  ADDENDUM_GUEST: 'Guest Policy Addendum',
  ADDENDUM_CUSTOM: 'Custom Addendum',
}

// Schema for creating a new template (import)
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  type: leaseTemplateTypeEnum,
  description: z.string().max(1000).optional(),

  // For DOCX upload - file info
  fileName: z.string().min(1).optional(),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),

  // For text-based templates (addenda)
  templateContent: z.string().optional(),

  // Compliance
  minnesotaCompliant: z.boolean().default(true),
  complianceNotes: z.string().max(500).optional(),
})

export type CreateTemplate = z.infer<typeof createTemplateSchema>

// Schema for updating template metadata
export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  minnesotaCompliant: z.boolean().optional(),
  complianceNotes: z.string().max(500).optional(),
  templateContent: z.string().optional(),
})

export type UpdateTemplate = z.infer<typeof updateTemplateSchema>

// Schema for duplicating a template
export const duplicateTemplateSchema = z.object({
  sourceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  createNewVersion: z.boolean().default(false),
  changeNotes: z.string().max(500).optional(),
})

export type DuplicateTemplate = z.infer<typeof duplicateTemplateSchema>

// Schema for previewing a template with sample data
export const previewTemplateSchema = z.object({
  id: z.string().uuid(),
  sampleData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export type PreviewTemplate = z.infer<typeof previewTemplateSchema>

// Schema for filtering templates
export const templateFiltersSchema = z.object({
  type: leaseTemplateTypeEnum.optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type TemplateFilters = z.infer<typeof templateFiltersSchema>

// Schema for getting a single template
export const templateIdSchema = z.object({
  id: z.string().uuid(),
})

export type TemplateId = z.infer<typeof templateIdSchema>

// Schema for setting default template
export const setDefaultTemplateSchema = z.object({
  id: z.string().uuid(),
  type: leaseTemplateTypeEnum,
})

export type SetDefaultTemplate = z.infer<typeof setDefaultTemplateSchema>

// Schema for confirming template upload
export const confirmTemplateUploadSchema = z.object({
  id: z.string().uuid(),
  variables: z.array(z.string()).optional(),
  templateContent: z.string().optional(),
})

export type ConfirmTemplateUpload = z.infer<typeof confirmTemplateUploadSchema>

// Schema for archiving a template
export const archiveTemplateSchema = z.object({
  id: z.string().uuid(),
  archive: z.boolean().default(true),
})

export type ArchiveTemplate = z.infer<typeof archiveTemplateSchema>

// Output types for API responses
export const leaseTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: leaseTemplateTypeEnum,
  version: z.number(),
  templateFileUrl: z.string().nullable(),
  templateFilePath: z.string().nullable(),
  templateContent: z.string().nullable(),
  variables: z.array(z.string()),
  variableSchema: z.record(z.string(), z.unknown()).nullable(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  parentTemplateId: z.string().uuid().nullable(),
  changeNotes: z.string().nullable(),
  minnesotaCompliant: z.boolean(),
  complianceNotes: z.string().nullable(),
  createdById: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type LeaseTemplate = z.infer<typeof leaseTemplateSchema>

// Template preview result
export const templatePreviewResultSchema = z.object({
  content: z.string(),
  usedVariables: z.array(z.string()),
  missingVariables: z.array(z.string()),
})

export type TemplatePreviewResult = z.infer<typeof templatePreviewResultSchema>

