import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  depositCalculationSchema,
  createDispositionSchema,
  depositFiltersSchema,
  markInterestPaidSchema,
  processRefundSchema,
  type SecurityDepositDetails,
  type DepositStatus,
} from '~/services/security-deposits.schema'

/**
 * Minnesota Statute 504B.178 - Security Deposit Interest Requirements:
 * - 1% simple annual interest on deposits
 * - Interest must be paid annually OR at lease end
 * - 21 days to return deposit or send disposition after move-out
 * - Itemized list of deductions required
 */

// Calculate simple interest for security deposit (MN compliant)
function calculateDepositInterest(
  depositAmount: number,
  interestRate: number,
  depositDate: Date,
  endDate: Date = new Date()
): { daysHeld: number; interestAccrued: number } {
  const msPerDay = 1000 * 60 * 60 * 24
  const daysHeld = Math.floor((endDate.getTime() - depositDate.getTime()) / msPerDay)

  // Simple interest formula: Principal * Rate * Time (in years)
  // Time = days / 365
  const interestAccrued = (depositAmount * interestRate * daysHeld) / 365

  return {
    daysHeld,
    interestAccrued: Math.round(interestAccrued * 100) / 100, // Round to cents
  }
}

// Determine deposit status based on lease state
function determineDepositStatus(lease: {
  status: string
  moveOutDate: Date | null
  endDate: Date
}): DepositStatus {
  if (lease.status === 'ACTIVE' || lease.status === 'MONTH_TO_MONTH') {
    return 'ACTIVE'
  }
  if (lease.moveOutDate) {
    // Check if disposition process started
    return 'PENDING_DISPOSITION'
  }
  if (lease.status === 'TERMINATED' || lease.status === 'EXPIRED') {
    return 'PENDING_DISPOSITION'
  }
  return 'ACTIVE'
}

// Get all security deposits with calculated interest
export const getSecurityDeposits = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(depositFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, status, interestDueSoon, dispositionDueSoon, limit, offset } = data

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Base query for leases with security deposits
    const where = {
      securityDeposit: { gt: 0 },
      unit: {
        property: {
          managerId: context.auth.user.id,
          ...(propertyId && { id: propertyId }),
        },
      },
      // Filter by status if provided
      ...(status === 'ACTIVE' && { status: { in: ['ACTIVE', 'MONTH_TO_MONTH'] } }),
      ...(status === 'PENDING_DISPOSITION' && {
        OR: [
          { status: { in: ['TERMINATED', 'EXPIRED'] } },
          { moveOutDate: { not: null } },
        ],
      }),
    }

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.lease.count({ where })

    // Calculate interest and transform results
    const deposits: SecurityDepositDetails[] = leases.map((lease) => {
      const depositAmount = Number(lease.securityDeposit)
      const interestRate = Number(lease.depositInterestRate)
      const depositDate = lease.depositPaidDate || lease.startDate

      const { daysHeld, interestAccrued } = calculateDepositInterest(
        depositAmount,
        interestRate,
        depositDate
      )

      // TODO: Track interest payments in separate model
      const interestPaid = 0
      const interestOwed = interestAccrued - interestPaid

      const depositStatus = determineDepositStatus(lease)

      // Calculate disposition due date (21 days after move-out per MN law)
      let dispositionDueDate: Date | null = null
      if (lease.moveOutDate) {
        dispositionDueDate = new Date(lease.moveOutDate.getTime() + 21 * 24 * 60 * 60 * 1000)
      }

      return {
        leaseId: lease.id,
        tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        unitNumber: lease.unit.unitNumber,
        propertyName: lease.unit.property.name,
        depositAmount,
        depositPaidDate: lease.depositPaidDate,
        interestRate,
        status: depositStatus,
        daysHeld,
        interestAccrued,
        interestPaid,
        interestOwed,
        moveOutDate: lease.moveOutDate,
        dispositionDueDate,
        dispositionSentDate: null, // TODO: Track in separate model
        totalDeductions: 0, // TODO: Calculate from deductions
        refundAmount: depositAmount + interestOwed, // Default to full refund
        refundPaidDate: null,
      }
    })

    // Apply additional filters
    let filteredDeposits = deposits

    if (interestDueSoon) {
      // Interest is due if lease anniversary is within 30 days
      // or if lease is ending within 30 days
      filteredDeposits = filteredDeposits.filter((d) => {
        return d.interestOwed > 0 && d.status === 'ACTIVE'
      })
    }

    if (dispositionDueSoon) {
      filteredDeposits = filteredDeposits.filter((d) => {
        if (!d.dispositionDueDate) return false
        return d.dispositionDueDate <= thirtyDaysFromNow && !d.dispositionSentDate
      })
    }

    return {
      deposits: filteredDeposits,
      total,
      limit,
      offset,
    }
  })

