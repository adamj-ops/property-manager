import { z } from 'zod'

// Enums matching Prisma
export const inspectionTypeEnum = z.enum([
  'MOVE_IN',
  'MOVE_OUT',
  'ROUTINE',
  'MAINTENANCE',
  'SAFETY',
  'ANNUAL',
])

export const inspectionStatusEnum = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

export const conditionEnum = z.enum([
  'NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
])

export type InspectionType = z.infer<typeof inspectionTypeEnum>
export type InspectionStatus = z.infer<typeof inspectionStatusEnum>
export type Condition = z.infer<typeof conditionEnum>

// Inspection types for UI display
export const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: 'MOVE_IN', label: 'Move-In Inspection' },
  { value: 'MOVE_OUT', label: 'Move-Out Inspection' },
  { value: 'ROUTINE', label: 'Routine Inspection' },
  { value: 'MAINTENANCE', label: 'Maintenance Inspection' },
  { value: 'SAFETY', label: 'Safety Inspection' },
  { value: 'ANNUAL', label: 'Annual Inspection' },
]

// Pre-defined room templates
export const ROOM_TEMPLATES = {
  'Living Room': ['Walls', 'Ceiling', 'Flooring', 'Windows', 'Doors', 'Outlets', 'Light Fixtures', 'Blinds/Curtains'],
  'Kitchen': ['Walls', 'Ceiling', 'Flooring', 'Cabinets', 'Countertops', 'Sink', 'Faucet', 'Stove/Range', 'Oven', 'Refrigerator', 'Dishwasher', 'Microwave', 'Garbage Disposal', 'Outlets'],
  'Bathroom': ['Walls', 'Ceiling', 'Flooring', 'Toilet', 'Sink', 'Faucet', 'Bathtub/Shower', 'Mirror', 'Vanity', 'Exhaust Fan', 'Towel Bars'],
  'Bedroom': ['Walls', 'Ceiling', 'Flooring', 'Windows', 'Doors', 'Closet', 'Outlets', 'Light Fixtures', 'Blinds/Curtains'],
  'Hallway': ['Walls', 'Ceiling', 'Flooring', 'Light Fixtures', 'Smoke Detector'],
  'Laundry': ['Walls', 'Flooring', 'Washer Hookups', 'Dryer Hookups', 'Outlets'],
  'Exterior': ['Front Door', 'Back Door', 'Windows', 'Patio/Balcony', 'Parking Area'],
  'General': ['HVAC System', 'Water Heater', 'Smoke Detectors', 'Carbon Monoxide Detector', 'Keys/Locks'],
} as const

export type RoomType = keyof typeof ROOM_TEMPLATES

// Filters for listing inspections
export const inspectionFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  type: inspectionTypeEnum.optional(),
  status: inspectionStatusEnum.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
})

export type InspectionFilters = z.infer<typeof inspectionFiltersSchema>

// Get single inspection
export const getInspectionSchema = z.object({
  id: z.string().uuid(),
})

// Create inspection
export const createInspectionSchema = z.object({
  propertyId: z.string().uuid('Valid property ID required'),
  leaseId: z.string().uuid().optional(),
  type: inspectionTypeEnum,
  scheduledDate: z.coerce.date(),
  notes: z.string().max(2000).optional(),
})

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>

// Update inspection
export const updateInspectionSchema = z.object({
  id: z.string().uuid(),
  scheduledDate: z.coerce.date().optional(),
  status: inspectionStatusEnum.optional(),
  overallCondition: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
})

export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>

// Add inspection item
export const addInspectionItemSchema = z.object({
  inspectionId: z.string().uuid(),
  room: z.string().min(1).max(100),
  item: z.string().min(1).max(100),
  condition: conditionEnum,
  notes: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).default([]),
  hasDamage: z.boolean().default(false),
  damageDescription: z.string().max(500).optional(),
  estimatedRepairCost: z.number().min(0).optional(),
  tenantResponsible: z.boolean().default(false),
})

export type AddInspectionItemInput = z.infer<typeof addInspectionItemSchema>

// Update inspection item
export const updateInspectionItemSchema = z.object({
  id: z.string().uuid(),
  condition: conditionEnum.optional(),
  notes: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).optional(),
  hasDamage: z.boolean().optional(),
  damageDescription: z.string().max(500).optional(),
  estimatedRepairCost: z.number().min(0).optional(),
  tenantResponsible: z.boolean().optional(),
})

export type UpdateInspectionItemInput = z.infer<typeof updateInspectionItemSchema>

// Delete inspection item
export const deleteInspectionItemSchema = z.object({
  id: z.string().uuid(),
})

// Complete inspection
export const completeInspectionSchema = z.object({
  id: z.string().uuid(),
  overallCondition: z.string().min(1).max(50),
  notes: z.string().max(2000).optional(),
  signatureData: z.string().optional(), // Base64 encoded signature image
})

export type CompleteInspectionInput = z.infer<typeof completeInspectionSchema>

// Start inspection (change status to IN_PROGRESS)
export const startInspectionSchema = z.object({
  id: z.string().uuid(),
})

// Cancel inspection
export const cancelInspectionSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

export type CancelInspectionInput = z.infer<typeof cancelInspectionSchema>
