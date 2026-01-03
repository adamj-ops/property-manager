/**
 * Lease Templates Schema Unit Tests
 * EPM-83: Lease Template Import & Management
 */

import { describe, expect, it } from 'vitest'

import {
  createTemplateSchema,
  updateTemplateSchema,
  templateFiltersSchema,
  leaseTemplateTypeEnum,
  TEMPLATE_TYPE_LABELS,
} from '../../src/services/lease-templates.schema'

describe('Lease Templates Schema', () => {
  describe('leaseTemplateTypeEnum', () => {
    it('should accept all valid template types', () => {
      const validTypes = [
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
      ]

      for (const type of validTypes) {
        const result = leaseTemplateTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid template types', () => {
      const result = leaseTemplateTypeEnum.safeParse('INVALID_TYPE')
      expect(result.success).toBe(false)
    })
  })

  describe('TEMPLATE_TYPE_LABELS', () => {
    it('should have labels for all template types', () => {
      const types = leaseTemplateTypeEnum.options

      for (const type of types) {
        expect(TEMPLATE_TYPE_LABELS[type]).toBeDefined()
        expect(typeof TEMPLATE_TYPE_LABELS[type]).toBe('string')
      }
    })

    it('should have human-readable labels', () => {
      expect(TEMPLATE_TYPE_LABELS.MAIN_LEASE).toBe('Main Lease Agreement')
      expect(TEMPLATE_TYPE_LABELS.ADDENDUM_PET).toBe('Pet Addendum')
      expect(TEMPLATE_TYPE_LABELS.ADDENDUM_LEAD_PAINT).toBe('Lead Paint Disclosure')
    })
  })

  describe('createTemplateSchema', () => {
    it('should accept valid template data', () => {
      const validData = {
        name: 'Test Template',
        type: 'MAIN_LEASE',
        description: 'A test template',
      }

      const result = createTemplateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require name and type', () => {
      const missingName = { type: 'MAIN_LEASE' }
      const missingType = { name: 'Test' }

      expect(createTemplateSchema.safeParse(missingName).success).toBe(false)
      expect(createTemplateSchema.safeParse(missingType).success).toBe(false)
    })

    it('should validate name length', () => {
      const emptyName = { name: '', type: 'MAIN_LEASE' }
      const validName = { name: 'Valid Name', type: 'MAIN_LEASE' }

      expect(createTemplateSchema.safeParse(emptyName).success).toBe(false)
      expect(createTemplateSchema.safeParse(validName).success).toBe(true)
    })

    it('should accept optional file upload fields', () => {
      const withFile = {
        name: 'Template',
        type: 'MAIN_LEASE',
        fileName: 'template.docx',
        fileSize: 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }

      const result = createTemplateSchema.safeParse(withFile)
      expect(result.success).toBe(true)
    })

    it('should default minnesotaCompliant to true', () => {
      const data = { name: 'Test', type: 'MAIN_LEASE' }
      const result = createTemplateSchema.parse(data)

      expect(result.minnesotaCompliant).toBe(true)
    })
  })

  describe('updateTemplateSchema', () => {
    it('should require id', () => {
      const withoutId = { name: 'New Name' }
      const withId = { id: '123e4567-e89b-12d3-a456-426614174000', name: 'New Name' }

      expect(updateTemplateSchema.safeParse(withoutId).success).toBe(false)
      expect(updateTemplateSchema.safeParse(withId).success).toBe(true)
    })

    it('should accept partial updates', () => {
      const result = updateTemplateSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Updated description only',
      })

      expect(result.success).toBe(true)
    })

    it('should validate uuid format for id', () => {
      const invalidId = { id: 'not-a-uuid', name: 'Test' }
      const validId = { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test' }

      expect(updateTemplateSchema.safeParse(invalidId).success).toBe(false)
      expect(updateTemplateSchema.safeParse(validId).success).toBe(true)
    })
  })

  describe('templateFiltersSchema', () => {
    it('should accept empty filters', () => {
      const result = templateFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should provide defaults for limit and offset', () => {
      const result = templateFiltersSchema.parse({})

      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })

    it('should accept valid filters', () => {
      const filters = {
        type: 'ADDENDUM_PET',
        isActive: true,
        isArchived: false,
        search: 'pet',
        limit: 10,
        offset: 20,
      }

      const result = templateFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('should validate limit range', () => {
      const tooLow = { limit: 0 }
      const tooHigh = { limit: 200 }
      const valid = { limit: 50 }

      expect(templateFiltersSchema.safeParse(tooLow).success).toBe(false)
      expect(templateFiltersSchema.safeParse(tooHigh).success).toBe(false)
      expect(templateFiltersSchema.safeParse(valid).success).toBe(true)
    })
  })
})