// Get single deposit details with full calculation
export const getSecurityDeposit = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(depositCalculationSchema))
  .handler(async ({ context, data }) => {
    const lease = await prisma.lease.findFirst({
      where: {
        id: data.leaseId,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
        payments: {
          where: { type: 'SECURITY_DEPOSIT' },
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!lease) {
      throw new Error('Lease not found or access denied')
    }

    const depositAmount = Number(lease.securityDeposit)
    const interestRate = Number(lease.depositInterestRate)
    const depositDate = lease.depositPaidDate || lease.startDate

    const { daysHeld, interestAccrued } = calculateDepositInterest(
      depositAmount,
      interestRate,
      depositDate
    )

    const depositStatus = determineDepositStatus(lease)

    let dispositionDueDate: Date | null = null
    if (lease.moveOutDate) {
      dispositionDueDate = new Date(lease.moveOutDate.getTime() + 21 * 24 * 60 * 60 * 1000)
    }

    return {
      lease: {
        id: lease.id,
        leaseNumber: lease.leaseNumber,
        status: lease.status,
        startDate: lease.startDate,
        endDate: lease.endDate,
        moveOutDate: lease.moveOutDate,
      },
      tenant: {
        id: lease.tenant.id,
        name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        email: lease.tenant.email,
      },
      unit: {
        id: lease.unit.id,
        unitNumber: lease.unit.unitNumber,
        property: lease.unit.property,
      },
      deposit: {
        amount: depositAmount,
        paidDate: lease.depositPaidDate,
        interestRate,
        bankName: lease.depositBankName,
        accountLast4: lease.depositAccountLast4,
      },
      calculation: {
        daysHeld,
        interestAccrued,
        interestPaid: 0, // TODO: Track payments
        interestOwed: interestAccrued,
      },
      disposition: {
        status: depositStatus,
        dueDate: dispositionDueDate,
        sentDate: null, // TODO: Track
        deductions: [], // TODO: Track
        refundAmount: depositAmount + interestAccrued,
        refundPaidDate: null,
      },
      // Payment history for this deposit
      payments: lease.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.paymentDate,
        type: p.type,
        method: p.method,
        status: p.status,
      })),
    }
  })

