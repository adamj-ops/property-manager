import { z } from 'zod'
import { maintenanceCategoryEnum, maintenancePriorityEnum } from '~/services/maintenance.schema'

// Recurrence frequency enum
export const recurrenceFrequencyEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'BIANNUALLY',
  'ANNUALLY',
])

export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencyEnum>

// Create schedule schema
export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),

  // What to create
  category: maintenanceCategoryEnum,
  priority: maintenancePriorityEnum.default('MEDIUM'),
  title: z.string().min(1, 'Work order title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),

  // Recurrence settings
  frequency: recurrenceFrequencyEnum,
  intervalCount: z.number().int().min(1).default(1),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  monthOfYear: z.number().int().min(1).max(12).optional(),

  // Scheduling
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),

  // Cost estimate
  estimatedCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(0).optional(),

  // Assignment
  autoAssignVendor: z.boolean().default(false),

  // Scope - either property-wide or specific unit
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
}).refine(
  (data) => data.propertyId || data.unitId,
  { message: 'Either property or unit must be specified', path: ['propertyId'] }
)

// Update schedule schema
export const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),

  // What to create
  category: maintenanceCategoryEnum.optional(),
  priority: maintenancePriorityEnum.optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().optional().nullable(),

  // Recurrence settings
  frequency: recurrenceFrequencyEnum.optional(),
  intervalCount: z.number().int().min(1).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  monthOfYear: z.number().int().min(1).max(12).optional().nullable(),

  // Scheduling
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),

  // Cost estimate
  estimatedCost: z.number().min(0).optional().nullable(),
  estimatedDuration: z.number().int().min(0).optional().nullable(),

  // Assignment
  autoAssignVendor: z.boolean().optional(),
  vendorId: z.string().uuid().optional().nullable(),
})

// Schedule ID schema
export const scheduleIdSchema = z.object({
  id: z.string().uuid(),
})

// Schedule filters schema
export const scheduleFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  frequency: recurrenceFrequencyEnum.optional(),
  search: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
})

// Type exports
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type ScheduleFilters = z.infer<typeof scheduleFiltersSchema>

// Helper labels for UI
export const frequencyLabels: Record<RecurrenceFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 Weeks',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BIANNUALLY: 'Every 6 Months',
  ANNUALLY: 'Annually',
}

export const dayOfWeekLabels = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
