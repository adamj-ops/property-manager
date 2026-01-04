import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import type { LeaseStatus, Prisma } from '@prisma/client'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createTenantSchema,
  updateTenantSchema,
  tenantFiltersSchema,
  tenantIdSchema,
} from '~/services/tenants.schema'

// Get all tenants
export const getTenants = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { status, search, hasActiveLease, limit, offset } = data

    // Get properties managed by this user to filter tenants
    const managedPropertyIds = await prisma.property.findMany({
      where: { managerId: context.auth.user.id },
      select: { id: true },
    })

    const propertyIds = managedPropertyIds.map((p) => p.id)

    const where: Prisma.TenantWhereInput = {
      leases: {
        some: {
          unit: {
            propertyId: { in: propertyIds },
          },
        },
      },
      ...(status && { status }),
      ...(hasActiveLease !== undefined && {
        leases: hasActiveLease
          ? { some: { status: 'ACTIVE' as LeaseStatus } }
          : { none: { status: 'ACTIVE' as LeaseStatus } },
      }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          leases: {
            where: { status: 'ACTIVE' },
            include: {
              unit: {
                include: {
                  property: {
                    select: { id: true, name: true, addressLine1: true },
                  },
                },
              },
            },
          },
          pets: {
            where: { status: 'APPROVED' },
          },
          _count: {
            select: {
              leases: true,
              payments: true,
              maintenanceRequests: true,
            },
          },
        },
        orderBy: { lastName: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.tenant.count({ where }),
    ])

    return { tenants, total, limit, offset }
  })

// Get single tenant
export const getTenant = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.id },
      include: {
        leases: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        pets: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Verify user has access (tenant has lease in user's property)
    const hasAccess = tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess && tenant.leases.length > 0) {
      throw new Error('Tenant not found')
    }

    return tenant
  })

// Create tenant
export const createTenant = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createTenantSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ data }) => {
    const tenant = await prisma.tenant.create({
      data,
    })

    return tenant
  })

// Update tenant
export const updateTenant = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantIdSchema.merge(updateTenantSchema)))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ data }) => {
    const { id, ...updateData } = data

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    })

    return tenant
  })

// Delete tenant
export const deleteTenant = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantIdSchema))
  .handler(async ({ data }) => {
    // Check for active leases
    const activeLeases = await prisma.lease.count({
      where: { tenantId: data.id, status: 'ACTIVE' },
    })

    if (activeLeases > 0) {
      throw new Error('Cannot delete tenant with active leases')
    }

    await prisma.tenant.delete({
      where: { id: data.id },
    })

    return { success: true }
  })
