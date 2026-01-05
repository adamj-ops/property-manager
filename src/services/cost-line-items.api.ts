import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createCostLineItemSchema,
  updateCostLineItemSchema,
  costLineItemIdSchema,
  costLineItemFiltersSchema,
  bulkCreateCostLineItemsSchema,
  bulkDeleteCostLineItemsSchema,
  costLineItemTypeLabels,
  costLineItemTypeIcons,
  type CostLineItemSummary,
  type CostLineItemType,
} from '~/services/cost-line-items.schema'

// Helper to verify user has access to the maintenance request
async function verifyRequestAccess(requestId: string, userId: string) {
  const request = await prisma.maintenanceRequest.findFirst({
    where: {
      id: requestId,
      unit: {
        property: { managerId: userId },
      },
    },
    select: { id: true },
  })

  if (!request) {
    throw new Error('Maintenance request not found or access denied')
  }

  return request
}

// Helper to recalculate and update MaintenanceRequest.actualCost
async function syncActualCost(requestId: string) {
  const result = await prisma.maintenanceCostLineItem.aggregate({
    where: { requestId },
    _sum: { totalCost: true },
  })

  const tenantChargeResult = await prisma.maintenanceCostLineItem.aggregate({
    where: { requestId, chargeToTenant: true },
    _sum: { tenantChargeAmount: true },
  })

  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      actualCost: result._sum.totalCost || 0,
      tenantCharge: tenantChargeResult._sum.tenantChargeAmount || 0,
    },
  })
}

// =============================================================================
// GET COST LINE ITEMS
// =============================================================================

