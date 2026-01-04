import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  calculateLateFeeSchema,
  applyLateFeeSchema,
  waiveLateFeeSchema,
  lateFeeFiltersSchema,
  bulkLateFeeCheckSchema,
  type LateFeeCalculation,
} from '~/services/late-fees.schema'

/**
 * Minnesota Statute 504B.177 - Late Fee Requirements:
 * - Late fee cannot exceed $50 OR 8% of monthly rent, whichever is GREATER
 * - Late fee can only be charged after rent is late (past grace period)
 * - Written notice required before first late fee
 */

// Calculate MN-compliant maximum late fee
function calculateMNMaxLateFee(monthlyRent: number): number {
  const percentOfRent = monthlyRent * 0.08
  const flatAmount = 50

  // MN law allows the GREATER of $50 or 8% of rent
  return Math.max(flatAmount, percentOfRent)
}

// Get the due date for a given month
function getRentDueDate(year: number, month: number, dueDay: number): Date {
  // Handle months with fewer days
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const effectiveDueDay = Math.min(dueDay, lastDayOfMonth)
  return new Date(year, month, effectiveDueDay)
}

// Calculate late fee for a specific lease and month
export const calculateLateFee = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(calculateLateFeeSchema))
  .handler(async ({ context, data }) => {
    const { leaseId, forMonth } = data

    const now = new Date()
    const targetMonth = forMonth || now

    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
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
            forPeriodStart: {
              gte: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1),
            },
            forPeriodEnd: {
              lte: new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0),
            },
          },
        },
      },
    })

    if (!lease) {
      throw new Error('Lease not found or access denied')
    }

    const monthlyRent = Number(lease.monthlyRent)
    const lateFeeAmount = Number(lease.lateFeeAmount)
    const gracePeriodDays = lease.lateFeeGraceDays

    // Calculate due date and grace period end
    const dueDate = getRentDueDate(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      lease.rentDueDay
    )
    const gracePeriodEndDate = new Date(dueDate)
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + gracePeriodDays)

    // Calculate days past due
    const daysPastDue = Math.max(
      0,
      Math.floor((now.getTime() - gracePeriodEndDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    const isLate = now > gracePeriodEndDate

    // Calculate rent paid for this period
    const rentPaid = lease.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const rentBalance = monthlyRent - rentPaid

    // Check if late fee already applied for this month
    const existingLateFee = await prisma.payment.findFirst({
      where: {
        leaseId: lease.id,
        type: 'LATE_FEE',
        forPeriodStart: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1),
      },
    })
    const hasExistingLateFee = !!existingLateFee

    // Calculate MN-compliant max fee
    const mnMaxFee = calculateMNMaxLateFee(monthlyRent)

    // Fee is applicable if: late, has balance, no existing late fee
    const feeApplicable = isLate && rentBalance > 0 && !hasExistingLateFee

    // Applied fee is the lesser of configured fee and MN max
    const appliedFee = feeApplicable ? Math.min(lateFeeAmount, mnMaxFee) : 0

    const result: LateFeeCalculation = {
      leaseId: lease.id,
      tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
      unitNumber: lease.unit.unitNumber,
      propertyName: lease.unit.property.name,
      monthlyRent,
      rentDueDay: lease.rentDueDay,
      gracePeriodDays,
      lateFeeAmount,
      forMonth: targetMonth,
      dueDate,
      gracePeriodEndDate,
      daysPastDue,
      isLate,
      feeApplicable,
      calculatedFee: lateFeeAmount,
      mnMaxFee,
      appliedFee,
      rentPaidAmount: rentPaid,
      rentBalance,
      hasExistingLateFee,
    }

    return result
  })

