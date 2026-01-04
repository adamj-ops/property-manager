import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import type { Prisma } from '@prisma/client'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createUnitSchema,
  updateUnitSchema,
  unitFiltersSchema,
  unitIdSchema,
  bulkCreateUnitsSchema,
  bulkDeleteUnitsSchema,
} from '~/services/units.schema'

// Unit with property and lease info (for list view)
export type UnitWithDetails = Prisma.UnitGetPayload<{
  include: {
    property: {
      select: {
        id: true
        name: true
        addressLine1: true
        city: true
        state: true
      }
    }
    leases: {
      include: {
        tenant: {
          select: {
            id: true
            firstName: true
            lastName: true
            email: true
          }
        }
      }
    }
  }
}>

// Unit with full details (for detail view)
export type UnitFull = Prisma.UnitGetPayload<{
  include: {
    property: true
    leases: {
      include: {
        tenant: true
      }
    }
    maintenanceRequests: true
  }
}>

// Get all units (with optional property filter)
export const getUnits = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(unitFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, status, minBedrooms, maxRent, petFriendly, search, limit, offset } = data

    const where = {
      property: { managerId: context.auth.user.id },
      ...(propertyId && { propertyId }),
      ...(status && { status }),
      ...(minBedrooms !== undefined && { bedrooms: { gte: minBedrooms } }),
      ...(maxRent !== undefined && { marketRent: { lte: maxRent } }),
      ...(petFriendly !== undefined && { petFriendly }),
      ...(search && {
        OR: [
          { unitNumber: { contains: search, mode: 'insensitive' as const } },
          { floorPlan: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
              state: true,
            },
          },
          leases: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.unit.count({ where }),
    ])

    return { units, total, limit, offset }
  })

// Get single unit by ID
export const getUnit = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(unitIdSchema))
  .handler(async ({ context, data }) => {
    const unit = await prisma.unit.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
      include: {
        property: true,
        leases: {
          include: {
            tenant: true,
          },
          orderBy: { startDate: 'desc' },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!unit) {
      throw new Error('Unit not found')
    }

    return unit
  })

// Create new unit
export const createUnit = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createUnitSchema))
  .handler(async ({ context, data }) => {
    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, managerId: context.auth.user.id },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    const unit = await prisma.unit.create({
      data,
    })

    // Update property unit count
    await prisma.property.update({
      where: { id: data.propertyId },
      data: { totalUnits: { increment: 1 } },
    })

    return unit
  })

// Bulk create units
export const bulkCreateUnits = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkCreateUnitsSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, units } = data

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, managerId: context.auth.user.id },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    const createdUnits = await prisma.unit.createMany({
      data: units.map((unit) => ({
        ...unit,
        propertyId,
      })),
    })

    // Update property unit count
    await prisma.property.update({
      where: { id: propertyId },
      data: { totalUnits: { increment: createdUnits.count } },
    })

    return { count: createdUnits.count }
  })

// Update unit
export const updateUnit = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(unitIdSchema.merge(updateUnitSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify ownership
    const existing = await prisma.unit.findFirst({
      where: { id, property: { managerId: context.auth.user.id } },
    })

    if (!existing) {
      throw new Error('Unit not found')
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
    })

    return unit
  })

// Delete unit
export const deleteUnit = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(unitIdSchema))
  .handler(async ({ context, data }) => {
    const existing = await prisma.unit.findFirst({
      where: { id: data.id, property: { managerId: context.auth.user.id } },
      include: { property: true },
    })

    if (!existing) {
      throw new Error('Unit not found')
    }

    await prisma.unit.delete({
      where: { id: data.id },
    })

    // Update property unit count
    await prisma.property.update({
      where: { id: existing.propertyId },
      data: { totalUnits: { decrement: 1 } },
    })

    return { success: true }
  })

// Bulk delete units
export const bulkDeleteUnits = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkDeleteUnitsSchema))
  .handler(async ({ context, data }) => {
    const { ids } = data

    // Verify all units belong to user's properties
    const units = await prisma.unit.findMany({
      where: {
        id: { in: ids },
        property: { managerId: context.auth.user.id },
      },
      select: { id: true, propertyId: true },
    })

    if (units.length !== ids.length) {
      throw new Error('One or more units not found or not authorized')
    }

    // Check for active leases
    const unitsWithActiveLeases = await prisma.unit.findMany({
      where: {
        id: { in: ids },
        leases: { some: { status: 'ACTIVE' } },
      },
      select: { id: true, unitNumber: true },
    })

    if (unitsWithActiveLeases.length > 0) {
      const unitNumbers = unitsWithActiveLeases.map((u) => u.unitNumber).join(', ')
      throw new Error(`Cannot delete units with active leases: ${unitNumbers}`)
    }

    // Group units by property for count updates
    const propertyUnitCounts = units.reduce(
      (acc, unit) => {
        acc[unit.propertyId] = (acc[unit.propertyId] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Delete units
    await prisma.unit.deleteMany({
      where: { id: { in: ids } },
    })

    // Update property unit counts
    await Promise.all(
      Object.entries(propertyUnitCounts).map(([propertyId, count]) =>
        prisma.property.update({
          where: { id: propertyId },
          data: { totalUnits: { decrement: count } },
        })
      )
    )

    return { deletedCount: ids.length }
  })
