import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceFiltersSchema,
  maintenanceIdSchema,
  addCommentSchema,
} from '~/services/maintenance.schema'

// Get all maintenance requests
export const getMaintenanceRequests = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceFiltersSchema))
  .handler(async ({ context, data }) => {
    const {
      propertyId,
      unitId,
      tenantId,
      vendorId,
      assignedToId,
      status,
      priority,
      category,
      search,
      limit,
      offset,
    } = data

    const where = {
      unit: {
        property: { managerId: context.auth.user.id },
        ...(propertyId && { propertyId }),
      },
      ...(unitId && { unitId }),
      ...(tenantId && { tenantId }),
      ...(vendorId && { vendorId }),
      ...(assignedToId && { assignedToId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { requestNumber: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          unit: {
            include: {
              property: { select: { id: true, name: true, addressLine1: true } },
            },
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          vendor: {
            select: { id: true, companyName: true, phone: true },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, expenses: true },
          },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.maintenanceRequest.count({ where }),
    ])

    return { requests, total, limit, offset }
  })

// Get single maintenance request
export const getMaintenanceRequest = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema))
  .handler(async ({ context, data }) => {
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.id,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        unit: {
          include: { property: true },
        },
        tenant: true,
        vendor: true,
        assignedTo: true,
        createdBy: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
        },
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    return request
  })

// Create maintenance request
export const createMaintenanceRequest = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createMaintenanceSchema))
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

    const request = await prisma.maintenanceRequest.create({
      data: {
        ...data,
        createdById: context.auth.user.id,
      },
      include: {
        unit: { include: { property: true } },
        tenant: true,
      },
    })

    return request
  })

// Update maintenance request
export const updateMaintenanceRequest = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema.merge(updateMaintenanceSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!existing) {
      throw new Error('Maintenance request not found')
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (updateData.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date()
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        unit: { include: { property: true } },
        tenant: true,
        vendor: true,
      },
    })

    return request
  })

// Add comment to maintenance request
export const addMaintenanceComment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(addCommentSchema))
  .handler(async ({ context, data }) => {
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.requestId,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    const comment = await prisma.maintenanceComment.create({
      data: {
        requestId: data.requestId,
        content: data.content,
        isInternal: data.isInternal,
        authorName: context.auth.user.name,
        authorType: 'staff',
      },
    })

    return comment
  })

// Get maintenance stats
export const getMaintenanceStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const where = {
      unit: { property: { managerId: context.auth.user.id } },
    }

    const [open, inProgress, completed, emergency] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: { ...where, status: { in: ['SUBMITTED', 'ACKNOWLEDGED'] } },
      }),
      prisma.maintenanceRequest.count({
        where: { ...where, status: { in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING_PARTS'] } },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...where,
          status: 'COMPLETED',
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...where,
          priority: 'EMERGENCY',
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ])

    return { open, inProgress, completedLast30Days: completed, emergencyOpen: emergency }
  })
