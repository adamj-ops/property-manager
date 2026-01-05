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
  bulkUpdateStatusSchema,
  bulkAssignVendorSchema,
  bulkDeleteSchema,
  createTemplateSchema,
  updateTemplateSchema,
  templateIdSchema,
  templateFiltersSchema,
} from '~/services/maintenance.schema'
import {
  createUploadUrl,
  createDownloadUrl,
  validateFile,
} from '~/server/storage'
import {
  sendMaintenanceStatusNotification,
  shouldNotifyOnStatusChange,
} from '~/server/maintenance-notifications'
import { sendInitialEmergencyAlert } from '~/server/emergency-escalation'

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

    // Calculate SLA due dates
    const now = new Date()
    const slaResponseDueAt = data.slaResponseHours
      ? new Date(now.getTime() + data.slaResponseHours * 60 * 60 * 1000)
      : null
    const slaResolutionDueAt = data.slaResolutionHours
      ? new Date(now.getTime() + data.slaResolutionHours * 60 * 60 * 1000)
      : null

    // Create request with initial status history in a transaction
    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.maintenanceRequest.create({
        data: {
          ...data,
          createdById: context.auth.user.id,
          slaResponseDueAt,
          slaResolutionDueAt,
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

    // Send initial emergency alert if this is an emergency work order
    if (data.priority === 'EMERGENCY') {
      // Fire and forget - don't block the response
      sendInitialEmergencyAlert(request.id).catch((error) => {
        console.error('Failed to send initial emergency alert:', error)
      })
    }

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

    // Auto-set firstRespondedAt when status changes to ACKNOWLEDGED (for SLA tracking)
    const isFirstResponse =
      statusChanged &&
      updateData.status === 'ACKNOWLEDGED' &&
      existing.status === 'SUBMITTED' &&
      !existing.firstRespondedAt

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
        data: {
          ...updateData,
          ...(isFirstResponse ? { firstRespondedAt: new Date() } : {}),
        },
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

    // Send email notification if status changed (async, non-blocking)
    if (statusChanged && shouldNotifyOnStatusChange(existing.status, updateData.status!)) {
      // Fire and forget - don't await to avoid blocking the response
      sendMaintenanceStatusNotification({
        request: {
          id: request.id,
          requestNumber: request.requestNumber,
          title: request.title,
          unit: {
            unitNumber: request.unit.unitNumber,
            property: {
              name: request.unit.property.name,
            },
          },
          tenant: request.tenant ? {
            id: request.tenant.id,
            firstName: request.tenant.firstName,
            lastName: request.tenant.lastName,
            email: request.tenant.email,
          } : null,
        },
        previousStatus: existing.status,
        newStatus: updateData.status!,
      }).catch(() => {
        // Error already logged in the notification service
      })
    }

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

// =============================================================================
// EMERGENCY ESCALATION
// =============================================================================

import { z } from 'zod'
import {
  acknowledgeEscalation,
  processEmergencyEscalations,
  getEmergencyStats,
} from '~/server/emergency-escalation'

// Acknowledge an escalation
export const acknowledgeEmergencyEscalation = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema))
  .handler(async ({ context, data }) => {
    // Verify ownership
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id: data.id,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!request) {
      throw new Error('Maintenance request not found')
    }

    await acknowledgeEscalation(data.id, context.auth.user.id)

    // Also update status to ACKNOWLEDGED if still SUBMITTED
    if (request.status === 'SUBMITTED') {
      await prisma.maintenanceRequest.update({
        where: { id: data.id },
        data: { status: 'ACKNOWLEDGED' },
      })

      // Add status history entry
      await prisma.workOrderStatusHistory.create({
        data: {
          requestId: data.id,
          fromStatus: 'SUBMITTED',
          toStatus: 'ACKNOWLEDGED',
          reason: 'Emergency escalation acknowledged',
          changedByName: `${context.auth.user.firstName} ${context.auth.user.lastName}`,
          changedByType: 'staff',
        },
      })
    }

    return { success: true }
  })

// Get emergency statistics for dashboard
export const getEmergencyDashboardStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    return getEmergencyStats(context.auth.user.id)
  })

// Process emergency escalations (for cron job)
// Note: In production, this would be protected with a different auth mechanism
export const runEmergencyEscalationCheck = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .handler(async () => {
    return processEmergencyEscalations()
  })

