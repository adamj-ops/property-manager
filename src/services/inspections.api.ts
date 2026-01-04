import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  inspectionFiltersSchema,
  getInspectionSchema,
  createInspectionSchema,
  updateInspectionSchema,
  addInspectionItemSchema,
  updateInspectionItemSchema,
  deleteInspectionItemSchema,
  completeInspectionSchema,
  startInspectionSchema,
  cancelInspectionSchema,
} from '~/services/inspections.schema'

/**
 * Get list of inspections with optional filters
 */
export const getInspections = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(inspectionFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, leaseId, type, status, fromDate, toDate, offset, limit } = data

    // Build where clause
    const where: any = {
      property: {
        managerId: context.auth.user.id,
      },
    }

    if (propertyId) {
      where.propertyId = propertyId
    }

    if (leaseId) {
      where.leaseId = leaseId
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (fromDate || toDate) {
      where.scheduledDate = {}
      if (fromDate) where.scheduledDate.gte = fromDate
      if (toDate) where.scheduledDate.lte = toDate
    }

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true },
          },
          lease: {
            select: {
              id: true,
              tenant: {
                select: { id: true, firstName: true, lastName: true },
              },
              unit: {
                select: { id: true, unitNumber: true },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ])

    return { inspections, total, offset, limit }
  })

/**
 * Get a single inspection with all items
 */
export const getInspection = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getInspectionSchema))
  // @ts-expect-error - Prisma Decimal types
  .handler(async ({ context, data }) => {
    const inspection = await prisma.inspection.findUnique({
      where: { id: data.id },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        lease: {
          select: {
            id: true,
            tenant: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            unit: {
              select: { id: true, unitNumber: true },
            },
          },
        },
        items: {
          orderBy: [{ room: 'asc' }, { item: 'asc' }],
        },
      },
    })

    if (!inspection) {
      throw new Error('Inspection not found')
    }

    // Verify access
    if (inspection.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized to view this inspection')
    }

    return inspection
  })

/**
 * Create a new inspection
 */
export const createInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createInspectionSchema))
  .handler(async ({ context, data }) => {
    // Verify property exists and user has access
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized to create inspection for this property')
    }

    // If lease is provided, verify it exists
    if (data.leaseId) {
      const lease = await prisma.lease.findUnique({
        where: { id: data.leaseId },
        include: {
          unit: {
            include: { property: true },
          },
        },
      })

      if (!lease) {
        throw new Error('Lease not found')
      }

      if (lease.unit.property.id !== data.propertyId) {
        throw new Error('Lease does not belong to this property')
      }
    }

    const inspection = await prisma.inspection.create({
      data: {
        propertyId: data.propertyId,
        leaseId: data.leaseId,
        type: data.type,
        scheduledDate: data.scheduledDate,
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        lease: {
          select: {
            id: true,
            tenant: {
              select: { firstName: true, lastName: true },
            },
            unit: {
              select: { unitNumber: true },
            },
          },
        },
      },
    })

    return inspection
  })

/**
 * Update inspection details
 */
export const updateInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updateInspectionSchema))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify inspection exists and user has access
    const existing = await prisma.inspection.findUnique({
      where: { id },
      include: {
        property: true,
      },
    })

    if (!existing) {
      throw new Error('Inspection not found')
    }

    if (existing.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized to update this inspection')
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
    })

    return inspection
  })

/**
 * Start an inspection (set status to IN_PROGRESS)
 */
export const startInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(startInspectionSchema))
  .handler(async ({ context, data }) => {
    const existing = await prisma.inspection.findUnique({
      where: { id: data.id },
      include: { property: true },
    })

    if (!existing) {
      throw new Error('Inspection not found')
    }

    if (existing.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (existing.status !== 'SCHEDULED') {
      throw new Error('Inspection must be scheduled to start')
    }

    const inspection = await prisma.inspection.update({
      where: { id: data.id },
      data: { status: 'IN_PROGRESS' },
    })

    return inspection
  })

/**
 * Add an item to an inspection
 */
export const addInspectionItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(addInspectionItemSchema))
  // @ts-expect-error - Prisma Decimal types
  .handler(async ({ context, data }) => {
    const { inspectionId, ...itemData } = data

    // Verify inspection exists and user has access
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { property: true },
    })

    if (!inspection) {
      throw new Error('Inspection not found')
    }

    if (inspection.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (inspection.status === 'COMPLETED' || inspection.status === 'CANCELLED') {
      throw new Error('Cannot add items to a completed or cancelled inspection')
    }

    const item = await prisma.inspectionItem.create({
      data: {
        inspectionId,
        ...itemData,
      },
    })

    return item
  })

/**
 * Update an inspection item
 */
export const updateInspectionItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updateInspectionItemSchema))
  // @ts-expect-error - Prisma Decimal types
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify item exists and user has access
    const existing = await prisma.inspectionItem.findUnique({
      where: { id },
      include: {
        inspection: {
          include: { property: true },
        },
      },
    })

    if (!existing) {
      throw new Error('Inspection item not found')
    }

    if (existing.inspection.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (existing.inspection.status === 'COMPLETED' || existing.inspection.status === 'CANCELLED') {
      throw new Error('Cannot update items on a completed or cancelled inspection')
    }

    const item = await prisma.inspectionItem.update({
      where: { id },
      data: updateData,
    })

    return item
  })

/**
 * Delete an inspection item
 */
export const deleteInspectionItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(deleteInspectionItemSchema))
  .handler(async ({ context, data }) => {
    // Verify item exists and user has access
    const existing = await prisma.inspectionItem.findUnique({
      where: { id: data.id },
      include: {
        inspection: {
          include: { property: true },
        },
      },
    })

    if (!existing) {
      throw new Error('Inspection item not found')
    }

    if (existing.inspection.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (existing.inspection.status === 'COMPLETED' || existing.inspection.status === 'CANCELLED') {
      throw new Error('Cannot delete items from a completed or cancelled inspection')
    }

    await prisma.inspectionItem.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

/**
 * Complete an inspection
 */
export const completeInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(completeInspectionSchema))
  .handler(async ({ context, data }) => {
    const { id, overallCondition, notes, signatureData } = data

    // Verify inspection exists and user has access
    const existing = await prisma.inspection.findUnique({
      where: { id },
      include: {
        property: true,
        items: true,
      },
    })

    if (!existing) {
      throw new Error('Inspection not found')
    }

    if (existing.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (existing.status === 'COMPLETED') {
      throw new Error('Inspection is already completed')
    }

    if (existing.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled inspection')
    }

    // TODO: Save signature to storage if provided
    // For now, we'll just note that a signature was provided
    const notesWithSignature = signatureData
      ? `${notes || ''}\n\n[Signature captured at ${new Date().toISOString()}]`.trim()
      : notes

    const inspection = await prisma.inspection.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        overallCondition,
        notes: notesWithSignature,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        lease: {
          select: {
            id: true,
            tenant: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    })

    return inspection
  })

/**
 * Cancel an inspection
 */
export const cancelInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(cancelInspectionSchema))
  .handler(async ({ context, data }) => {
    const { id, reason } = data

    // Verify inspection exists and user has access
    const existing = await prisma.inspection.findUnique({
      where: { id },
      include: { property: true },
    })

    if (!existing) {
      throw new Error('Inspection not found')
    }

    if (existing.property.managerId !== context.auth.user.id) {
      throw new Error('Not authorized')
    }

    if (existing.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed inspection')
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${existing.notes || ''}\n\nCancellation reason: ${reason}`.trim()
          : existing.notes,
      },
    })

    return inspection
  })
