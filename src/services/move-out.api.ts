import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { prisma } from '~/server/db'
import { authedMiddleware } from '~/middlewares/auth'
import {
  initiateMoveOutSchema,
  getMoveOutStatusSchema,
  createDamageItemSchema,
  updateDamageItemSchema,
  deleteDamageItemSchema,
  calculateDispositionSchema,
  sendDispositionLetterSchema,
  processRefundSchema,
  compareMoveInMoveOutSchema,
  moveOutFiltersSchema,
  calculateDeadlineDate,
  calculateDepositInterest,
  MN_COMPLIANCE,
} from './move-out.schema'

// =============================================================================
// Move-Out Process Functions
// =============================================================================

/**
 * Get all deposit dispositions with filters
 */
export const getDepositDispositions = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(moveOutFiltersSchema))
  .handler(async ({ data, context }) => {
    const { status, overdueOnly, propertyId, limit, offset } = data

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (overdueOnly) {
      where.deadlineDate = { lt: new Date() }
      where.sentDate = null
    }

    if (propertyId) {
      where.lease = {
        unit: {
          propertyId,
        },
      }
    }

    const [dispositions, total] = await Promise.all([
      prisma.depositDisposition.findMany({
        where,
        include: {
          lease: {
            include: {
              tenant: true,
              unit: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
        orderBy: { deadlineDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.depositDisposition.count({ where }),
    ])

    return { dispositions, total }
  })

/**
 * Initiate move-out process for a lease
 */
export const initiateMoveOut = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(initiateMoveOutSchema))
  .handler(async ({ data, context }) => {
    const { leaseId, moveOutDate, notes } = data

    // Get lease with deposit info
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        depositDisposition: true,
        inspections: {
          where: { type: 'MOVE_IN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!lease) {
      throw new Error('Lease not found')
    }

    if (lease.depositDisposition) {
      throw new Error('Move-out process already initiated for this lease')
    }

    // Calculate deadline (21 days from move-out)
    const deadlineDate = calculateDeadlineDate(moveOutDate)

    // Calculate interest accrued
    const depositDate = lease.depositPaidDate || lease.startDate
    const interestAccrued = calculateDepositInterest(
      Number(lease.securityDeposit),
      depositDate,
      moveOutDate,
      Number(lease.depositInterestRate || MN_COMPLIANCE.INTEREST_RATE)
    )

    // Create deposit disposition record
    const disposition = await prisma.depositDisposition.create({
      data: {
        leaseId,
        moveOutDate,
        deadlineDate,
        originalDeposit: lease.securityDeposit,
        interestAccrued,
        totalDeductions: 0,
        refundAmount: Number(lease.securityDeposit) + interestAccrued,
        bankName: lease.depositBankName,
        accountLast4: lease.depositAccountLast4,
        moveInInspectionId: lease.inspections[0]?.id,
        status: 'DRAFT',
      },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    })

    // Update lease with move-out date
    await prisma.lease.update({
      where: { id: leaseId },
      data: { moveOutDate },
    })

    return disposition
  })

/**
 * Get move-out status for a lease
 */
export const getMoveOutStatus = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getMoveOutStatusSchema))
  .handler(async ({ data }) => {
    const { leaseId } = data

    const disposition = await prisma.depositDisposition.findUnique({
      where: { leaseId },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: {
              include: {
                property: true,
              },
            },
            inspections: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!disposition) {
      // Return lease info without disposition
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        include: {
          tenant: true,
          unit: {
            include: {
              property: true,
            },
          },
        },
      })

      return {
        status: 'NOT_STARTED',
        lease,
        disposition: null,
      }
    }

    // Get damage items for move-out inspection
    let damageItems: any[] = []
    if (disposition.moveOutInspectionId) {
      damageItems = await prisma.damageItem.findMany({
        where: { inspectionId: disposition.moveOutInspectionId },
        orderBy: { createdAt: 'asc' },
      })
    }

    return {
      status: disposition.status,
      lease: disposition.lease,
      disposition,
      damageItems,
    }
  })

// =============================================================================
// Damage Item Functions
// =============================================================================

/**
 * Create a damage item
 */
export const createDamageItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createDamageItemSchema))
  .handler(async ({ data }) => {
    const damageItem = await prisma.damageItem.create({
      data: {
        inspectionId: data.inspectionId,
        description: data.description,
        location: data.location,
        repairCost: data.repairCost,
        isNormalWear: data.isNormalWear,
        isPreExisting: data.isPreExisting,
        photoUrls: data.photoUrls,
        notes: data.notes,
        moveInItemId: data.moveInItemId,
      },
    })

    // Recalculate disposition totals if linked to a lease
    const inspection = await prisma.inspection.findUnique({
      where: { id: data.inspectionId },
      include: { lease: { include: { depositDisposition: true } } },
    })

    if (inspection?.lease?.depositDisposition) {
      await recalculateDispositionTotals(inspection.lease.id)
    }

    return damageItem
  })

/**
 * Update a damage item
 */
export const updateDamageItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updateDamageItemSchema))
  .handler(async ({ data }) => {
    const { id, ...updateData } = data

    const damageItem = await prisma.damageItem.update({
      where: { id },
      data: updateData,
      include: {
        inspection: {
          include: {
            lease: { include: { depositDisposition: true } },
          },
        },
      },
    })

    // Recalculate disposition totals
    if (damageItem.inspection?.lease?.depositDisposition) {
      await recalculateDispositionTotals(damageItem.inspection.lease.id)
    }

    return damageItem
  })

