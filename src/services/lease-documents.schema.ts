/**
 * Lease Documents Zod Schemas
 * EPM-43: Lease Document Generation
 */

import { z } from 'zod'

// Schema for generating a lease PDF
export const generateLeasePdfSchema = z.object({
  leaseId: z.string().uuid('Lease ID must be a valid UUID'),
  addendumIds: z.array(z.string().uuid()).optional().default([]),
})

export type GenerateLeasePdfInput = z.infer<typeof generateLeasePdfSchema>

// Schema for regenerating a lease PDF (with optional template override)
export const regenerateLeasePdfSchema = z.object({
  leaseId: z.string().uuid('Lease ID must be a valid UUID'),
  addendumIds: z.array(z.string().uuid()).optional().default([]),
  templateId: z.string().uuid().optional(),
})

export type RegenerateLeasePdfInput = z.infer<typeof regenerateLeasePdfSchema>

// Schema for getting a lease PDF download URL
export const getLeasePdfDownloadUrlSchema = z.object({
  leaseId: z.string().uuid('Lease ID must be a valid UUID'),
})

export type GetLeasePdfDownloadUrlInput = z.infer<typeof getLeasePdfDownloadUrlSchema>

// Response schema for document generation
export const leaseDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  leaseId: z.string().uuid(),
  documentUrl: z.string().url(),
  storagePath: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  generatedAt: z.string().datetime(),
})

export type LeaseDocumentResponse = z.infer<typeof leaseDocumentResponseSchema>