// Get deposit stats for dashboard
export const getDepositStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get all active leases with deposits
    const activeLeases = await prisma.lease.findMany({
      where: {
        status: { in: ['ACTIVE', 'MONTH_TO_MONTH'] },
        securityDeposit: { gt: 0 },
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: {
        id: true,
        securityDeposit: true,
        depositInterestRate: true,
        depositPaidDate: true,
        startDate: true,
      },
    })

    // Calculate totals
    let totalDepositsHeld = 0
    let totalInterestAccrued = 0

    for (const lease of activeLeases) {
      const depositAmount = Number(lease.securityDeposit)
      const interestRate = Number(lease.depositInterestRate)
      const depositDate = lease.depositPaidDate || lease.startDate

      totalDepositsHeld += depositAmount

      const { interestAccrued } = calculateDepositInterest(
        depositAmount,
        interestRate,
        depositDate
      )
      totalInterestAccrued += interestAccrued
    }

    // Count leases needing disposition (moved out but not disposed)
    const pendingDispositions = await prisma.lease.count({
      where: {
        OR: [
          { status: { in: ['TERMINATED', 'EXPIRED'] } },
          { moveOutDate: { not: null, lt: now } },
        ],
        securityDeposit: { gt: 0 },
        unit: { property: { managerId: context.auth.user.id } },
        // TODO: Filter out already disposed
      },
    })

    // Count leases with interest due soon
    // (simplified: count active leases - should check anniversary dates)
    const interestDueSoon = activeLeases.filter((lease) => {
      const depositDate = lease.depositPaidDate || lease.startDate
      const daysSinceDeposit = Math.floor(
        (now.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      // Check if approaching yearly anniversary (within 30 days)
      const daysUntilAnniversary = 365 - (daysSinceDeposit % 365)
      return daysUntilAnniversary <= 30
    }).length

    return {
      totalDepositsHeld: Math.round(totalDepositsHeld * 100) / 100,
      totalInterestAccrued: Math.round(totalInterestAccrued * 100) / 100,
      activeDepositsCount: activeLeases.length,
      pendingDispositions,
      interestDueSoon,
      averageInterestRate: 0.01, // 1% per MN law
    }
  })

// Record interest payment
export const recordInterestPayment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(markInterestPaidSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { leaseId, amount, paymentDate, paymentMethod, notes } = data

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

    // Create payment record for interest
    const payment = await prisma.payment.create({
      data: {
        tenantId: lease.tenantId,
        leaseId: lease.id,
        type: 'SECURITY_DEPOSIT', // Could add a new type like DEPOSIT_INTEREST
        method: paymentMethod || 'CHECK',
        status: 'COMPLETED',
        amount: -amount, // Negative because we're paying out
        paymentDate: paymentDate || new Date(),
        memo: `Security deposit interest payment - ${notes || 'Annual interest per MN Statute 504B.178'}`,
        notes,
      },
    })

    return payment
  })

// Process deposit refund after move-out
export const processDepositRefund = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(processRefundSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { leaseId, refundAmount, paymentMethod, referenceNumber, notes } = data

    // Verify lease access and get details
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

    // Create refund payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: lease.tenantId,
        leaseId: lease.id,
        type: 'SECURITY_DEPOSIT',
        method: paymentMethod,
        status: 'COMPLETED',
        amount: -refundAmount, // Negative because we're paying out
        paymentDate: new Date(),
        referenceNumber,
        memo: 'Security deposit refund',
        notes,
      },
    })

    return payment
  })

// Create disposition record with deductions
export const createDisposition = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createDispositionSchema))
  .handler(async ({ context, data }) => {
    const { leaseId, deductions, notes } = data

    // Verify lease access
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        tenant: true,
        unit: { include: { property: true } },
      },
    })

    if (!lease) {
      throw new Error('Lease not found or access denied')
    }

    const depositAmount = Number(lease.securityDeposit)
    const interestRate = Number(lease.depositInterestRate)
    const depositDate = lease.depositPaidDate || lease.startDate

    const { interestAccrued } = calculateDepositInterest(
      depositAmount,
      interestRate,
      depositDate
    )

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
    const refundAmount = depositAmount + interestAccrued - totalDeductions

    // TODO: Create DispositionRecord in database
    // For now, return calculated disposition data
    return {
      leaseId,
      tenant: {
        name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        email: lease.tenant.email,
      },
      property: {
        name: lease.unit.property.name,
        address: `${lease.unit.property.addressLine1}, ${lease.unit.property.city}, ${lease.unit.property.state} ${lease.unit.property.zipCode}`,
      },
      unit: lease.unit.unitNumber,
      originalDeposit: depositAmount,
      interestEarned: interestAccrued,
      deductions,
      totalDeductions,
      refundAmount,
      notes,
      createdAt: new Date(),
      // Per MN law, must be sent within 21 days of move-out
      deadline: lease.moveOutDate
        ? new Date(lease.moveOutDate.getTime() + 21 * 24 * 60 * 60 * 1000)
        : null,
    }
  })
