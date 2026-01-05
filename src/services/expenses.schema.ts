import { z } from 'zod'

// Enums matching Prisma schema
export const expenseCategoryEnum = z.enum([
  'MAINTENANCE',
  'REPAIRS',
  'UTILITIES',
  'INSURANCE',
  'PROPERTY_TAX',
  'MORTGAGE',
  'HOA_FEES',
  'MANAGEMENT_FEE',
  'LEGAL',
  'ADVERTISING',
  'SUPPLIES',
  'LANDSCAPING',
  'CLEANING',
  'PEST_CONTROL',
  'CAPITAL_IMPROVEMENT',
  'OTHER',
])

export const expenseStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'PAID',
  'REJECTED',
  'CANCELLED',
])

// Create expense schema
export const createExpenseSchema = z.object({
  propertyId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  maintenanceRequestId: z.string().uuid().optional(),

  category: expenseCategoryEnum,
  status: expenseStatusEnum.default('PENDING'),

  amount: z.number().positive('Amount must be positive'),
  taxDeductible: z.boolean().default(true),

  description: z.string().min(1, 'Description is required'),
  expenseDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),

  invoiceNumber: z.string().optional(),
  referenceNumber: z.string().optional(),

  receiptUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

// Update expense schema
export const updateExpenseSchema = createExpenseSchema.partial()

// Expense filters schema
export const expenseFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  category: expenseCategoryEnum.optional(),
  status: expenseStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  taxDeductible: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Expense ID schema
export const expenseIdSchema = z.object({
  id: z.string().uuid(),
})

// Expense summary by category schema
export const expenseSummaryFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Recurring expense schema
export const createRecurringExpenseSchema = createExpenseSchema.extend({
  recurrencePattern: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  recurrenceStartDate: z.coerce.date(),
  recurrenceEndDate: z.coerce.date().optional(),
})

// Type exports
export type ExpenseCategory = z.infer<typeof expenseCategoryEnum>
export type ExpenseStatus = z.infer<typeof expenseStatusEnum>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>
export type ExpenseSummaryFilters = z.infer<typeof expenseSummaryFiltersSchema>
export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>
