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
  photoUploadRequestSchema,
} from '~/services/maintenance.schema'
import {
  createUploadUrl,
  createDownloadUrl,
  validateFile,
} from '~/server/storage'

// Get all maintenance requests
export const getMaintenanceRequests = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
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
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
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
        statusHistory: {
          orderBy: { createdAt: 'desc' },
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

    // Create request with initial status history in a transaction
    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.maintenanceRequest.create({
        data: {
          ...data,
          createdById: context.auth.user.id,
        },
        include: {
          unit: { include: { property: true } },
          tenant: true,
        },
      })

      // Create initial status history entry
      await tx.workOrderStatusHistory.create({
        data: {
          requestId: newRequest.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          changedByName: context.auth.user.name,
          changedByType: 'staff',
          notes: 'Work order created',
        },
      })

      return newRequest
    })

    return request
  })

// Update maintenance request
export const updateMaintenanceRequest = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema.merge(updateMaintenanceSchema)))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
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

    // Check if status is changing
    const statusChanged = updateData.status && updateData.status !== existing.status

    // Use transaction to update request and record status history
    const request = await prisma.$transaction(async (tx) => {
      // Record status history if status changed
      if (statusChanged) {
        await tx.workOrderStatusHistory.create({
          data: {
            requestId: id,
            fromStatus: existing.status,
            toStatus: updateData.status!,
            changedByName: context.auth.user.name,
            changedByType: 'staff',
          },
        })
      }

      // Update the maintenance request
      return tx.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          unit: { include: { property: true } },
          tenant: true,
          vendor: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })
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

// Allowed photo types
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_PHOTO_SIZE = 10 * 1024 * 1024 // 10MB

// Create photo upload URL
export const createMaintenancePhotoUploadUrl = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(photoUploadRequestSchema))
  .handler(async ({ context, data }) => {
    // Verify the maintenance request exists and belongs to user
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.requestId,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    // Validate file
    const validation = validateFile(
      {
        size: data.fileSize,
        type: data.mimeType,
        name: data.fileName,
      },
      ALLOWED_PHOTO_TYPES
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    if (data.fileSize > MAX_PHOTO_SIZE) {
      throw new Error(`Photo size exceeds maximum of ${MAX_PHOTO_SIZE / 1024 / 1024}MB`)
    }

    // Generate signed upload URL
    const uploadResult = await createUploadUrl(
      context.auth.user.id,
      data.fileName,
      data.mimeType,
      {
        propertyId: request.unitId,
        documentType: `maintenance/${data.photoType}`,
      }
    )

    return {
      signedUrl: uploadResult.signedUrl,
      token: uploadResult.token,
      path: uploadResult.path,
    }
  })

// Confirm photo upload and update maintenance request
export const confirmMaintenancePhotoUpload = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(
    zodValidator(
      photoUploadRequestSchema.pick({ requestId: true, photoType: true }).extend({
        storagePath: photoUploadRequestSchema.shape.fileName,
      })
    )
  )
  .handler(async ({ context, data }) => {
    // Verify ownership
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.requestId,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    // Generate public URL for the uploaded photo
    const photoUrl = await createDownloadUrl(data.storagePath)

    // Update the maintenance request with the new photo URL
    const fieldToUpdate = data.photoType === 'completion' ? 'completionPhotos' : 'photoUrls'
    const currentPhotos = (request[fieldToUpdate] as string[]) || []

    // Store the storage path instead of signed URL for persistence
    // We'll generate fresh signed URLs when displaying
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: data.requestId },
      data: {
        [fieldToUpdate]: [...currentPhotos, data.storagePath],
      },
    })

    return {
      photoUrl,
      storagePath: data.storagePath,
      request: updatedRequest,
    }
  })

// Get signed download URLs for maintenance photos
export const getMaintenancePhotoUrls = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema))
  .handler(async ({ context, data }) => {
    // Verify ownership
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.id,
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: {
        photoUrls: true,
        completionPhotos: true,
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    // Generate signed URLs for all photos
    const photoUrls = await Promise.all(
      (request.photoUrls || []).map(async (path) => {
        try {
          // Check if it's already a URL (legacy data) or a storage path
          if (path.startsWith('http')) {
            return path
          }
          return await createDownloadUrl(path)
        } catch {
          return null
        }
      })
    )

    const completionPhotoUrls = await Promise.all(
      (request.completionPhotos || []).map(async (path) => {
        try {
          if (path.startsWith('http')) {
            return path
          }
          return await createDownloadUrl(path)
        } catch {
          return null
        }
      })
    )

    return {
      photoUrls: photoUrls.filter(Boolean) as string[],
      completionPhotoUrls: completionPhotoUrls.filter(Boolean) as string[],
    }
  })
