import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import { createLeaseRenewalSchema } from '~/services/lease-renewals.schema'

/**
 * Create a lease renewal from an existing lease
 * Creates a new DRAFT lease linked to the original lease
 */
export const createLeaseRenewal = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createLeaseRenewalSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { leaseId, startDate, endDate, monthlyRent, securityDeposit, petRent, notes } = data

    // Fetch the original lease with all necessary data
    const originalLease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
        addenda: true,
      },
    })

    if (!originalLease) {
      throw new Error('Original lease not found')
    }

    // Verify user has access to this lease
    if (originalLease.unit.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized to renew this lease')
    }

    // Validate that the original lease can be renewed (should be ACTIVE)
    if (originalLease.status !== 'ACTIVE') {
      throw new Error('Only active leases can be renewed')
    }

    // Create the new lease as a DRAFT
    const newLease = await prisma.lease.create({
      data: {
        // Core fields
        status: 'DRAFT',
        type: originalLease.type,

        // Relationships - keep same unit and tenant
        unitId: originalLease.unitId,
        tenantId: originalLease.tenantId,

        // Renewal link
        renewedFromLeaseId: originalLease.id,

        // New term dates
        startDate: new Date(startDate),
        endDate: new Date(endDate),

        // Financial terms
        monthlyRent: monthlyRent,
        rentDueDay: originalLease.rentDueDay,
        lateFeeAmount: Number(originalLease.lateFeeAmount),
        lateFeeGraceDays: originalLease.lateFeeGraceDays,

        // Security deposit - use new value if provided, otherwise keep same
        securityDeposit: securityDeposit ?? Number(originalLease.securityDeposit),
        depositInterestRate: Number(originalLease.depositInterestRate),
        depositBankName: originalLease.depositBankName,
        depositAccountLast4: originalLease.depositAccountLast4,

        // Pet info - carry over from original
        petsAllowed: originalLease.petsAllowed,
        petDeposit: originalLease.petDeposit ? Number(originalLease.petDeposit) : null,
        petRent: petRent ?? (originalLease.petRent ? Number(originalLease.petRent) : null),

        // Utilities - carry over
        utilitiesTenantPays: originalLease.utilitiesTenantPays,
        utilitiesOwnerPays: originalLease.utilitiesOwnerPays,

        // Additional terms - carry over
        parkingIncluded: originalLease.parkingIncluded,
        parkingFee: originalLease.parkingFee ? Number(originalLease.parkingFee) : null,
        storageIncluded: originalLease.storageIncluded,
        storageFee: originalLease.storageFee ? Number(originalLease.storageFee) : null,

        // Renewal settings - carry over
        autoRenew: originalLease.autoRenew,
        renewalNoticeDays: originalLease.renewalNoticeDays,
        renewalRentIncrease: originalLease.renewalRentIncrease
          ? Number(originalLease.renewalRentIncrease)
          : null,

        // Notes
        notes: notes || `Renewal of lease ${originalLease.leaseNumber}`,
      },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
      },
    })

    return newLease
  })

/**
 * Get renewal history for a lease
 * Returns the chain of renewals (previous and next)
 */
export const getLeaseRenewalHistory = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(require('~/services/lease-renewals.schema').leaseRenewalIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { id } = data

    // Get the lease with its renewal chain
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        renewedFromLease: {
          select: {
            id: true,
            leaseNumber: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            status: true,
          },
        },
        renewedToLease: {
          select: {
            id: true,
            leaseNumber: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            status: true,
          },
        },
      },
    })

    if (!lease) {
      throw new Error('Lease not found')
    }

    // Verify access
    if (lease.unit.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized to view this lease')
    }

    return {
      current: {
        id: lease.id,
        leaseNumber: lease.leaseNumber,
        startDate: lease.startDate,
        endDate: lease.endDate,
        monthlyRent: lease.monthlyRent,
        status: lease.status,
      },
      renewedFrom: lease.renewedFromLease || null,
      renewedTo: lease.renewedToLease || null,
    }
  })
