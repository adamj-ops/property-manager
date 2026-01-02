import { z } from 'zod'

// Document types enum matching database
export const DocumentType = z.enum([
  'LEASE',
  'ADDENDUM',
  'APPLICATION',
  'ID_DOCUMENT',
  'INCOME_VERIFICATION',
  'INSPECTION_REPORT',
  'PHOTO',
  'INVOICE',
  'RECEIPT',
  'NOTICE',
  'CORRESPONDENCE',
  'INSURANCE',
  'LICENSE',
  'OTHER',
])

export type DocumentType = z.infer<typeof DocumentType>

// Document status enum matching database
export const DocumentStatus = z.enum([
  'DRAFT',
  'PENDING',
  'ACTIVE',
  'ARCHIVED',
  'DELETED',
])

export type DocumentStatus = z.infer<typeof DocumentStatus>

// Schema for creating a document upload request
export const createDocumentUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  type: DocumentType,
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
})

export type CreateDocumentUpload = z.infer<typeof createDocumentUploadSchema>

// Schema for confirming upload completion
export const confirmDocumentUploadSchema = z.object({
  documentId: z.string().uuid(),
})

export type ConfirmDocumentUpload = z.infer<typeof confirmDocumentUploadSchema>

// Schema for document filters
export const documentFiltersSchema = z.object({
  type: DocumentType.optional(),
  status: DocumentStatus.optional(),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
})

export type DocumentFilters = z.infer<typeof documentFiltersSchema>

// Schema for document ID parameter
export const documentIdSchema = z.object({
  id: z.string().uuid(),
})

export type DocumentId = z.infer<typeof documentIdSchema>

// Schema for updating document metadata
export const updateDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  type: DocumentType.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export type UpdateDocument = z.infer<typeof updateDocumentSchema>
