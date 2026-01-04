import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import type { LeaseStatus, Prisma } from '@prisma/client'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createLeaseSchema,
  updateLeaseSchema,
  leaseFiltersSchema,
  leaseIdSchema,
} from '~/services/leases.schema'

// Get all leases
export const getLeases = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(leaseFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { propertyId, unitId, tenantId, status, expiringWithinDays, search, limit, offset } = data

    const expiringDate = expiringWithinDays
      ? new Date(Date.now() + expiringWithinDays * 24 * 60 * 60 * 1000)
      : undefined

    const where: Prisma.LeaseWhereInput = {
      unit: {
        property: { managerId: context.auth.user.id },
        ...(propertyId && { propertyId }),
      },
      ...(unitId && { unitId }),
      ...(tenantId && { tenantId }),
      ...(status && { status: status as LeaseStatus }),
      ...(expiringDate && {
        endDate: { lte: expiringDate },
        status: 'ACTIVE' as LeaseStatus,
      }),
      ...(search && {
        OR: [
          { leaseNumber: { contains: search, mode: 'insensitive' as const } },
          { tenant: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { tenant: { lastName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [leases, total] = await Promise.all([
      prisma.lease.findMany({
        where,
        include: {
          unit: {
            include: {
              property: {
                select: { id: true, name: true, addressLine1: true },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { endDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.lease.count({ where }),
    ])

    return { leases, total, limit, offset }
  })

// Get single lease
export const getLease = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(leaseIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const lease = await prisma.lease.findFirst({
      where: {
        id: data.id,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        unit: {
          include: { property: true },
        },
        tenant: true,
        coTenants: true,
        addenda: {
          orderBy: { effectiveDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        inspections: {
          orderBy: { scheduledDate: 'desc' },
        },
      },
    })

    if (!lease) {
      throw new Error('Lease not found')
    }

    return lease
  })

// Create lease
export const createLease = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createLeaseSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    // Verify unit ownership
    const unit = await prisma.unit.findFirst({
      where: {
        id: data.unitId,
        property: { managerId: context.auth.user.id },
      },
    })

    if (!unit) {
      throw new Error('Unit not found')
    }

    // Check for overlapping active leases
    const overlapping = await prisma.lease.findFirst({
      where: {
        unitId: data.unitId,
        status: { in: ['ACTIVE', 'PENDING_SIGNATURE'] },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    })

    if (overlapping) {
      throw new Error('Unit has an overlapping lease for this period')
    }

    const lease = await prisma.lease.create({
      data,
      include: {
        unit: { include: { property: true } },
        tenant: true,
      },
    })

    // Update unit status if lease is active
    if (data.status === 'ACTIVE') {
      await prisma.unit.update({
        where: { id: data.unitId },
        data: {
          status: 'OCCUPIED',
          currentRent: data.monthlyRent,
        },
      })

      // Update tenant status
      await prisma.tenant.update({
        where: { id: data.tenantId },
        data: { status: 'ACTIVE' },
      })
    }

    return lease
  })

// Update lease
export const updateLease = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(leaseIdSchema.merge(updateLeaseSchema)))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.lease.findFirst({
      where: {
        id,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!existing) {
      throw new Error('Lease not found')
    }

    const lease = await prisma.lease.update({
      where: { id },
      data: updateData,
      include: {
        unit: { include: { property: true } },
        tenant: true,
      },
    })

    // Handle status changes
    if (updateData.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      await prisma.unit.update({
        where: { id: existing.unitId },
        data: { status: 'OCCUPIED' },
      })
    } else if (updateData.status === 'TERMINATED' || updateData.status === 'EXPIRED') {
      await prisma.unit.update({
        where: { id: existing.unitId },
        data: { status: 'VACANT' },
      })
    }

    return lease
  })

// Get expiring leases
export const getExpiringLeases = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context }) => {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    const leases = await prisma.lease.findMany({
      where: {
        unit: { property: { managerId: context.auth.user.id } },
        status: 'ACTIVE',
        endDate: { lte: ninetyDays },
      },
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { endDate: 'asc' },
    })

    return {
      within30Days: leases.filter((l) => l.endDate <= thirtyDays),
      within60Days: leases.filter((l) => l.endDate > thirtyDays && l.endDate <= sixtyDays),
      within90Days: leases.filter((l) => l.endDate > sixtyDays && l.endDate <= ninetyDays),
    }
  })