/**
 * Delete a damage item
 */
export const deleteDamageItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(deleteDamageItemSchema))
  .handler(async ({ data }) => {
    const damageItem = await prisma.damageItem.findUnique({
      where: { id: data.id },
      include: {
        inspection: {
          include: {
            lease: { include: { depositDisposition: true } },
          },
        },
      },
    })

    if (!damageItem) {
      throw new Error('Damage item not found')
    }

    await prisma.damageItem.delete({ where: { id: data.id } })

    // Recalculate disposition totals
    if (damageItem.inspection?.lease?.depositDisposition) {
      await recalculateDispositionTotals(damageItem.inspection.lease.id)
    }

    return { success: true }
  })

/**
 * Get damage items for an inspection
 */
export const getDamageItems = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getMoveOutStatusSchema.pick({ leaseId: true }).extend({
    inspectionId: getMoveOutStatusSchema.shape.leaseId.optional(),
  })))
  .handler(async ({ data }) => {
    const where: any = {}

    if (data.inspectionId) {
      where.inspectionId = data.inspectionId
    }

    const damageItems = await prisma.damageItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return damageItems
  })

// =============================================================================
// Deposit Disposition Functions
// =============================================================================

/**
 * Calculate/recalculate deposit disposition
 */
export const calculateDisposition = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(calculateDispositionSchema))
  .handler(async ({ data }) => {
    return recalculateDispositionTotals(data.leaseId)
  })

/**
 * Helper to recalculate disposition totals
 */
async function recalculateDispositionTotals(leaseId: string) {
  const disposition = await prisma.depositDisposition.findUnique({
    where: { leaseId },
  })

  if (!disposition) {
    throw new Error('Deposit disposition not found')
  }

  // Get all damage items that are NOT normal wear and NOT pre-existing
  let damageItems: any[] = []
  if (disposition.moveOutInspectionId) {
    damageItems = await prisma.damageItem.findMany({
      where: {
        inspectionId: disposition.moveOutInspectionId,
        isNormalWear: false,
        isPreExisting: false,
      },
    })
  }

  // Calculate total deductions
  const totalDeductions = damageItems.reduce(
    (sum, item) => sum + Number(item.repairCost),
    0
  )

  // Calculate refund amount
  const refundAmount = Math.max(
    0,
    Number(disposition.originalDeposit) + Number(disposition.interestAccrued) - totalDeductions
  )

  // Build itemized deductions for the letter
  const itemizedDeductions = damageItems.map((item) => ({
    description: item.description,
    location: item.location,
    amount: Number(item.repairCost),
    notes: item.notes,
  }))

  // Update disposition
  const updated = await prisma.depositDisposition.update({
    where: { leaseId },
    data: {
      totalDeductions,
      refundAmount,
      itemizedDeductions,
    },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } },
        },
      },
    },
  })

  return updated
}

/**
 * Link move-out inspection to disposition
 */
export const linkMoveOutInspection = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getMoveOutStatusSchema.extend({
    inspectionId: getMoveOutStatusSchema.shape.leaseId,
  })))
  .handler(async ({ data }) => {
    const { leaseId, inspectionId } = data

    const disposition = await prisma.depositDisposition.update({
      where: { leaseId },
      data: { moveOutInspectionId: inspectionId },
    })

    return disposition
  })

