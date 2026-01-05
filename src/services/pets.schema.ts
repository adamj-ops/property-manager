import { z } from 'zod'

// Enums matching Prisma
export const petTypeEnum = z.enum([
  'DOG',
  'CAT',
  'BIRD',
  'FISH',
  'REPTILE',
  'SMALL_MAMMAL',
  'OTHER',
])

export const petStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'DENIED',
  'REMOVED',
])

export type PetType = z.infer<typeof petTypeEnum>
export type PetStatus = z.infer<typeof petStatusEnum>

// Filters for listing pets
export const petFiltersSchema = z.object({
  tenantId: z.string().uuid().optional(),
  status: petStatusEnum.optional(),
  type: petTypeEnum.optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
})

export type PetFilters = z.infer<typeof petFiltersSchema>

// Get single pet
export const getPetSchema = z.object({
  id: z.string().uuid(),
})

// Create pet application
export const createPetSchema = z.object({
  tenantId: z.string().uuid('Valid tenant ID required'),
  type: petTypeEnum,
  name: z.string().min(1, 'Pet name is required').max(100),
  breed: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  weight: z.number().positive().max(500).optional(),
  age: z.number().int().min(0).max(50).optional(),
  vaccinated: z.boolean().default(false),
  vaccinationExpiry: z.coerce.date().optional(),
  rabiesTagNumber: z.string().max(50).optional(),
  licensedWithCity: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
})

export type CreatePetInput = z.infer<typeof createPetSchema>

// Update pet
export const updatePetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  weight: z.number().positive().max(500).optional(),
  age: z.number().int().min(0).max(50).optional(),
  vaccinated: z.boolean().optional(),
  vaccinationExpiry: z.coerce.date().optional(),
  rabiesTagNumber: z.string().max(50).optional(),
  licensedWithCity: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
})

export type UpdatePetInput = z.infer<typeof updatePetSchema>

// Approve pet
export const approvePetSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export type ApprovePetInput = z.infer<typeof approvePetSchema>

// Deny pet
export const denyPetSchema = z.object({
  id: z.string().uuid(),
  denialReason: z.string().min(1, 'Denial reason is required').max(500),
})

export type DenyPetInput = z.infer<typeof denyPetSchema>

// Remove pet (no longer at property)
export const removePetSchema = z.object({
  id: z.string().uuid(),
  removalReason: z.string().max(500).optional(),
})

export type RemovePetInput = z.infer<typeof removePetSchema>
