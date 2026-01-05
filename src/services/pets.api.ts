import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  petFiltersSchema,
  getPetSchema,
  createPetSchema,
  updatePetSchema,
  approvePetSchema,
  denyPetSchema,
  removePetSchema,
} from '~/services/pets.schema'

/**
 * Get list of pets with optional filters
 */
export const getPets = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(petFiltersSchema))
  .handler(async ({ context, data }) => {
    const { tenantId, status, type, offset, limit } = data

    // Build where clause
    const where: any = {}

    if (tenantId) {
      where.tenantId = tenantId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    // For manager access, filter to pets belonging to their tenants
    where.tenant = {
      leases: {
        some: {
          unit: {
            property: {
              managerId: context.auth.user.id,
            },
          },
        },
      },
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              leases: {
                where: { status: 'ACTIVE' },
                take: 1,
                include: {
                  unit: {
                    include: {
                      property: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.pet.count({ where }),
    ])

    return { pets, total, offset, limit }
  })

/**
 * Get a single pet by ID
 */
export const getPet = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getPetSchema))
  .handler(async ({ context, data }) => {
    const pet = await prisma.pet.findUnique({
      where: { id: data.id },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: {
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!pet) {
      throw new Error('Pet not found')
    }

    // Verify manager has access
    const hasAccess = pet.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to view this pet')
    }

    return pet
  })

/**
 * Create a new pet application
 */
export const createPet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createPetSchema))
  .handler(async ({ context, data }) => {
    // Verify tenant exists and manager has access
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const hasAccess = tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to add pet for this tenant')
    }

    const pet = await prisma.pet.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        name: data.name,
        breed: data.breed,
        color: data.color,
        weight: data.weight,
        age: data.age,
        vaccinated: data.vaccinated,
        vaccinationExpiry: data.vaccinationExpiry,
        rabiesTagNumber: data.rabiesTagNumber,
        licensedWithCity: data.licensedWithCity,
        imageUrl: data.imageUrl,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return pet
  })

/**
 * Update pet details
 */
export const updatePet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updatePetSchema))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify pet exists and manager has access
    const existing = await prisma.pet.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Pet not found')
    }

    const hasAccess = existing.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to update this pet')
    }

    const pet = await prisma.pet.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return pet
  })

/**
 * Approve a pet application
 */
export const approvePet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(approvePetSchema))
  .handler(async ({ context, data }) => {
    const { id, notes } = data

    // Verify pet exists and is pending
    const existing = await prisma.pet.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Pet not found')
    }

    if (existing.status !== 'PENDING') {
      throw new Error('Pet is not pending approval')
    }

    const hasAccess = existing.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to approve this pet')
    }

    const pet = await prisma.pet.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        notes: notes ? `${existing.notes || ''}\n\nApproval Notes: ${notes}`.trim() : existing.notes,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return pet
  })

/**
 * Deny a pet application
 */
export const denyPet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(denyPetSchema))
  .handler(async ({ context, data }) => {
    const { id, denialReason } = data

    // Verify pet exists and is pending
    const existing = await prisma.pet.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Pet not found')
    }

    if (existing.status !== 'PENDING') {
      throw new Error('Pet is not pending approval')
    }

    const hasAccess = existing.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to deny this pet')
    }

    const pet = await prisma.pet.update({
      where: { id },
      data: {
        status: 'DENIED',
        deniedAt: new Date(),
        denialReason,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return pet
  })

/**
 * Remove a pet (no longer at property)
 */
export const removePet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(removePetSchema))
  .handler(async ({ context, data }) => {
    const { id, removalReason } = data

    // Verify pet exists
    const existing = await prisma.pet.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Pet not found')
    }

    const hasAccess = existing.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to remove this pet')
    }

    const pet = await prisma.pet.update({
      where: { id },
      data: {
        status: 'REMOVED',
        notes: removalReason
          ? `${existing.notes || ''}\n\nRemoval Reason: ${removalReason}`.trim()
          : existing.notes,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return pet
  })

/**
 * Delete a pet (hard delete - use removePet for soft delete)
 */
export const deletePet = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getPetSchema))
  .handler(async ({ context, data }) => {
    // Verify pet exists and manager has access
    const existing = await prisma.pet.findUnique({
      where: { id: data.id },
      include: {
        tenant: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                unit: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Pet not found')
    }

    const hasAccess = existing.tenant.leases.some(
      (lease) => lease.unit.property.managerId === context.auth.user.id
    )

    if (!hasAccess) {
      throw new Error('Not authorized to delete this pet')
    }

    await prisma.pet.delete({
      where: { id: data.id },
    })

    return { success: true }
  })
