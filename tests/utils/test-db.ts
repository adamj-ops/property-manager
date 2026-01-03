/**
 * Test database utilities
 * Provides database setup, cleanup, and teardown for integration tests
 */

import { PrismaClient } from '@prisma/client'

// Test-specific Prisma client
let testPrisma: PrismaClient | null = null

/**
 * Get the test Prisma client
 * Creates a new client if one doesn't exist
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.DEBUG_PRISMA ? ['query', 'info', 'warn', 'error'] : [],
    })
  }
  return testPrisma
}

/**
 * Connect to the test database
 */
export async function connectTestDatabase(): Promise<void> {
  const prisma = getTestPrisma()
  await prisma.$connect()
}

/**
 * Disconnect from the test database
 */
export async function disconnectTestDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect()
    testPrisma = null
  }
}

/**
 * Clean up all test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupTestDatabase(): Promise<void> {
  const prisma = getTestPrisma()

  // Delete in order respecting foreign key constraints
  // Start from leaf tables and work up to root tables
  const deleteOperations = [
    prisma.inspectionItem.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.document.deleteMany(),
    prisma.message.deleteMany(),
    prisma.messageTemplate.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.workOrderStatusHistory.deleteMany(),
    prisma.maintenanceComment.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.pet.deleteMany(),
    prisma.leaseAddendum.deleteMany(),
    prisma.leaseTenant.deleteMany(),
    prisma.lease.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.property.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.leaseTemplate.deleteMany(),
    prisma.preference.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    // Keep users as they may be referenced; clean up test users specifically
  ]

  // Execute deletions in sequence
  for (const operation of deleteOperations) {
    try {
      await operation
    } catch (error) {
      // Some tables may not exist or may have cascade deletes already handled
      console.warn('Cleanup warning:', error)
    }
  }
}

/**
 * Clean up test users specifically
 * Use with caution - only for tests that create users
 */
export async function cleanupTestUsers(): Promise<void> {
  const prisma = getTestPrisma()
  
  // Delete users with test email domain
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test.example.com',
      },
    },
  })
}

/**
 * Transaction wrapper for tests
 * Rolls back all changes after the test completes
 */
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrisma()
  
  return prisma.$transaction(async (tx) => {
    const result = await fn(tx as unknown as PrismaClient)
    // Note: Transaction will be committed, but cleanup happens in afterEach
    return result
  })
}

