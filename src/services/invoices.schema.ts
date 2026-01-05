import { z } from 'zod'

// =============================================================================
// INVOICE STATUS ENUM
// =============================================================================

export const invoiceStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CANCELLED',
])

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PAID: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const invoiceIdSchema = z.object({
  id: z.string().uuid(),
})

export const invoiceFiltersSchema = z.object({
  requestId: z.string().uuid(),
  status: invoiceStatusSchema.optional(),
  vendorId: z.string().uuid().optional(),
})

// =============================================================================
// CREATE INVOICE SCHEMA
// =============================================================================

export const createInvoiceSchema = z.object({
  requestId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  vendorInvoiceNumber: z.string().max(100).optional(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  description: z.string().max(500).optional(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  // File info (from upload)
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
})

// =============================================================================
// UPDATE INVOICE SCHEMA
// =============================================================================

export const updateInvoiceSchema = z.object({
  vendorId: z.string().uuid().optional().nullable(),
  vendorInvoiceNumber: z.string().max(100).optional().nullable(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
})

// =============================================================================
// WORKFLOW SCHEMAS
// =============================================================================

export const submitInvoiceSchema = z.object({
  id: z.string().uuid(),
})

export const startReviewSchema = z.object({
  id: z.string().uuid(),
})

export const approveInvoiceSchema = z.object({
  id: z.string().uuid(),
  reviewNotes: z.string().max(1000).optional(),
  // Optional: create cost line items from invoice
  createCostLineItems: z.boolean().default(false),
  costLineItemType: z.enum([
    'LABOR',
    'PARTS',
    'MATERIALS',
    'PERMITS',
    'TRAVEL',
    'EMERGENCY_FEE',
    'DISPOSAL',
    'SUBCONTRACTOR',
    'OTHER',
  ]).optional(),
  costLineItemDescription: z.string().optional(),
})

export const rejectInvoiceSchema = z.object({
  id: z.string().uuid(),
  rejectionReason: z.string().min(1).max(1000),
})

export const markInvoicePaidSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: z.enum(['CHECK', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER']),
  paymentReference: z.string().max(100).optional(),
})

export const cancelInvoiceSchema = z.object({
  id: z.string().uuid(),
})

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  vendorInvoiceNumber: string | null
  invoiceDate: string
  dueDate: string | null
  description: string | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  submittedAt: string | null
  reviewStartedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  paidAt: string | null
  reviewNotes: string | null
  rejectionReason: string | null
  paymentMethod: string | null
  paymentReference: string | null
  createdAt: string
  updatedAt: string
  requestId: string
  vendorId: string | null
  vendor?: {
    id: string
    companyName: string
  } | null
  submittedBy?: {
    id: string
    name: string
  } | null
  reviewedBy?: {
    id: string
    name: string
  } | null
  costLineItems?: Array<{
    id: string
    description: string
    totalCost: number
  }>
}

export interface InvoiceSummary {
  totalInvoices: number
  totalAmount: number
  byStatus: Array<{
    status: InvoiceStatus
    count: number
    amount: number
  }>
  pendingApproval: number
  pendingPayment: number
}

// =============================================================================
// UPLOAD SCHEMA
// =============================================================================

export const invoiceUploadSchema = z.object({
  requestId: z.string().uuid(),
  file: z.instanceof(File),
})

// Payment method options for UI
export const paymentMethodOptions = [
  { value: 'CHECK', label: 'Check' },
  { value: 'ACH', label: 'ACH Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
] as const
