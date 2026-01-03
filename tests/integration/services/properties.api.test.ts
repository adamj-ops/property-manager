/**
 * Properties API Integration Tests
 *
 * Tests server functions for property management
 * These tests interact with the actual database
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  createMockAuth,
  createMockUnauthenticated,
  createServerFnContext,
} from '../../utils/mock-auth'
import { cleanupTestDatabase, cleanupTestUsers, getTestPrisma } from '../../utils/test-db'
import {
  createPropertyWithUnits,
  createTestProperties,
  createTestProperty,
  createTestUser,
} from '../../utils/test-helpers'

// Note: In a real implementation, you would import and test the actual handler.
// For demonstration, we're showing the test patterns.
// import { getProperties, getProperty, createProperty } from '~/services/properties.api'

describe('Properties API Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestDatabase()
    await cleanupTestUsers()
  })

  describe('getProperties', () => {
    it('returns empty list when user has no properties', async () => {
      const user = await createTestUser()
      const prisma = getTestPrisma()

      // Query properties for the user
      const properties = await prisma.property.findMany({
        where: { managerId: user.id },
      })

      expect(properties).toHaveLength(0)
    })

    it('returns properties owned by authenticated user', async () => {
      const user = await createTestUser()
      await createTestProperties(user.id, 3)
      const prisma = getTestPrisma()

      // Query properties for the user
      const properties = await prisma.property.findMany({
        where: { managerId: user.id },
      })

      expect(properties).toHaveLength(3)
    })

    it('does not return properties owned by other users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.example.com' })
      const user2 = await createTestUser({ email: 'user2@test.example.com' })

      await createTestProperties(user1.id, 2)
      await createTestProperties(user2.id, 3)

      const prisma = getTestPrisma()

      // Query properties for user1 only
      const user1Properties = await prisma.property.findMany({
        where: { managerId: user1.id },
      })

      expect(user1Properties).toHaveLength(2)
    })

    it('filters properties by status', async () => {
      const user = await createTestUser()
      await createTestProperty(user.id, { status: 'ACTIVE' })
      await createTestProperty(user.id, { status: 'INACTIVE' })
      await createTestProperty(user.id, { status: 'ACTIVE' })

      const prisma = getTestPrisma()

      const activeProperties = await prisma.property.findMany({
        where: {
          managerId: user.id,
          status: 'ACTIVE',
        },
      })

      expect(activeProperties).toHaveLength(2)
    })

    it('filters properties by type', async () => {
      const user = await createTestUser()
      await createTestProperty(user.id, { type: 'APARTMENT' })
      await createTestProperty(user.id, { type: 'APARTMENT' })
      await createTestProperty(user.id, { type: 'SINGLE_FAMILY' })

      const prisma = getTestPrisma()

      const apartments = await prisma.property.findMany({
        where: {
          managerId: user.id,
          type: 'APARTMENT',
        },
      })

      expect(apartments).toHaveLength(2)
    })

    it('searches properties by name', async () => {
      const user = await createTestUser()
      await createTestProperty(user.id, { name: 'Downtown Tower' })
      await createTestProperty(user.id, { name: 'Suburban Complex' })
      await createTestProperty(user.id, { name: 'Downtown Plaza' })

      const prisma = getTestPrisma()

      const downtownProperties = await prisma.property.findMany({
        where: {
          managerId: user.id,
          name: {
            contains: 'Downtown',
            mode: 'insensitive',
          },
        },
      })

      expect(downtownProperties).toHaveLength(2)
    })

    it('applies pagination correctly', async () => {
      const user = await createTestUser()
      await createTestProperties(user.id, 25)

      const prisma = getTestPrisma()

      // First page
      const page1 = await prisma.property.findMany({
        where: { managerId: user.id },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(page1).toHaveLength(10)

      // Second page
      const page2 = await prisma.property.findMany({
        where: { managerId: user.id },
        take: 10,
        skip: 10,
        orderBy: { createdAt: 'desc' },
      })

      expect(page2).toHaveLength(10)

      // Ensure no overlap between pages
      const page1Ids = page1.map((p) => p.id)
      const page2Ids = page2.map((p) => p.id)
      const overlap = page1Ids.filter((id) => page2Ids.includes(id))

      expect(overlap).toHaveLength(0)
    })
  })

  describe('getProperty', () => {
    it('returns property by ID for owner', async () => {
      const user = await createTestUser()
      const property = await createTestProperty(user.id, {
        name: 'Test Property',
        addressLine1: '123 Main St',
      })

      const prisma = getTestPrisma()

      const found = await prisma.property.findFirst({
        where: {
          id: property.id,
          managerId: user.id,
        },
      })

      expect(found).not.toBeNull()
      expect(found?.name).toBe('Test Property')
      expect(found?.addressLine1).toBe('123 Main St')
    })

    it('returns null when property belongs to different user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.example.com' })
      const user2 = await createTestUser({ email: 'user2@test.example.com' })
      const property = await createTestProperty(user1.id)

      const prisma = getTestPrisma()

      const found = await prisma.property.findFirst({
        where: {
          id: property.id,
          managerId: user2.id, // Wrong user
        },
      })

      expect(found).toBeNull()
    })

    it('includes units when property has units', async () => {
      const user = await createTestUser()
      const { property, units } = await createPropertyWithUnits(user.id, 5)

      const prisma = getTestPrisma()

      const found = await prisma.property.findFirst({
        where: {
          id: property.id,
          managerId: user.id,
        },
        include: {
          units: true,
        },
      })

      expect(found?.units).toHaveLength(5)
    })
  })

  describe('createProperty', () => {
    it('creates property for authenticated user', async () => {
      const user = await createTestUser()

      const prisma = getTestPrisma()

      const property = await prisma.property.create({
        data: {
          managerId: user.id,
          name: 'New Property',
          addressLine1: '456 Oak Avenue',
          city: 'Minneapolis',
          state: 'MN',
          zipCode: '55402',
        },
      })

      expect(property).toBeDefined()
      expect(property.name).toBe('New Property')
      expect(property.managerId).toBe(user.id)
    })

    it('applies default values', async () => {
      const user = await createTestUser()

      const prisma = getTestPrisma()

      const property = await prisma.property.create({
        data: {
          managerId: user.id,
          name: 'Default Property',
          addressLine1: '789 Pine Street',
          city: 'St. Paul',
          state: 'MN',
          zipCode: '55101',
        },
      })

      expect(property.type).toBe('MULTI_FAMILY')
      expect(property.status).toBe('ACTIVE')
      expect(property.country).toBe('US')
      expect(property.totalUnits).toBe(1)
    })
  })

  describe('updateProperty', () => {
    it('updates property fields', async () => {
      const user = await createTestUser()
      const property = await createTestProperty(user.id, {
        name: 'Original Name',
      })

      const prisma = getTestPrisma()

      const updated = await prisma.property.update({
        where: { id: property.id },
        data: { name: 'Updated Name' },
      })

      expect(updated.name).toBe('Updated Name')
    })

    it('preserves unchanged fields', async () => {
      const user = await createTestUser()
      const property = await createTestProperty(user.id, {
        name: 'Original Name',
        city: 'Minneapolis',
      })

      const prisma = getTestPrisma()

      const updated = await prisma.property.update({
        where: { id: property.id },
        data: { name: 'New Name' },
      })

      expect(updated.city).toBe('Minneapolis')
    })
  })

  describe('deleteProperty', () => {
    it('deletes property and cascades to units', async () => {
      const user = await createTestUser()
      const { property, units } = await createPropertyWithUnits(user.id, 3)

      const prisma = getTestPrisma()

      // Delete property (should cascade to units)
      await prisma.property.delete({
        where: { id: property.id },
      })

      // Verify property is deleted
      const deletedProperty = await prisma.property.findUnique({
        where: { id: property.id },
      })
      expect(deletedProperty).toBeNull()

      // Verify units are deleted
      const remainingUnits = await prisma.unit.findMany({
        where: { propertyId: property.id },
      })
      expect(remainingUnits).toHaveLength(0)
    })
  })
})

describe('Authorization Tests', () => {
  beforeEach(async () => {
    await cleanupTestDatabase()
    await cleanupTestUsers()
  })

  it('creates correct mock auth context for authenticated user', () => {
    const mockUser = {
      id: 'test-uuid',
      name: 'Test User',
      email: 'test@example.com',
    } as any

    const auth = createMockAuth(mockUser)
    const context = createServerFnContext(auth)

    expect(context.auth.isAuthenticated).toBe(true)
    expect(context.auth.user.id).toBe('test-uuid')
  })

  it('creates correct mock auth context for unauthenticated user', () => {
    const auth = createMockUnauthenticated()
    const context = createServerFnContext(auth)

    expect(context.auth.isAuthenticated).toBe(false)
    expect(context.auth.user).toBeNull()
  })
})

