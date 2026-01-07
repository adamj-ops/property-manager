import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  invoiceFiltersSchema,
  invoiceIdSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  submitInvoiceSchema,
  startReviewSchema,
  approveInvoiceSchema,
  rejectInvoiceSchema,
  markInvoicePaidSchema,
  cancelInvoiceSchema,
  type InvoiceSummary,
  type InvoiceStatus,
} from '~/services/invoices.schema'

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

// Helper to verify user has access to the invoice
async function verifyInvoiceAccess(invoiceId: string, userId: string) {
  const invoice = await prisma.maintenanceInvoice.findFirst({
    where: {
      id: invoiceId,
      request: {
        unit: {
          property: { managerId: userId },
        },
      },
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found or access denied')
  }

  return invoice
}

// Helper to convert invoice to serializable format
function serializeInvoice(invoice: any) {
  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() || null,
    submittedAt: invoice.submittedAt?.toISOString() || null,
    reviewStartedAt: invoice.reviewStartedAt?.toISOString() || null,
    approvedAt: invoice.approvedAt?.toISOString() || null,
    rejectedAt: invoice.rejectedAt?.toISOString() || null,
    paidAt: invoice.paidAt?.toISOString() || null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    costLineItems: invoice.costLineItems?.map((item: any) => ({
      id: item.id,
      description: item.description,
      totalCost: Number(item.totalCost),
    })),
  }
}

// =============================================================================
// GET INVOICES
// =============================================================================

export const getInvoices = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(invoiceFiltersSchema))
  .handler(async ({ context, data }) => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    const invoices = await prisma.maintenanceInvoice.findMany({
      where: {
        requestId: data.requestId,
        ...(data.status && { status: data.status }),
        ...(data.vendorId && { vendorId: data.vendorId }),
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
        costLineItems: {
          select: { id: true, description: true, totalCost: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return invoices.map(serializeInvoice)
  })

// =============================================================================
// GET SINGLE INVOICE
// =============================================================================

export const getInvoice = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(invoiceIdSchema))
  .handler(async ({ context, data }) => {
    const invoice = await prisma.maintenanceInvoice.findFirst({
      where: {
        id: data.id,
        request: {
          unit: {
            property: { managerId: context.auth.user.id },
          },
        },
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
        costLineItems: {
          select: { id: true, description: true, totalCost: true },
        },
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found or access denied')
    }

    return serializeInvoice(invoice)
  })

// =============================================================================
// CREATE INVOICE
// =============================================================================

export const createInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createInvoiceSchema))
  .handler(async ({ context, data }) => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    // Calculate total
    const totalAmount = data.subtotal + data.taxAmount

    const invoice = await prisma.maintenanceInvoice.create({
      data: {
        requestId: data.requestId,
        vendorId: data.vendorId,
        vendorInvoiceNumber: data.vendorInvoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        description: data.description,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: 'DRAFT',
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// UPDATE INVOICE
// =============================================================================

export const updateInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(invoiceIdSchema.merge(updateInvoiceSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await verifyInvoiceAccess(id, context.auth.user.id)

    // Can only update DRAFT invoices
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only update draft invoices')
    }

    // Recalculate total if subtotal or tax changed
    const subtotal = updateData.subtotal ?? Number(existing.subtotal)
    const taxAmount = updateData.taxAmount ?? Number(existing.taxAmount)
    const totalAmount = subtotal + taxAmount

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id },
      data: {
        ...updateData,
        totalAmount,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// DELETE INVOICE
// =============================================================================

export const deleteInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(invoiceIdSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    // Can only delete DRAFT or CANCELLED invoices
    if (existing.status !== 'DRAFT' && existing.status !== 'CANCELLED') {
      throw new Error('Can only delete draft or cancelled invoices')
    }

    await prisma.maintenanceInvoice.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// =============================================================================
// WORKFLOW: SUBMIT INVOICE
// =============================================================================

export const submitInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(submitInvoiceSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    if (existing.status !== 'DRAFT') {
      throw new Error('Can only submit draft invoices')
    }

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: context.auth.user.id,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// WORKFLOW: START REVIEW
// =============================================================================

export const startReview = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(startReviewSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    if (existing.status !== 'SUBMITTED') {
      throw new Error('Can only start review on submitted invoices')
    }

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'UNDER_REVIEW',
        reviewStartedAt: new Date(),
        reviewedById: context.auth.user.id,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// WORKFLOW: APPROVE INVOICE
// =============================================================================

export const approveInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(approveInvoiceSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new Error('Can only approve submitted or under-review invoices')
    }

    // Update invoice status
    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        reviewedById: context.auth.user.id,
        reviewNotes: data.reviewNotes,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    })

    // Optionally create cost line item from invoice
    if (data.createCostLineItems && data.costLineItemType) {
      await prisma.maintenanceCostLineItem.create({
        data: {
          requestId: existing.requestId,
          invoiceId: data.id,
          type: data.costLineItemType,
          description: data.costLineItemDescription || `Invoice ${invoice.invoiceNumber}`,
          quantity: 1,
          unitCost: Number(existing.totalAmount),
          totalCost: Number(existing.totalAmount),
          createdById: context.auth.user.id,
        },
      })

      // Sync actual cost on parent request
      const result = await prisma.maintenanceCostLineItem.aggregate({
        where: { requestId: existing.requestId },
        _sum: { totalCost: true },
      })

      await prisma.maintenanceRequest.update({
        where: { id: existing.requestId },
        data: { actualCost: result._sum.totalCost || 0 },
      })
    }

    return serializeInvoice(invoice)
  })

// =============================================================================
// WORKFLOW: REJECT INVOICE
// =============================================================================

export const rejectInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(rejectInvoiceSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new Error('Can only reject submitted or under-review invoices')
    }

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        reviewedById: context.auth.user.id,
        rejectionReason: data.rejectionReason,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// WORKFLOW: MARK AS PAID
// =============================================================================

export const markInvoicePaid = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(markInvoicePaidSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    if (existing.status !== 'APPROVED') {
      throw new Error('Can only mark approved invoices as paid')
    }

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// WORKFLOW: CANCEL INVOICE
// =============================================================================

export const cancelInvoice = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(cancelInvoiceSchema))
  .handler(async ({ context, data }) => {
    const existing = await verifyInvoiceAccess(data.id, context.auth.user.id)

    // Can cancel any non-paid invoice
    if (existing.status === 'PAID') {
      throw new Error('Cannot cancel paid invoices')
    }

    const invoice = await prisma.maintenanceInvoice.update({
      where: { id: data.id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        vendor: {
          select: { id: true, companyName: true },
        },
      },
    })

    return serializeInvoice(invoice)
  })

// =============================================================================
// GET INVOICE SUMMARY
// =============================================================================

export const getInvoiceSummary = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(invoiceFiltersSchema.pick({ requestId: true })))
  .handler(async ({ context, data }): Promise<InvoiceSummary> => {
    await verifyRequestAccess(data.requestId, context.auth.user.id)

    const invoices = await prisma.maintenanceInvoice.findMany({
      where: { requestId: data.requestId },
      select: {
        status: true,
        totalAmount: true,
      },
    })

    // Aggregate by status
    const byStatusMap = new Map<InvoiceStatus, { count: number; amount: number }>()
    let totalAmount = 0

    for (const invoice of invoices) {
      const amount = Number(invoice.totalAmount)
      totalAmount += amount

      const existing = byStatusMap.get(invoice.status as InvoiceStatus) || { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += amount
      byStatusMap.set(invoice.status as InvoiceStatus, existing)
    }

    const byStatus = Array.from(byStatusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
    }))

    // Calculate pending counts
    const pendingApproval = invoices.filter(
      (i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW'
    ).length

    const pendingPayment = invoices.filter((i) => i.status === 'APPROVED').length

    return {
      totalInvoices: invoices.length,
      totalAmount,
      byStatus,
      pendingApproval,
      pendingPayment,
    }
  })
