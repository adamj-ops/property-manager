import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createUnitSchema,
  updateUnitSchema,
  unitFiltersSchema,
  unitIdSchema,
  bulkCreateUnitsSchema,
} from '~/services/units.schema'

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