export const getCostLineItems = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costLineItemFiltersSchema))
  .handler(async ({ context, data }) => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    const items = await prisma.maintenanceCostLineItem.findMany({
      where: {
        requestId: data.requestId,
        ...(data.type && { type: data.type }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      laborHours: item.laborHours ? Number(item.laborHours) : null,
      laborRate: item.laborRate ? Number(item.laborRate) : null,
      tenantChargeAmount: item.tenantChargeAmount ? Number(item.tenantChargeAmount) : null,
      warrantyExpiry: item.warrantyExpiry?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  })

// =============================================================================
// GET SINGLE COST LINE ITEM
// =============================================================================

export const getCostLineItem = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costLineItemIdSchema))
  .handler(async ({ context, data }) => {
    const item = await prisma.maintenanceCostLineItem.findFirst({
      where: {
        id: data.id,
        request: {
          unit: {
            property: { managerId: context.auth.user.id },
          },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    if (!item) {
      throw new Error('Cost line item not found or access denied')
    }

    return {
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      laborHours: item.laborHours ? Number(item.laborHours) : null,
      laborRate: item.laborRate ? Number(item.laborRate) : null,
      tenantChargeAmount: item.tenantChargeAmount ? Number(item.tenantChargeAmount) : null,
      warrantyExpiry: item.warrantyExpiry?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

// =============================================================================
// CREATE COST LINE ITEM
// =============================================================================

export const createCostLineItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createCostLineItemSchema))
  .handler(async ({ context, data }) => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    // Calculate total cost
    const totalCost = data.quantity * data.unitCost

    // If charging to tenant and no amount specified, use total cost
    const tenantChargeAmount = data.chargeToTenant
      ? data.tenantChargeAmount ?? totalCost
      : null

    const item = await prisma.maintenanceCostLineItem.create({
      data: {
        requestId: data.requestId,
        type: data.type,
        description: data.description,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost,
        partNumber: data.partNumber,
        supplier: data.supplier,
        warranty: data.warranty,
        warrantyExpiry: data.warrantyExpiry,
        laborHours: data.laborHours,
        laborRate: data.laborRate,
        workerId: data.workerId,
        receiptUrl: data.receiptUrl,
        chargeToTenant: data.chargeToTenant,
        tenantChargeAmount,
        createdById: context.auth.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    // Sync actual cost on parent request
    await syncActualCost(data.requestId)

    return {
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      laborHours: item.laborHours ? Number(item.laborHours) : null,
      laborRate: item.laborRate ? Number(item.laborRate) : null,
      tenantChargeAmount: item.tenantChargeAmount ? Number(item.tenantChargeAmount) : null,
      warrantyExpiry: item.warrantyExpiry?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

// =============================================================================
// UPDATE COST LINE ITEM
// =============================================================================

export const updateCostLineItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costLineItemIdSchema.merge(updateCostLineItemSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify access
    const existing = await prisma.maintenanceCostLineItem.findFirst({
      where: {
        id,
        request: {
          unit: {
            property: { managerId: context.auth.user.id },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Cost line item not found or access denied')
    }

    // Calculate new total if quantity or unit cost changed
    const quantity = updateData.quantity ?? Number(existing.quantity)
    const unitCost = updateData.unitCost ?? Number(existing.unitCost)
    const totalCost = quantity * unitCost

    // Handle tenant charge amount
    let tenantChargeAmount = updateData.tenantChargeAmount
    if (updateData.chargeToTenant === true && tenantChargeAmount === undefined) {
      tenantChargeAmount = totalCost
    } else if (updateData.chargeToTenant === false) {
      tenantChargeAmount = null
    }

    const item = await prisma.maintenanceCostLineItem.update({
      where: { id },
      data: {
        ...updateData,
        totalCost,
        tenantChargeAmount,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    // Sync actual cost on parent request
    await syncActualCost(existing.requestId)

    return {
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      laborHours: item.laborHours ? Number(item.laborHours) : null,
      laborRate: item.laborRate ? Number(item.laborRate) : null,
      tenantChargeAmount: item.tenantChargeAmount ? Number(item.tenantChargeAmount) : null,
      warrantyExpiry: item.warrantyExpiry?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

// =============================================================================
// DELETE COST LINE ITEM
// =============================================================================

export const deleteCostLineItem = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costLineItemIdSchema))
  .handler(async ({ context, data }) => {
    // Verify access
    const existing = await prisma.maintenanceCostLineItem.findFirst({
      where: {
        id: data.id,
        request: {
          unit: {
            property: { managerId: context.auth.user.id },
          },
        },
      },
    })

    if (!existing) {
      throw new Error('Cost line item not found or access denied')
    }

    await prisma.maintenanceCostLineItem.delete({
      where: { id: data.id },
    })

    // Sync actual cost on parent request
    await syncActualCost(existing.requestId)

    return { success: true }
  })

// =============================================================================
// BULK CREATE COST LINE ITEMS
// =============================================================================

export const bulkCreateCostLineItems = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkCreateCostLineItemsSchema))
  .handler(async ({ context, data }) => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    const itemsToCreate = data.items.map((item) => {
      const totalCost = item.quantity * item.unitCost
      const tenantChargeAmount = item.chargeToTenant
        ? item.tenantChargeAmount ?? totalCost
        : null

      return {
        requestId: data.requestId,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
        partNumber: item.partNumber,
        supplier: item.supplier,
        warranty: item.warranty,
        warrantyExpiry: item.warrantyExpiry,
        laborHours: item.laborHours,
        laborRate: item.laborRate,
        workerId: item.workerId,
        receiptUrl: item.receiptUrl,
        chargeToTenant: item.chargeToTenant,
        tenantChargeAmount,
        createdById: context.auth.user.id,
      }
    })

    const result = await prisma.maintenanceCostLineItem.createMany({
      data: itemsToCreate,
    })

    // Sync actual cost on parent request
    await syncActualCost(data.requestId)

    return { created: result.count }
  })

// =============================================================================
// BULK DELETE COST LINE ITEMS
// =============================================================================

export const bulkDeleteCostLineItems = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkDeleteCostLineItemsSchema))
  .handler(async ({ context, data }) => {
    // Verify access and get request IDs
    const items = await prisma.maintenanceCostLineItem.findMany({
      where: {
        id: { in: data.ids },
        request: {
          unit: {
            property: { managerId: context.auth.user.id },
          },
        },
      },
      select: { id: true, requestId: true },
    })

    if (items.length === 0) {
      throw new Error('No items found or access denied')
    }

    // Get unique request IDs for syncing
    const requestIds = [...new Set(items.map((i) => i.requestId))]

    // Delete items
    const result = await prisma.maintenanceCostLineItem.deleteMany({
      where: { id: { in: items.map((i) => i.id) } },
    })

    // Sync actual cost on all affected requests
    await Promise.all(requestIds.map((id) => syncActualCost(id)))

    return { deleted: result.count }
  })

// =============================================================================
// GET COST LINE ITEM SUMMARY
// =============================================================================

export const getCostLineItemSummary = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costLineItemFiltersSchema.pick({ requestId: true })))
  .handler(async ({ context, data }): Promise<CostLineItemSummary> => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    // Get all items for the request
    const items = await prisma.maintenanceCostLineItem.findMany({
      where: { requestId: data.requestId },
      select: {
        type: true,
        totalCost: true,
        chargeToTenant: true,
        tenantChargeAmount: true,
      },
    })

    // Initialize aggregation
    const byTypeMap = new Map<CostLineItemType, { total: number; count: number }>()
    let totalCost = 0
    let laborCost = 0
    let partsCost = 0
    let materialsCost = 0
    let otherCosts = 0
    let tenantCharges = 0

    for (const item of items) {
      const cost = Number(item.totalCost)
      totalCost += cost

      // Track by type
      const existing = byTypeMap.get(item.type as CostLineItemType) || { total: 0, count: 0 }
      existing.total += cost
      existing.count += 1
      byTypeMap.set(item.type as CostLineItemType, existing)

      // Categorize
      switch (item.type) {
        case 'LABOR':
          laborCost += cost
          break
        case 'PARTS':
          partsCost += cost
          break
        case 'MATERIALS':
          materialsCost += cost
          break
        default:
          otherCosts += cost
      }

      // Tenant charges
      if (item.chargeToTenant && item.tenantChargeAmount) {
        tenantCharges += Number(item.tenantChargeAmount)
      }
    }

    // Convert map to array
    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      label: costLineItemTypeLabels[type],
      icon: costLineItemTypeIcons[type],
      total: data.total,
      count: data.count,
    }))

    return {
      totalCost,
      laborCost,
      partsCost,
      materialsCost,
      otherCosts,
      tenantCharges,
      netCost: totalCost - tenantCharges,
      itemCount: items.length,
      byType,
    }
  })