// Get unacknowledged emergencies for the current user
export const getUnacknowledgedEmergencies = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const emergencies = await prisma.maintenanceRequest.findMany({
      where: {
        priority: 'EMERGENCY',
        escalationLevel: { gt: 0 },
        escalationAcknowledgedAt: null,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        unit: {
          property: {
            managerId: context.auth.user.id,
          },
        },
      },
      select: {
        id: true,
        requestNumber: true,
        title: true,
        category: true,
        escalationLevel: true,
        createdAt: true,
        unit: {
          select: {
            unitNumber: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { escalationLevel: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return emergencies
  })

// =============================================================================
// BULK ACTIONS
// =============================================================================

// Bulk update status
export const bulkUpdateStatus = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkUpdateStatusSchema))
  .handler(async ({ context, data }) => {
    const { ids, status } = data

    // Verify all requests belong to user
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        id: { in: ids },
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: { id: true, status: true },
    })

    if (requests.length !== ids.length) {
      throw new Error('One or more work orders not found or not accessible')
    }

    // Update all requests in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the requests
      await tx.maintenanceRequest.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
          ...(status === 'ACKNOWLEDGED' ? { firstRespondedAt: new Date() } : {}),
        },
      })

      // Create status history entries
      await Promise.all(
        requests.map((req) =>
          tx.workOrderStatusHistory.create({
            data: {
              requestId: req.id,
              fromStatus: req.status,
              toStatus: status,
              changedByName: context.auth.user.name,
              changedByType: 'staff',
              notes: 'Bulk status update',
            },
          })
        )
      )
    })

    return { updated: ids.length }
  })

// Bulk assign vendor
export const bulkAssignVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkAssignVendorSchema))
  .handler(async ({ context, data }) => {
    const { ids, vendorId } = data

    // Verify all requests belong to user
    const count = await prisma.maintenanceRequest.count({
      where: {
        id: { in: ids },
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (count !== ids.length) {
      throw new Error('One or more work orders not found or not accessible')
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    await prisma.maintenanceRequest.updateMany({
      where: { id: { in: ids } },
      data: { vendorId },
    })

    return { updated: ids.length }
  })

// Bulk delete (cancel) work orders
export const bulkDeleteWorkOrders = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkDeleteSchema))
  .handler(async ({ context, data }) => {
    const { ids } = data

    // Verify all requests belong to user and get their current status
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        id: { in: ids },
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: { id: true, status: true },
    })

    if (requests.length !== ids.length) {
      throw new Error('One or more work orders not found or not accessible')
    }

    // Cancel (soft delete) by setting status to CANCELLED
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRequest.updateMany({
        where: { id: { in: ids } },
        data: { status: 'CANCELLED' },
      })

      // Create status history entries
      await Promise.all(
        requests.map((req) =>
          tx.workOrderStatusHistory.create({
            data: {
              requestId: req.id,
              fromStatus: req.status,
              toStatus: 'CANCELLED',
              changedByName: context.auth.user.name,
              changedByType: 'staff',
              notes: 'Bulk cancellation',
            },
          })
        )
      )
    })

    return { deleted: ids.length }
  })

// =============================================================================
// WORK ORDER TEMPLATES
// =============================================================================

// Get all templates
export const getMaintenanceTemplates = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateFiltersSchema))
  .handler(async ({ context, data }) => {
    const { category, isActive, search, limit, offset } = data

    const where = {
      createdById: context.auth.user.id,
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [templates, total] = await Promise.all([
      prisma.maintenanceTemplate.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.maintenanceTemplate.count({ where }),
    ])

    return { templates, total, limit, offset }
  })

// Get single template
export const getMaintenanceTemplate = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ context, data }) => {
    const template = await prisma.maintenanceTemplate.findFirst({
      where: {
        id: data.id,
        createdById: context.auth.user.id,
      },
    })

    if (!template) {
      throw new Error('Template not found')
    }

    return template
  })

// Create template
export const createMaintenanceTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createTemplateSchema))
  .handler(async ({ context, data }) => {
    const template = await prisma.maintenanceTemplate.create({
      data: {
        ...data,
        createdById: context.auth.user.id,
      },
    })

    return template
  })

// Update template
export const updateMaintenanceTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema.merge(updateTemplateSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.maintenanceTemplate.findFirst({
      where: {
        id,
        createdById: context.auth.user.id,
      },
    })

    if (!existing) {
      throw new Error('Template not found')
    }

    const template = await prisma.maintenanceTemplate.update({
      where: { id },
      data: updateData,
    })

    return template
  })

// Delete template
export const deleteMaintenanceTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ context, data }) => {
    const existing = await prisma.maintenanceTemplate.findFirst({
      where: {
        id: data.id,
        createdById: context.auth.user.id,
      },
    })

    if (!existing) {
      throw new Error('Template not found')
    }

    await prisma.maintenanceTemplate.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// Increment template usage count
export const incrementTemplateUsage = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ context, data }) => {
    await prisma.maintenanceTemplate.updateMany({
      where: {
        id: data.id,
        createdById: context.auth.user.id,
      },
      data: {
        usageCount: { increment: 1 },
      },
    })

    return { success: true }
  })

// =============================================================================
// STAFF/TEAM MEMBERS
// =============================================================================