/**
 * Send disposition letter
 */
export const sendDispositionLetter = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(sendDispositionLetterSchema))
  .handler(async ({ data }) => {
    const { leaseId, method, trackingNumber } = data

    const disposition = await prisma.depositDisposition.findUnique({
      where: { leaseId },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { property: true } },
          },
        },
      },
    })

    if (!disposition) {
      throw new Error('Deposit disposition not found')
    }

    // TODO: Generate PDF letter
    // TODO: Send email if method is EMAIL

    const updated = await prisma.depositDisposition.update({
      where: { leaseId },
      data: {
        sentDate: new Date(),
        sentMethod: method,
        trackingNumber,
        status: 'SENT',
      },
    })

    return updated
  })

/**
 * Process refund payment
 */
export const processRefund = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(processRefundSchema))
  .handler(async ({ data }) => {
    const { leaseId, method, checkNumber, amount } = data

    const disposition = await prisma.depositDisposition.update({
      where: { leaseId },
      data: {
        refundProcessedDate: new Date(),
        refundMethod: method,
        refundCheckNumber: checkNumber,
        refundAmount: amount,
        status: 'ACKNOWLEDGED',
      },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { property: true } },
          },
        },
      },
    })

    // Update lease status to TERMINATED
    await prisma.lease.update({
      where: { id: leaseId },
      data: { status: 'TERMINATED' },
    })

    return disposition
  })

// =============================================================================
// Comparison Functions
// =============================================================================

/**
 * Compare move-in and move-out inspections
 */
export const compareMoveInMoveOut = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(compareMoveInMoveOutSchema))
  .handler(async ({ data }) => {
    const { leaseId } = data

    // Get both inspections
    const inspections = await prisma.inspection.findMany({
      where: {
        leaseId,
        type: { in: ['MOVE_IN', 'MOVE_OUT'] },
      },
      include: {
        items: true,
        damageItems: true,
      },
      orderBy: { type: 'asc' },
    })

    const moveInInspection = inspections.find((i) => i.type === 'MOVE_IN')
    const moveOutInspection = inspections.find((i) => i.type === 'MOVE_OUT')

    if (!moveInInspection || !moveOutInspection) {
      return {
        moveIn: moveInInspection || null,
        moveOut: moveOutInspection || null,
        comparison: [],
        missingMoveIn: !moveInInspection,
        missingMoveOut: !moveOutInspection,
      }
    }

    // Build comparison by room and item
    const comparison: any[] = []

    // Group move-in items by room and item name
    const moveInItemsMap = new Map<string, any>()
    for (const item of moveInInspection.items) {
      const key = `${item.room}|${item.item}`
      moveInItemsMap.set(key, item)
    }

    // Compare with move-out items
    for (const moveOutItem of moveOutInspection.items) {
      const key = `${moveOutItem.room}|${moveOutItem.item}`
      const moveInItem = moveInItemsMap.get(key)

      comparison.push({
        room: moveOutItem.room,
        item: moveOutItem.item,
        moveIn: moveInItem || null,
        moveOut: moveOutItem,
        conditionChanged: moveInItem
          ? moveInItem.condition !== moveOutItem.condition
          : true,
        damageAdded: moveOutItem.hasDamage && (!moveInItem || !moveInItem.hasDamage),
      })

      // Remove from map to track unmatched move-in items
      moveInItemsMap.delete(key)
    }

    // Add any move-in items not in move-out (items that were removed)
    for (const [key, moveInItem] of moveInItemsMap) {
      comparison.push({
        room: moveInItem.room,
        item: moveInItem.item,
        moveIn: moveInItem,
        moveOut: null,
        conditionChanged: true,
        itemRemoved: true,
      })
    }

    // Sort by room then item
    comparison.sort((a, b) => {
      if (a.room !== b.room) return a.room.localeCompare(b.room)
      return a.item.localeCompare(b.item)
    })

    return {
      moveIn: moveInInspection,
      moveOut: moveOutInspection,
      comparison,
      missingMoveIn: false,
      missingMoveOut: false,
    }
  })

/**
 * Get disposition by lease ID
 */
export const getDepositDisposition = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getMoveOutStatusSchema))
  .handler(async ({ data }) => {
    const disposition = await prisma.depositDisposition.findUnique({
      where: { leaseId: data.leaseId },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { property: true } },
          },
        },
      },
    })

    return disposition
  })