// Apply late fee to a lease
export const applyLateFee = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(applyLateFeeSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { leaseId, amount, forMonth, reason } = data

    // Verify lease access
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        tenant: true,
      },
    })

    if (!lease) {
      throw new Error('Lease not found or access denied')
    }

    // Check MN compliance
    const mnMaxFee = calculateMNMaxLateFee(Number(lease.monthlyRent))
    if (amount > mnMaxFee) {
      throw new Error(
        `Late fee amount ($${amount}) exceeds Minnesota maximum ($${mnMaxFee.toFixed(2)}). ` +
        `Per MN Statute 504B.177, late fees cannot exceed the greater of $50 or 8% of monthly rent.`
      )
    }

    // Check for existing late fee for this period
    const existingLateFee = await prisma.payment.findFirst({
      where: {
        leaseId: lease.id,
        type: 'LATE_FEE',
        forPeriodStart: new Date(forMonth.getFullYear(), forMonth.getMonth(), 1),
      },
    })

    if (existingLateFee) {
      throw new Error('A late fee has already been applied for this period')
    }

    // Create late fee payment record
    const periodStart = new Date(forMonth.getFullYear(), forMonth.getMonth(), 1)
    const periodEnd = new Date(forMonth.getFullYear(), forMonth.getMonth() + 1, 0)

    const lateFeePayment = await prisma.payment.create({
      data: {
        tenantId: lease.tenantId,
        leaseId: lease.id,
        type: 'LATE_FEE',
        method: 'OTHER', // Will be updated when tenant pays
        status: 'PENDING',
        amount,
        paymentDate: new Date(),
        dueDate: new Date(), // Due immediately
        forPeriodStart: periodStart,
        forPeriodEnd: periodEnd,
        memo: reason || `Late fee for ${forMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        lease: { select: { id: true, leaseNumber: true } },
      },
    })

    // TODO: Send late fee notification email

    return lateFeePayment
  })

// Waive a late fee
export const waiveLateFee = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(waiveLateFeeSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { paymentId, reason, notes } = data

    // Find the late fee payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        type: 'LATE_FEE',
        lease: {
          unit: { property: { managerId: context.auth.user.id } },
        },
      },
      include: {
        lease: true,
      },
    })

    if (!payment) {
      throw new Error('Late fee payment not found or access denied')
    }

    if (payment.status === 'COMPLETED') {
      throw new Error('Cannot waive a late fee that has already been paid')
    }

    // Update payment to cancelled status with waiver info
    const waivedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELLED',
        memo: `WAIVED: ${reason}${notes ? ` - ${notes}` : ''}`,
        notes: `Waiver reason: ${reason}\nOriginal amount: $${payment.amount}\n${notes || ''}`,
      },
    })

    // TODO: Create audit log entry for waiver

    return waivedPayment
  })

// Get late fee history
export const getLateFees = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(lateFeeFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { propertyId, tenantId, leaseId, status, startDate, endDate, limit, offset } = data

    const where = {
      type: 'LATE_FEE' as const,
      lease: {
        unit: {
          property: {
            managerId: context.auth.user.id,
            ...(propertyId && { id: propertyId }),
          },
        },
      },
      ...(tenantId && { tenantId }),
      ...(leaseId && { leaseId }),
      ...(status === 'PENDING' && { status: 'PENDING' }),
      ...(status === 'PAID' && { status: 'COMPLETED' }),
      ...(status === 'WAIVED' && { status: 'CANCELLED' }),
      ...(startDate && { paymentDate: { gte: startDate } }),
      ...(endDate && { paymentDate: { lte: endDate } }),
    }

    const [lateFees, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true },
          },
          lease: {
            select: {
              id: true,
              leaseNumber: true,
              unit: {
                select: {
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

    return { lateFees, total, limit, offset }
  })

// Get late fee stats for dashboard
export const getLateFeeStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const baseWhere = {
      type: 'LATE_FEE' as const,
      lease: {
        unit: { property: { managerId: context.auth.user.id } },
      },
    }

    // Late fees applied this month
    const monthlyApplied = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Late fees collected this month
    const monthlyCollected = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Late fees waived this month
    const monthlyWaived = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'CANCELLED',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Outstanding late fees
    const outstanding = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Year to date collected
    const ytdCollected = await prisma.payment.aggregate({
      where: {
        ...baseWhere,
        paymentDate: { gte: startOfYear, lte: now },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    })

    return {
      monthlyApplied: Number(monthlyApplied._sum.amount || 0),
      monthlyAppliedCount: monthlyApplied._count,
      monthlyCollected: Number(monthlyCollected._sum.amount || 0),
      monthlyCollectedCount: monthlyCollected._count,
      monthlyWaived: Number(monthlyWaived._sum.amount || 0),
      monthlyWaivedCount: monthlyWaived._count,
      outstanding: Number(outstanding._sum.amount || 0),
      outstandingCount: outstanding._count,
      yearToDateCollected: Number(ytdCollected._sum.amount || 0),
    }
  })

// Check all leases for late payments and optionally apply fees (for background job)
export const checkAndApplyLateFees = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(bulkLateFeeCheckSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, dryRun } = data
    const now = new Date()

    // Get all active leases
    const leases = await prisma.lease.findMany({
      where: {
        status: { in: ['ACTIVE', 'MONTH_TO_MONTH'] },
        unit: {
          property: {
            managerId: context.auth.user.id,
            ...(propertyId && { id: propertyId }),
          },
        },
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        unit: {
          include: { property: { select: { id: true, name: true } } },
        },
      },
    })

    const results: Array<{
      leaseId: string
      tenantName: string
      unit: string
      feeApplicable: boolean
      feeAmount: number
      applied: boolean
      reason: string
    }> = []

    for (const lease of leases) {
      const monthlyRent = Number(lease.monthlyRent)
      const lateFeeAmount = Number(lease.lateFeeAmount)
      const gracePeriodDays = lease.lateFeeGraceDays

      // Get due date for current month
      const dueDate = getRentDueDate(now.getFullYear(), now.getMonth(), lease.rentDueDay)
      const gracePeriodEndDate = new Date(dueDate)
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + gracePeriodDays)

      const isLate = now > gracePeriodEndDate

      if (!isLate) {
        results.push({
          leaseId: lease.id,
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          unit: lease.unit.unitNumber,
          feeApplicable: false,
          feeAmount: 0,
          applied: false,
          reason: 'Not past grace period',
        })
        continue
      }

      // Check for rent payment this month
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const rentPayment = await prisma.payment.aggregate({
        where: {
          leaseId: lease.id,
          type: 'RENT',
          status: 'COMPLETED',
          paymentDate: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      })

      const rentPaid = Number(rentPayment._sum.amount || 0)
      const rentBalance = monthlyRent - rentPaid

      if (rentBalance <= 0) {
        results.push({
          leaseId: lease.id,
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          unit: lease.unit.unitNumber,
          feeApplicable: false,
          feeAmount: 0,
          applied: false,
          reason: 'Rent fully paid',
        })
        continue
      }

      // Check for existing late fee
      const existingLateFee = await prisma.payment.findFirst({
        where: {
          leaseId: lease.id,
          type: 'LATE_FEE',
          forPeriodStart: periodStart,
        },
      })

      if (existingLateFee) {
        results.push({
          leaseId: lease.id,
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          unit: lease.unit.unitNumber,
          feeApplicable: false,
          feeAmount: 0,
          applied: false,
          reason: 'Late fee already applied',
        })
        continue
      }

      // Calculate MN-compliant fee
      const mnMaxFee = calculateMNMaxLateFee(monthlyRent)
      const appliedFee = Math.min(lateFeeAmount, mnMaxFee)

      if (dryRun) {
        results.push({
          leaseId: lease.id,
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          unit: lease.unit.unitNumber,
          feeApplicable: true,
          feeAmount: appliedFee,
          applied: false,
          reason: 'Dry run - fee not applied',
        })
      } else {
        // Apply the late fee
        await prisma.payment.create({
          data: {
            tenantId: lease.tenantId,
            leaseId: lease.id,
            type: 'LATE_FEE',
            method: 'OTHER',
            status: 'PENDING',
            amount: appliedFee,
            paymentDate: new Date(),
            dueDate: new Date(),
            forPeriodStart: periodStart,
            forPeriodEnd: periodEnd,
            memo: `Auto-applied late fee for ${periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        })

        results.push({
          leaseId: lease.id,
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          unit: lease.unit.unitNumber,
          feeApplicable: true,
          feeAmount: appliedFee,
          applied: true,
          reason: 'Late fee applied',
        })

        // TODO: Send email notification
      }
    }

    return {
      checkedCount: leases.length,
      appliedCount: results.filter((r) => r.applied).length,
      results,
    }
  })