// Get team members for staff assignment
export const getTeamMembers = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    // Get the user's team(s) - they could be an owner or member
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: context.auth.user.id,
      },
      select: {
        teamId: true,
        role: true,
      },
    })

    const ownedTeams = await prisma.team.findMany({
      where: {
        ownerId: context.auth.user.id,
      },
      select: {
        id: true,
      },
    })

    const teamIds = [
      ...teamMemberships.map((m) => m.teamId),
      ...ownedTeams.map((t) => t.id),
    ]

    if (teamIds.length === 0) {
      // No team - return just the current user as a staff option
      return {
        staff: [
          {
            id: context.auth.user.id,
            name: context.auth.user.name,
            email: context.auth.user.email,
            role: 'OWNER' as const,
          },
        ],
      }
    }

    // Get all team members from these teams
    const members = await prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIds },
        acceptedAt: { not: null }, // Only accepted members
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Also include team owners
    const owners = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
      },
      select: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Combine and deduplicate
    const staffMap = new Map<string, { id: string; name: string; email: string; role: string }>()

    // Add owners first (highest priority)
    owners.forEach((t) => {
      if (!staffMap.has(t.owner.id)) {
        staffMap.set(t.owner.id, { ...t.owner, role: 'OWNER' })
      }
    })

    // Add members
    members.forEach((m) => {
      if (!staffMap.has(m.user.id)) {
        staffMap.set(m.user.id, { ...m.user, role: m.role })
      }
    })

    return {
      staff: Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }
  })

// =============================================================================
// EXPORT
// =============================================================================

import { exportFiltersSchema } from '~/services/maintenance.schema'

// Export work orders as CSV
export const exportWorkOrders = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(exportFiltersSchema))
  .handler(async ({ context, data }) => {
    const {
      propertyId,
      status,
      priority,
      category,
      dateFrom,
      dateTo,
      format,
    } = data

    const where = {
      unit: {
        property: { managerId: context.auth.user.id },
        ...(propertyId && { propertyId }),
      },
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        unit: {
          include: {
            property: { select: { name: true, addressLine1: true } },
          },
        },
        tenant: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        vendor: {
          select: { companyName: true, phone: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format data for export
    const exportData = requests.map((req) => ({
      'Request Number': req.requestNumber,
      Title: req.title,
      Description: req.description,
      Status: req.status,
      Priority: req.priority,
      Category: req.category,
      Property: req.unit.property.name,
      'Property Address': req.unit.property.addressLine1,
      'Unit Number': req.unit.unitNumber,
      'Tenant Name': req.tenant
        ? `${req.tenant.firstName} ${req.tenant.lastName}`
        : '',
      'Tenant Email': req.tenant?.email || '',
      'Tenant Phone': req.tenant?.phone || '',
      'Vendor': req.vendor?.companyName || '',
      'Vendor Phone': req.vendor?.phone || '',
      'Assigned To': req.assignedTo?.name || '',
      'Estimated Cost': req.estimatedCost ? Number(req.estimatedCost) : '',
      'Actual Cost': req.actualCost ? Number(req.actualCost) : '',
      'Created Date': req.createdAt.toISOString(),
      'Scheduled Date': req.scheduledDate?.toISOString() || '',
      'Completed Date': req.completedAt?.toISOString() || '',
    }))

    if (format === 'json') {
      return { data: exportData, format: 'json' as const }
    }

    // Convert to CSV
    if (exportData.length === 0) {
      return { data: '', format: 'csv' as const }
    }

    const headers = Object.keys(exportData[0])
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            // Escape values with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(',')
      ),
    ]

    return { data: csvRows.join('\n'), format: 'csv' as const }
  })

// =============================================================================
// COMMENT ATTACHMENTS
// =============================================================================

import { commentAttachmentUploadSchema, commentIdSchema } from '~/services/maintenance.schema'

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB

// Create comment attachment upload URL
export const createCommentAttachmentUploadUrl = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(commentAttachmentUploadSchema))
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
      ALLOWED_ATTACHMENT_TYPES
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    if (data.fileSize > MAX_ATTACHMENT_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`)
    }

    // Generate signed upload URL
    const uploadResult = await createUploadUrl(
      context.auth.user.id,
      data.fileName,
      data.mimeType,
      {
        propertyId: request.unitId,
        documentType: 'maintenance/comment-attachments',
      }
    )

    return {
      signedUrl: uploadResult.signedUrl,
      token: uploadResult.token,
      path: uploadResult.path,
    }
  })

// Update addMaintenanceComment to support attachments
export const addMaintenanceCommentWithAttachments = createServerFn({ method: 'POST' })
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
        isInternal: data.isInternal ?? false,
        authorName: context.auth.user.name,
        authorType: 'staff',
        attachments: data.attachments || [],
      },
    })

    return comment
  })

// Get signed URLs for comment attachments
export const getCommentAttachmentUrls = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(commentIdSchema))
  .handler(async ({ context, data }) => {
    const comment = await prisma.maintenanceComment.findFirst({
      where: {
        id: data.commentId,
        request: {
          unit: { property: { managerId: context.auth.user.id } },
        },
      },
      select: {
        attachments: true,
      },
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    // Generate signed URLs for all attachments
    const attachmentUrls = await Promise.all(
      (comment.attachments || []).map(async (path) => {
        try {
          if (path.startsWith('http')) {
            return { path, url: path }
          }
          const url = await createDownloadUrl(path)
          return { path, url }
        } catch {
          return null
        }
      })
    )

    return {
      attachments: attachmentUrls.filter(Boolean) as { path: string; url: string }[],
    }
  })
