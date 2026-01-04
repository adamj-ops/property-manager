import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentFiltersSchema,
  paymentIdSchema,
} from '~/services/payments.schema'

// Get all payments
export const getPayments = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(paymentFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { tenantId, leaseId, propertyId, type, status, method, startDate, endDate, search, limit, offset } = data

    const where = {
      tenant: {
        leases: {
          some: {
            unit: {
              property: { managerId: context.auth.user.id },
              ...(propertyId && { propertyId }),
            },
          },
        },
      },
      ...(tenantId && { tenantId }),
      ...(leaseId && { leaseId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(method && { method }),
      ...(startDate && { paymentDate: { gte: startDate } }),
      ...(endDate && { paymentDate: { lte: endDate } }),
      ...(search && {
        OR: [
          { paymentNumber: { contains: search, mode: 'insensitive' as const } },
          { referenceNumber: { contains: search, mode: 'insensitive' as const } },
          { memo: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          lease: {
            select: {
              id: true,
              leaseNumber: true,
              monthlyRent: true,
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                  property: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ])

    return { payments, total, limit, offset }
  })

// Get single payment
export const getPayment = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(paymentIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ data }) => {
    const payment = await prisma.payment.findUnique({
      where: { id: data.id },
      include: {
        tenant: true,
        lease: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    return payment
  })

// Create payment
export const createPayment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createPaymentSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ data }) => {
    const payment = await prisma.payment.create({
      data: {
        ...data,
        appliedAmount: data.appliedAmount ?? data.amount,
      },
      include: {
        tenant: true,
        lease: true,
      },
    })

    return payment
  })

// Update payment
export const updatePayment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(paymentIdSchema.merge(updatePaymentSchema)))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ data }) => {
    const { id, ...updateData } = data

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
        lease: true,
      },
    })

    return payment
  })

// Delete payment
export const deletePayment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(paymentIdSchema))
  .handler(async ({ data }) => {
    await prisma.payment.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// Get payment stats / collection summary
export const getPaymentStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const baseWhere = {
      tenant: {
        leases: {
          some: {
            unit: { property: { managerId: context.auth.user.id } },
          },
        },
      },
    }

    // Get active leases for expected rent calculation
    const activeLeases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: { monthlyRent: true },
    })

    const expectedRent = activeLeases.reduce((sum, l) => sum + Number(l.monthlyRent), 0)

    // Get collected rent this month
    const collectedThisMonth = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        type: 'RENT',
        status: 'COMPLETED',
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })

    // Get pending payments
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Get late payments (due date passed, not completed)
    const latePayments = await prisma.payment.count({
      where: {
        ...baseWhere,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: now },
      },
    })

    const collected = Number(collectedThisMonth._sum.amount || 0)
    const collectionRate = expectedRent > 0 ? (collected / expectedRent) * 100 : 0

    return {
      expectedRent,
      collectedThisMonth: collected,
      collectionRate: Math.round(collectionRate * 10) / 10,
      pendingAmount: Number(pendingPayments._sum.amount || 0),
      pendingCount: pendingPayments._count,
      latePayments,
    }
  })

// Get rent roll (all active leases with payment status)
export const getRentRoll = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context }) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true },
        },
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
        payments: {
          where: {
            type: 'RENT',
            paymentDate: { gte: startOfMonth, lte: endOfMonth },
          },
          select: { amount: true, status: true },
        },
      },
      orderBy: [{ unit: { property: { name: 'asc' } } }, { unit: { unitNumber: 'asc' } }],
    })

    return leases.map((lease) => {
      const paidAmount = lease.payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      return {
        lease,
        monthlyRent: Number(lease.monthlyRent),
        paidAmount,
        balance: Number(lease.monthlyRent) - paidAmount,
        status: paidAmount >= Number(lease.monthlyRent) ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
      }
    })
  })
