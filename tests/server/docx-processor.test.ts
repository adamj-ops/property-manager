/**
 * DOCX Processor Unit Tests
 * EPM-83: Lease Template Import & Management
 */

import { describe, expect, it } from 'vitest'

import {
  extractVariables,
  previewTemplateContent,
} from '../../src/server/docx-processor'

describe('DOCX Processor', () => {
  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const content = 'Hello {{tenant_name}}, your rent is {{monthly_rent}}.'
      const variables = extractVariables(content)

      expect(variables).toContain('tenant_name')
      expect(variables).toContain('monthly_rent')
      expect(variables).toHaveLength(2)
    })

    it('should extract conditional variables', () => {
      const content = '{{#if pets_allowed}}You can have pets.{{/if}}'
      const variables = extractVariables(content)

      expect(variables).toContain('pets_allowed')
    })

    it('should extract nested dot-notation variables', () => {
      const content = 'Contact: {{tenant.email}} at {{tenant.phone}}'
      const variables = extractVariables(content)

      expect(variables).toContain('tenant.email')
      expect(variables).toContain('tenant.phone')
    })

    it('should return unique variables only', () => {
      const content = '{{tenant_name}} and {{tenant_name}} again'
      const variables = extractVariables(content)

      expect(variables).toHaveLength(1)
      expect(variables).toContain('tenant_name')
    })

    it('should sort variables alphabetically', () => {
      const content = '{{zebra}} {{apple}} {{mango}}'
      const variables = extractVariables(content)

      expect(variables[0]).toBe('apple')
      expect(variables[1]).toBe('mango')
      expect(variables[2]).toBe('zebra')
    })

    it('should handle empty content', () => {
      const variables = extractVariables('')
      expect(variables).toHaveLength(0)
    })

    it('should handle content without variables', () => {
      const content = 'This is plain text without any variables.'
      const variables = extractVariables(content)

      expect(variables).toHaveLength(0)
    })
  })

  describe('previewTemplateContent', () => {
    it('should substitute simple variables', () => {
      const content = 'Hello {{tenant_name}}, your rent is {{monthly_rent}}.'
      const data = { tenant_name: 'John Smith', monthly_rent: 1250 }

      const preview = previewTemplateContent(content, data)

      expect(preview).toBe('Hello John Smith, your rent is 1250.')
    })

    it('should show placeholder for missing variables', () => {
      const content = 'Hello {{tenant_name}}, contact {{tenant_email}}'
      const data = { tenant_name: 'John Smith' }

      const preview = previewTemplateContent(content, data)

      expect(preview).toContain('John Smith')
      expect(preview).toContain('[tenant_email]')
    })

    it('should handle conditional blocks when truthy', () => {
      const content = 'Start{{#pets_allowed}} - Pets are welcome!{{/pets_allowed}}End'
      const data = { pets_allowed: true }

      const preview = previewTemplateContent(content, data)

      expect(preview).toBe('Start - Pets are welcome!End')
    })

    it('should remove conditional blocks when falsy', () => {
      const content = 'Start{{#pets_allowed}} - Pets are welcome!{{/pets_allowed}}End'
      const data = { pets_allowed: false }

      const preview = previewTemplateContent(content, data)

      expect(preview).toBe('StartEnd')
    })

    it('should handle empty data object', () => {
      const content = 'Hello {{tenant_name}}'
      const data = {}

      const preview = previewTemplateContent(content, data)

      expect(preview).toBe('Hello [tenant_name]')
    })

    it('should handle boolean and number values', () => {
      const content = 'Allowed: {{pets_allowed}}, Rent: {{monthly_rent}}'
      const data = { pets_allowed: true, monthly_rent: 1500 }

      const preview = previewTemplateContent(content, data)

      expect(preview).toBe('Allowed: true, Rent: 1500')
    })
  })
})

