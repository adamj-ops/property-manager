/**
 * Template Variables Unit Tests
 * EPM-83: Lease Template Import & Management
 */

import { describe, expect, it } from 'vitest'

import {
  STANDARD_VARIABLES,
  buildVariableSchema,
  getAvailableVariableNames,
  getRequiredVariableNames,
  validateVariables,
  getVariableDefinition,
  getSampleData,
  formatVariableValue,
} from '../../src/server/template-variables'

describe('Template Variables', () => {
  describe('STANDARD_VARIABLES', () => {
    it('should have at least 30 defined variables', () => {
      expect(STANDARD_VARIABLES.length).toBeGreaterThanOrEqual(30)
    })

    it('should have unique variable names', () => {
      const names = STANDARD_VARIABLES.map((v) => v.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have valid categories for all variables', () => {
      const validCategories = [
        'tenant',
        'property',
        'unit',
        'lease',
        'financial',
        'compliance',
        'pet',
        'parking',
        'utilities',
      ]
      for (const variable of STANDARD_VARIABLES) {
        expect(validCategories).toContain(variable.category)
      }
    })

    it('should have valid types for all variables', () => {
      const validTypes = ['string', 'number', 'date', 'boolean', 'currency']
      for (const variable of STANDARD_VARIABLES) {
        expect(validTypes).toContain(variable.type)
      }
    })
  })

  describe('buildVariableSchema', () => {
    it('should group variables by category', () => {
      const schema = buildVariableSchema()

      expect(schema.categories).toHaveProperty('tenant')
      expect(schema.categories).toHaveProperty('property')
      expect(schema.categories).toHaveProperty('lease')
      expect(schema.categories).toHaveProperty('financial')
    })

    it('should include all variables in the schema', () => {
      const schema = buildVariableSchema()
      expect(schema.variables.length).toBe(STANDARD_VARIABLES.length)
    })

    it('should correctly categorize tenant variables', () => {
      const schema = buildVariableSchema()
      const tenantVars = schema.categories.tenant

      expect(tenantVars.some((v) => v.name === 'tenant_name')).toBe(true)
      expect(tenantVars.some((v) => v.name === 'tenant_email')).toBe(true)
    })
  })

  describe('getAvailableVariableNames', () => {
    it('should return all variable names', () => {
      const names = getAvailableVariableNames()
      expect(names.length).toBe(STANDARD_VARIABLES.length)
      expect(names).toContain('tenant_name')
      expect(names).toContain('monthly_rent')
    })
  })

  describe('getRequiredVariableNames', () => {
    it('should return only required variables', () => {
      const required = getRequiredVariableNames()
      const requiredVars = STANDARD_VARIABLES.filter((v) => v.required)

      expect(required.length).toBe(requiredVars.length)
    })

    it('should include critical variables', () => {
      const required = getRequiredVariableNames()

      expect(required).toContain('tenant_name')
      expect(required).toContain('monthly_rent')
      expect(required).toContain('property_address')
    })
  })

  describe('validateVariables', () => {
    it('should validate known variables as valid', () => {
      const result = validateVariables(['tenant_name', 'monthly_rent', 'lease_start_date'])

      expect(result.valid).toBe(true)
      expect(result.unknownVariables).toHaveLength(0)
    })

    it('should identify unknown variables', () => {
      const result = validateVariables(['tenant_name', 'unknown_variable', 'another_unknown'])

      expect(result.unknownVariables).toContain('unknown_variable')
      expect(result.unknownVariables).toContain('another_unknown')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should warn about missing required variables', () => {
      const result = validateVariables(['pet_name']) // Missing required vars

      expect(result.missingRequired.length).toBeGreaterThan(0)
      expect(result.missingRequired).toContain('tenant_name')
    })
  })

  describe('getVariableDefinition', () => {
    it('should return definition for known variable', () => {
      const def = getVariableDefinition('tenant_name')

      expect(def).toBeDefined()
      expect(def?.name).toBe('tenant_name')
      expect(def?.category).toBe('tenant')
    })

    it('should return undefined for unknown variable', () => {
      const def = getVariableDefinition('unknown_variable')
      expect(def).toBeUndefined()
    })
  })

  describe('getSampleData', () => {
    it('should return sample data for all variables with examples', () => {
      const data = getSampleData()

      expect(data.tenant_name).toBeDefined()
      expect(data.monthly_rent).toBeDefined()
      expect(data.property_address).toBeDefined()
    })

    it('should have correct types for sample values', () => {
      const data = getSampleData()

      expect(typeof data.tenant_name).toBe('string')
      expect(typeof data.monthly_rent).toBe('number')
      expect(typeof data.pets_allowed).toBe('boolean')
    })
  })

  describe('formatVariableValue', () => {
    it('should format currency values', () => {
      const formatted = formatVariableValue(1250.5, 'monthly_rent')
      expect(formatted).toBe('$1,250.50')
    })

    it('should format boolean values', () => {
      const formattedTrue = formatVariableValue(true, 'pets_allowed')
      const formattedFalse = formatVariableValue(false, 'pets_allowed')

      expect(formattedTrue).toBe('Yes')
      expect(formattedFalse).toBe('No')
    })

    it('should format number values', () => {
      const formatted = formatVariableValue(1000, 'unit_sqft')
      expect(formatted).toBe('1,000')
    })

    it('should return empty string for null/undefined', () => {
      expect(formatVariableValue(null, 'tenant_name')).toBe('')
      expect(formatVariableValue(undefined, 'tenant_name')).toBe('')
    })

    it('should stringify unknown variables', () => {
      const formatted = formatVariableValue('test value', 'unknown_var')
      expect(formatted).toBe('test value')
    })
  })
})

