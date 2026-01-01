import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
  propertyIdSchema,
} from '~/services/properties.schema'

// Get all properties for the authenticated user
export const getProperties = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(propertyFiltersSchema))
  .handler(async ({ context, data }) => {
    const { status, type, city, state, search, limit, offset } = data

    const where = {
      managerId: context.auth.user.id,
      ...(status && { status }),
      ...(type && { type }),
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      ...(state && { state }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { addressLine1: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          units: {
            select: {
              id: true,
              status: true,
              marketRent: true,
              currentRent: true,
            },
          },
          _count: {
            select: {
              units: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where }),
    ])

    return { properties, total, limit, offset }
  })

// Get single property by ID
export const getProperty = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(propertyIdSchema))
  .handler(async ({ context, data }) => {
    const property = await prisma.property.findFirst({
      where: {
        id: data.id,
        managerId: context.auth.user.id,
      },
      include: {
        units: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                tenant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: { unitNumber: 'asc' },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 10,
        },
        inspections: {
          orderBy: { scheduledDate: 'desc' },
          take: 5,
        },
      },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    return property
  })

// Create new property
export const createProperty = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createPropertySchema))
  .handler(async ({ context, data }) => {
    const property = await prisma.property.create({
      data: {
        ...data,
        managerId: context.auth.user.id,
      },
    })

    return property
  })

// Update property
export const updateProperty = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(propertyIdSchema.merge(updatePropertySchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify ownership
    const existing = await prisma.property.findFirst({
      where: { id, managerId: context.auth.user.id },
    })

    if (!existing) {
      throw new Error('Property not found')
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    })

    return property
  })

// Delete property
export const deleteProperty = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(propertyIdSchema))
  .handler(async ({ context, data }) => {
    // Verify ownership
    const existing = await prisma.property.findFirst({
      where: { id: data.id, managerId: context.auth.user.id },
    })

    if (!existing) {
      throw new Error('Property not found')
    }

    await prisma.property.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// Get property stats (for dashboard)
export const getPropertyStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const properties = await prisma.property.findMany({
      where: { managerId: context.auth.user.id },
      include: {
        units: {
          select: {
            status: true,
            marketRent: true,
            currentRent: true,
          },
        },
      },
    })

    const totalProperties = properties.length
    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0)
    const occupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === 'OCCUPIED').length,
      0
    )
    const vacantUnits = totalUnits - occupiedUnits
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    const totalMonthlyRent = properties.reduce(
      (sum, p) =>
        sum +
        p.units
          .filter((u) => u.status === 'OCCUPIED')
          .reduce((uSum, u) => uSum + Number(u.currentRent || u.marketRent), 0),
      0
    )

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      totalMonthlyRent,
    }
  })
