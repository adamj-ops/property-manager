/**
 * Properties Schema Unit Tests
 *
 * Tests Zod schema validation for property-related inputs
 */

import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import {
  createPropertySchema,
  propertyFiltersSchema,
  propertyIdSchema,
  propertyStatusEnum,
  propertyTypeEnum,
  updatePropertySchema,
} from '~/services/properties.schema'

describe('propertyTypeEnum', () => {
  it('accepts valid property types', () => {
    const validTypes = [
      'SINGLE_FAMILY',
      'MULTI_FAMILY',
      'APARTMENT',
      'CONDO',
      'TOWNHOUSE',
      'COMMERCIAL',
      'MIXED_USE',
    ]

    validTypes.forEach((type) => {
      expect(propertyTypeEnum.parse(type)).toBe(type)
    })
  })

  it('rejects invalid property types', () => {
    expect(() => propertyTypeEnum.parse('INVALID')).toThrow(ZodError)
    expect(() => propertyTypeEnum.parse('')).toThrow(ZodError)
    expect(() => propertyTypeEnum.parse(123)).toThrow(ZodError)
  })
})

describe('propertyStatusEnum', () => {
  it('accepts valid property statuses', () => {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'UNDER_RENOVATION', 'FOR_SALE']

    validStatuses.forEach((status) => {
      expect(propertyStatusEnum.parse(status)).toBe(status)
    })
  })

  it('rejects invalid property statuses', () => {
    expect(() => propertyStatusEnum.parse('INVALID')).toThrow(ZodError)
    expect(() => propertyStatusEnum.parse('active')).toThrow(ZodError) // case-sensitive
  })
})

describe('createPropertySchema', () => {
  const validPropertyData = {
    name: 'Test Property',
    addressLine1: '123 Main Street',
    city: 'Minneapolis',
    state: 'MN',
    zipCode: '55401',
  }

  it('validates valid property data with minimum required fields', () => {
    const result = createPropertySchema.parse(validPropertyData)

    expect(result.name).toBe('Test Property')
    expect(result.addressLine1).toBe('123 Main Street')
    expect(result.city).toBe('Minneapolis')
    expect(result.state).toBe('MN')
    expect(result.zipCode).toBe('55401')
  })

  it('applies default values correctly', () => {
    const result = createPropertySchema.parse(validPropertyData)

    expect(result.type).toBe('MULTI_FAMILY')
    expect(result.status).toBe('ACTIVE')
    expect(result.country).toBe('US')
    expect(result.totalUnits).toBe(1)
    expect(result.amenities).toEqual([])
    expect(result.leadPaintDisclosure).toBe(false)
    expect(result.builtBefore1978).toBe(false)
  })

  it('validates all optional fields', () => {
    const fullData = {
      ...validPropertyData,
      type: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      addressLine2: 'Suite 100',
      country: 'US',
      latitude: 44.9778,
      longitude: -93.265,
      yearBuilt: 1990,
      totalUnits: 50,
      totalSqFt: 50000,
      lotSize: 2.5,
      parkingSpaces: 100,
      amenities: ['pool', 'gym', 'laundry'],
      rentalLicenseNumber: 'RL-2024-001',
      rentalLicenseExpiry: new Date('2025-12-31'),
      leadPaintDisclosure: false,
      builtBefore1978: false,
      purchasePrice: 5000000,
      purchaseDate: new Date('2020-01-15'),
      currentValue: 6000000,
      mortgageBalance: 3000000,
      notes: 'Great investment property',
      imageUrl: 'https://example.com/property.jpg',
    }

    const result = createPropertySchema.parse(fullData)

    expect(result.type).toBe('APARTMENT')
    expect(result.yearBuilt).toBe(1990)
    expect(result.totalUnits).toBe(50)
    expect(result.amenities).toEqual(['pool', 'gym', 'laundry'])
  })

  it('rejects empty property name', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        name: '',
      })
    ).toThrow(ZodError)
  })

  it('rejects empty address', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        addressLine1: '',
      })
    ).toThrow(ZodError)
  })

  it('rejects empty city', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        city: '',
      })
    ).toThrow(ZodError)
  })

  it('rejects invalid zip code (too short)', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        zipCode: '123',
      })
    ).toThrow(ZodError)
  })

  it('rejects year built outside valid range', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        yearBuilt: 1700,
      })
    ).toThrow(ZodError)

    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        yearBuilt: 2200,
      })
    ).toThrow(ZodError)
  })

  it('rejects negative total units', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        totalUnits: 0,
      })
    ).toThrow(ZodError)
  })

  it('rejects invalid image URL format', () => {
    expect(() =>
      createPropertySchema.parse({
        ...validPropertyData,
        imageUrl: 'not-a-valid-url',
      })
    ).toThrow(ZodError)
  })
})

describe('updatePropertySchema', () => {
  it('allows partial updates with any subset of fields', () => {
    // Only updating name
    expect(updatePropertySchema.parse({ name: 'Updated Name' })).toEqual({
      name: 'Updated Name',
    })

    // Only updating status
    expect(updatePropertySchema.parse({ status: 'INACTIVE' })).toEqual({
      status: 'INACTIVE',
    })

    // Multiple fields
    expect(
      updatePropertySchema.parse({
        name: 'Updated',
        city: 'St. Paul',
        yearBuilt: 2000,
      })
    ).toEqual({
      name: 'Updated',
      city: 'St. Paul',
      yearBuilt: 2000,
    })
  })

  it('allows empty object (no updates)', () => {
    expect(updatePropertySchema.parse({})).toEqual({})
  })

  it('still validates field values when provided', () => {
    expect(() =>
      updatePropertySchema.parse({ yearBuilt: 1700 })
    ).toThrow(ZodError)
  })
})

describe('propertyFiltersSchema', () => {
  it('applies default values for limit and offset', () => {
    const result = propertyFiltersSchema.parse({})

    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
  })

  it('validates all filter options', () => {
    const filters = {
      status: 'ACTIVE' as const,
      type: 'APARTMENT' as const,
      city: 'Minneapolis',
      state: 'MN',
      search: 'downtown',
      limit: 25,
      offset: 10,
    }

    const result = propertyFiltersSchema.parse(filters)

    expect(result).toEqual(filters)
  })

  it('rejects limit outside valid range', () => {
    expect(() =>
      propertyFiltersSchema.parse({ limit: 0 })
    ).toThrow(ZodError)

    expect(() =>
      propertyFiltersSchema.parse({ limit: 101 })
    ).toThrow(ZodError)
  })

  it('rejects negative offset', () => {
    expect(() =>
      propertyFiltersSchema.parse({ offset: -1 })
    ).toThrow(ZodError)
  })
})

describe('propertyIdSchema', () => {
  it('validates valid UUID', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'
    const result = propertyIdSchema.parse({ id: validUuid })

    expect(result.id).toBe(validUuid)
  })

  it('rejects invalid UUID formats', () => {
    expect(() =>
      propertyIdSchema.parse({ id: 'not-a-uuid' })
    ).toThrow(ZodError)

    expect(() =>
      propertyIdSchema.parse({ id: '123' })
    ).toThrow(ZodError)

    expect(() =>
      propertyIdSchema.parse({ id: '' })
    ).toThrow(ZodError)
  })

  it('rejects missing id', () => {
    expect(() =>
      propertyIdSchema.parse({})
    ).toThrow(ZodError)
  })
})

