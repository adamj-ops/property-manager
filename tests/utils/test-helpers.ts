/**
 * Test helpers
 * Common utilities for creating test data
 */

import type {
  Lease,
  Property,
  Tenant,
  Unit,
  User,
} from '@prisma/client'

import { getTestPrisma } from './test-db'

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(prefix = 'user'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.example.com`
}

/**
 * Generate a unique ID for testing
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const prisma = getTestPrisma()
  
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? generateTestEmail(),
      emailVerified: overrides.emailVerified ?? true,
      role: overrides.role ?? 'user',
      ...overrides,
    },
  })
}

/**
 * Create a test property
 */
export async function createTestProperty(
  managerId: string,
  overrides: Partial<Property> = {}
): Promise<Property> {
  const prisma = getTestPrisma()
  
  return prisma.property.create({
    data: {
      name: overrides.name ?? 'Test Property',
      type: overrides.type ?? 'MULTI_FAMILY',
      status: overrides.status ?? 'ACTIVE',
      addressLine1: overrides.addressLine1 ?? '123 Test Street',
      city: overrides.city ?? 'Minneapolis',
      state: overrides.state ?? 'MN',
      zipCode: overrides.zipCode ?? '55401',
      managerId,
      ...overrides,
    },
  })
}

/**
 * Create a test unit
 */
export async function createTestUnit(
  propertyId: string,
  overrides: Partial<Unit> = {}
): Promise<Unit> {
  const prisma = getTestPrisma()
  
  return prisma.unit.create({
    data: {
      propertyId,
      unitNumber: overrides.unitNumber ?? `Unit-${Date.now()}`,
      status: overrides.status ?? 'VACANT',
      bedrooms: overrides.bedrooms ?? 2,
      bathrooms: overrides.bathrooms ?? 1,
      marketRent: overrides.marketRent ?? 1500,
      ...overrides,
    },
  })
}

/**
 * Create a test tenant
 */
export async function createTestTenant(
  overrides: Partial<Tenant> = {}
): Promise<Tenant> {
  const prisma = getTestPrisma()
  
  return prisma.tenant.create({
    data: {
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'Tenant',
      email: overrides.email ?? generateTestEmail('tenant'),
      status: overrides.status ?? 'ACTIVE',
      ...overrides,
    },
  })
}

/**
 * Create a test lease
 */
export async function createTestLease(
  unitId: string,
  tenantId: string,
  overrides: Partial<Lease> = {}
): Promise<Lease> {
  const prisma = getTestPrisma()
  
  const now = new Date()
  const oneYearFromNow = new Date(now)
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
  
  return prisma.lease.create({
    data: {
      unitId,
      tenantId,
      status: overrides.status ?? 'ACTIVE',
      type: overrides.type ?? 'FIXED_TERM',
      startDate: overrides.startDate ?? now,
      endDate: overrides.endDate ?? oneYearFromNow,
      monthlyRent: overrides.monthlyRent ?? 1500,
      securityDeposit: overrides.securityDeposit ?? 1500,
      ...overrides,
    },
  })
}

/**
 * Create a complete test scenario with user, property, unit, tenant, and lease
 */
export async function createTestScenario() {
  const user = await createTestUser()
  const property = await createTestProperty(user.id)
  const unit = await createTestUnit(property.id)
  const tenant = await createTestTenant()
  const lease = await createTestLease(unit.id, tenant.id)
  
  return {
    user,
    property,
    unit,
    tenant,
    lease,
  }
}

/**
 * Create multiple test properties for a user
 */
export async function createTestProperties(
  managerId: string,
  count: number
): Promise<Property[]> {
  const properties: Property[] = []
  
  for (let i = 0; i < count; i++) {
    const property = await createTestProperty(managerId, {
      name: `Test Property ${i + 1}`,
    })
    properties.push(property)
  }
  
  return properties
}

/**
 * Create a property with multiple units
 */
export async function createPropertyWithUnits(
  managerId: string,
  unitCount: number
): Promise<{ property: Property; units: Unit[] }> {
  const property = await createTestProperty(managerId)
  const units: Unit[] = []
  
  for (let i = 0; i < unitCount; i++) {
    const unit = await createTestUnit(property.id, {
      unitNumber: `${i + 1}`,
      marketRent: 1000 + (i * 100),
    })
    units.push(unit)
  }
  
  return { property, units }
}

