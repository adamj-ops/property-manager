/**
 * Tenant Portal API Service
 *
 * Server functions for tenant portal operations.
 * Provides dashboard data, payment history, lease info, etc.
 */

import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import { ApiError } from '~/server/errors'

// ============================================================================
// SCHEMAS
// ============================================================================

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

// ============================================================================
// TENANT LOOKUP
// ============================================================================

/**
 * Get tenant record for the logged-in user
 */
export const getTenantByUserId = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.auth.user.id

    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: {
            status: { in: ['ACTIVE', 'MONTH_TO_MONTH', 'PENDING_SIGNATURE'] },
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    zipCode: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!tenant) {
      throw ApiError.notFound('No tenant profile found for this user')
    }

    return { tenant }
  })

/**
 * Check if current user has a tenant profile
 */
export const hasTenantProfile = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.auth.user.id

    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      select: { id: true },
    })

    return { hasTenantProfile: !!tenant }
  })

// ============================================================================
// DASHBOARD DATA
// ============================================================================

/**
 * Get aggregated dashboard data for tenant
 */
export const getTenantDashboardData = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.auth.user.id

    // Get tenant with active lease
    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: {
            status: { in: ['ACTIVE', 'MONTH_TO_MONTH'] },
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    zipCode: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 6,
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
            referenceNumber: true,
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    })

    if (!tenant) {
      throw ApiError.notFound('No tenant profile found for this user')
    }

    const activeLease = tenant.leases[0]

    // Calculate current balance
    // This is simplified - in production, would aggregate from payments/charges
    let currentBalance = 0
    let nextPaymentDueDate: Date | null = null
    let monthlyRent = 0

    if (activeLease) {
      monthlyRent = Number(activeLease.monthlyRent)

      // Calculate next payment due date (1st of next month)
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      nextPaymentDueDate = nextMonth

      // Calculate balance: rent due minus payments received this month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const paymentsThisMonth = tenant.payments
        .filter((p) => p.paymentDate >= currentMonthStart && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      currentBalance = monthlyRent - paymentsThisMonth
      if (currentBalance < 0) currentBalance = 0
    }

    // Check for lease expiration alerts (within 60 days)
    const leaseExpirationAlert =
      activeLease && activeLease.endDate
        ? new Date(activeLease.endDate).getTime() - Date.now() < 60 * 24 * 60 * 60 * 1000
        : false

    return {
      tenant: {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone,
      },
      lease: activeLease
        ? {
            id: activeLease.id,
            status: activeLease.status,
            startDate: activeLease.startDate,
            endDate: activeLease.endDate,
            monthlyRent: Number(activeLease.monthlyRent),
            securityDeposit: Number(activeLease.securityDeposit),
            leaseDocumentUrl: activeLease.leaseDocumentUrl,
            unit: {
              id: activeLease.unit.id,
              unitNumber: activeLease.unit.unitNumber,
              property: activeLease.unit.property,
            },
          }
        : null,
      balance: {
        current: currentBalance,
        monthlyRent,
        nextPaymentDueDate,
      },
      recentPayments: tenant.payments,
      recentMaintenanceRequests: tenant.maintenanceRequests,
      alerts: {
        leaseExpiringSoon: leaseExpirationAlert,
        hasOutstandingBalance: currentBalance > 0,
      },
    }
  })

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

/**
 * Get paginated payment history for tenant
 */
export const getTenantPaymentHistory = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(paginationSchema))
  .handler(async ({ context, data }) => {
    const userId = context.auth.user.id
    const { page, limit } = data

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!tenant) {
      throw ApiError.notFound('No tenant profile found for this user')
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { tenantId: tenant.id },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lease: {
            select: {
              id: true,
              leaseNumber: true,
              unit: {
                select: {
                  unitNumber: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({
        where: { tenantId: tenant.id },
      }),
    ])

    return {
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        status: p.status,
        referenceNumber: p.referenceNumber,
        memo: p.memo,
        lease: p.lease
          ? {
              id: p.lease.id,
              leaseNumber: p.lease.leaseNumber,
              unitNumber: p.lease.unit?.unitNumber,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  })

// ============================================================================
// LEASE INFORMATION
// ============================================================================

/**
 * Get current lease details for tenant
 */
export const getTenantLeaseInfo = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.auth.user.id

    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: {
            status: { in: ['ACTIVE', 'MONTH_TO_MONTH', 'PENDING_SIGNATURE'] },
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })

    if (!tenant) {
      throw ApiError.notFound('No tenant profile found for this user')
    }

    const activeLease = tenant.leases[0]

    if (!activeLease) {
      return { lease: null }
    }

    return {
      lease: {
        id: activeLease.id,
        leaseNumber: activeLease.leaseNumber,
        status: activeLease.status,
        leaseType: activeLease.leaseType,
        startDate: activeLease.startDate,
        endDate: activeLease.endDate,
        monthlyRent: Number(activeLease.monthlyRent),
        securityDeposit: Number(activeLease.securityDeposit),
        leaseDocumentUrl: activeLease.leaseDocumentUrl,
        signedDocumentUrl: activeLease.signedDocumentUrl,
        unit: {
          id: activeLease.unit.id,
          unitNumber: activeLease.unit.unitNumber,
          bedrooms: activeLease.unit.bedrooms,
          bathrooms: activeLease.unit.bathrooms,
          squareFeet: activeLease.unit.squareFeet,
          property: activeLease.unit.property,
        },
      },
    }
  })

// ============================================================================
// BALANCE CALCULATION
// ============================================================================

/**
 * Get current balance for payment form
 */
export const getTenantBalance = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.auth.user.id

    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: { status: { in: ['ACTIVE', 'MONTH_TO_MONTH'] } },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!tenant) {
      throw ApiError.notFound('No tenant profile found for this user')
    }

    const activeLease = tenant.leases[0]
    if (!activeLease) {
      return {
        tenantId: tenant.id,
        currentBalance: 0,
        monthlyRent: 0,
        lastPaymentDate: null,
        lastPaymentAmount: null,
      }
    }

    const monthlyRent = Number(activeLease.monthlyRent)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Sum payments for current month
    const paymentsThisMonth = tenant.payments
      .filter((p) => p.paymentDate >= currentMonthStart)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const currentBalance = Math.max(0, monthlyRent - paymentsThisMonth)
    const lastPayment = tenant.payments[0]

    return {
      tenantId: tenant.id,
      leaseId: activeLease.id,
      currentBalance,
      monthlyRent,
      lastPaymentDate: lastPayment?.paymentDate || null,
      lastPaymentAmount: lastPayment ? Number(lastPayment.amount) : null,
    }
  })

