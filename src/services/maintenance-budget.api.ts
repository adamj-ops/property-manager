import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from 'date-fns'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdSchema,
  budgetFiltersSchema,
  acknowledgeBudgetAlertSchema,
  budgetHealthFiltersSchema,
  budgetVsActualFiltersSchema,
} from '~/services/maintenance-budget.schema'

// Category labels for display
const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

// =============================================================================
// BUDGET CRUD OPERATIONS
// =============================================================================

// Get all budgets with filters
export const getBudgets = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { propertyId, category, period, fiscalYear, isActive, limit, offset } = data

    const where = {
      property: { managerId: context.auth.user.id },
      ...(propertyId && { propertyId }),
      ...(category && { category }),
      ...(period && { period }),
      ...(fiscalYear && { fiscalYear }),
      ...(isActive !== undefined && { isActive }),
    }

    const [budgets, total] = await Promise.all([
      prisma.maintenanceBudget.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true },
          },
          _count: {
            select: { alerts: true },
          },
        },
        orderBy: [{ fiscalYear: 'desc' }, { property: { name: 'asc' } }, { category: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.maintenanceBudget.count({ where }),
    ])

    // Calculate spending percentage and status for each budget
    const budgetsWithStatus = budgets.map((budget) => {
      const budgetAmount = Number(budget.budgetAmount)
      const spentAmount = Number(budget.spentAmount)
      const committedAmount = Number(budget.committedAmount)
      const totalCommitted = spentAmount + committedAmount
      const spentPercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
      const committedPercent = budgetAmount > 0 ? (totalCommitted / budgetAmount) * 100 : 0
      const remainingAmount = budgetAmount - spentAmount

      let status: 'healthy' | 'warning' | 'critical' | 'exceeded' = 'healthy'
      if (spentPercent >= 100) {
        status = 'exceeded'
      } else if (spentPercent >= budget.criticalThreshold) {
        status = 'critical'
      } else if (spentPercent >= budget.warningThreshold) {
        status = 'warning'
      }

      return {
        ...budget,
        budgetAmount,
        spentAmount,
        committedAmount,
        totalCommitted,
        spentPercent: Math.round(spentPercent * 100) / 100,
        committedPercent: Math.round(committedPercent * 100) / 100,
        remainingAmount,
        status,
        categoryLabel: categoryLabels[budget.category] || budget.category,
      }
    })

    return { budgets: budgetsWithStatus, total, limit, offset }
  })

// Get single budget with details
export const getBudget = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const budget = await prisma.maintenanceBudget.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
      include: {
        property: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!budget) {
      throw new Error('Budget not found')
    }

    // Get related work orders for this budget period and category
    const workOrders = await prisma.maintenanceRequest.findMany({
      where: {
        unit: { propertyId: budget.propertyId },
        category: budget.category,
        status: { in: ['COMPLETED', 'IN_PROGRESS', 'SCHEDULED', 'PENDING_PARTS'] },
        createdAt: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: {
        id: true,
        requestNumber: true,
        title: true,
        status: true,
        actualCost: true,
        estimatedCost: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const budgetAmount = Number(budget.budgetAmount)
    const spentAmount = Number(budget.spentAmount)
    const committedAmount = Number(budget.committedAmount)
    const spentPercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0

    let status: 'healthy' | 'warning' | 'critical' | 'exceeded' = 'healthy'
    if (spentPercent >= 100) {
      status = 'exceeded'
    } else if (spentPercent >= budget.criticalThreshold) {
      status = 'critical'
    } else if (spentPercent >= budget.warningThreshold) {
      status = 'warning'
    }

    return {
      ...budget,
      budgetAmount,
      spentAmount,
      committedAmount,
      spentPercent: Math.round(spentPercent * 100) / 100,
      remainingAmount: budgetAmount - spentAmount,
      status,
      categoryLabel: categoryLabels[budget.category] || budget.category,
      workOrders: workOrders.map((wo) => ({
        ...wo,
        actualCost: Number(wo.actualCost || 0),
        estimatedCost: Number(wo.estimatedCost || 0),
      })),
    }
  })

// Create budget
export const createBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createBudgetSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        managerId: context.auth.user.id,
      },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Check for duplicate budget
    const existing = await prisma.maintenanceBudget.findFirst({
      where: {
        propertyId: data.propertyId,
        category: data.category,
        period: data.period,
        fiscalYear: data.fiscalYear,
      },
    })

    if (existing) {
      throw new Error(
        `A budget already exists for ${categoryLabels[data.category]} in ${data.period.toLowerCase()} ${data.fiscalYear}`
      )
    }

    // Calculate initial spending from existing completed work orders in the period
    const existingSpending = await prisma.maintenanceRequest.aggregate({
      where: {
        unit: { propertyId: data.propertyId },
        category: data.category,
        status: 'COMPLETED',
        completedAt: {
          gte: data.startDate,
          lte: data.endDate,
        },
      },
      _sum: {
        actualCost: true,
      },
    })

    // Calculate committed from in-progress work orders
    const committedAmount = await prisma.maintenanceRequest.aggregate({
      where: {
        unit: { propertyId: data.propertyId },
        category: data.category,
        status: { in: ['IN_PROGRESS', 'SCHEDULED', 'PENDING_PARTS'] },
        createdAt: {
          gte: data.startDate,
          lte: data.endDate,
        },
      },
      _sum: {
        estimatedCost: true,
      },
    })

    const budget = await prisma.maintenanceBudget.create({
      data: {
        ...data,
        createdById: context.auth.user.id,
        spentAmount: existingSpending._sum.actualCost || 0,
        committedAmount: committedAmount._sum.estimatedCost || 0,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    })

    return budget
  })

// Update budget
export const updateBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({ id: z.string().uuid(), data: updateBudgetSchema })))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    // Verify ownership
    const existing = await prisma.maintenanceBudget.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
    })

    if (!existing) {
      throw new Error('Budget not found')
    }

    const budget = await prisma.maintenanceBudget.update({
      where: { id: data.id },
      data: data.data,
      include: {
        property: { select: { id: true, name: true } },
      },
    })

    return budget
  })

// Delete/deactivate budget
export const deleteBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetIdSchema))
  .handler(async ({ context, data }) => {
    // Verify ownership
    const existing = await prisma.maintenanceBudget.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
    })

    if (!existing) {
      throw new Error('Budget not found')
    }

    // Soft delete - set isActive to false
    await prisma.maintenanceBudget.update({
      where: { id: data.id },
      data: { isActive: false },
    })

    return { success: true }
  })

// =============================================================================
// BUDGET HEALTH & ANALYTICS
// =============================================================================

// Get budget health summary
export const getBudgetHealth = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetHealthFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, fiscalYear } = data
    const currentYear = fiscalYear || new Date().getFullYear()

    const where = {
      property: { managerId: context.auth.user.id },
      fiscalYear: currentYear,
      isActive: true,
      ...(propertyId && { propertyId }),
    }

    const budgets = await prisma.maintenanceBudget.findMany({
      where,
      include: {
        property: { select: { name: true } },
      },
    })

    // Aggregate health statistics
    let totalBudgeted = 0
    let totalSpent = 0
    let totalCommitted = 0
    let healthyCount = 0
    let warningCount = 0
    let criticalCount = 0
    let exceededCount = 0

    const categoriesAtRisk: Array<{
      category: string
      propertyName: string
      spentPercent: number
      status: string
    }> = []

    for (const budget of budgets) {
      const budgetAmount = Number(budget.budgetAmount)
      const spentAmount = Number(budget.spentAmount)
      const committedAmount = Number(budget.committedAmount)
      const spentPercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0

      totalBudgeted += budgetAmount
      totalSpent += spentAmount
      totalCommitted += committedAmount

      let status: string
      if (spentPercent >= 100) {
        exceededCount++
        status = 'exceeded'
      } else if (spentPercent >= budget.criticalThreshold) {
        criticalCount++
        status = 'critical'
      } else if (spentPercent >= budget.warningThreshold) {
        warningCount++
        status = 'warning'
      } else {
        healthyCount++
        status = 'healthy'
      }

      if (status !== 'healthy') {
        categoriesAtRisk.push({
          category: categoryLabels[budget.category] || budget.category,
          propertyName: budget.property.name,
          spentPercent: Math.round(spentPercent * 100) / 100,
          status,
        })
      }
    }

    return {
      fiscalYear: currentYear,
      totalBudgeted,
      totalSpent,
      totalCommitted,
      totalRemaining: totalBudgeted - totalSpent,
      overallSpentPercent: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 10000) / 100 : 0,
      budgetCounts: {
        total: budgets.length,
        healthy: healthyCount,
        warning: warningCount,
        critical: criticalCount,
        exceeded: exceededCount,
      },
      categoriesAtRisk: categoriesAtRisk.sort((a, b) => b.spentPercent - a.spentPercent),
    }
  })

// Get budget vs actual comparison data
export const getBudgetVsActual = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetVsActualFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, fiscalYear, period, groupBy } = data

    const where = {
      property: { managerId: context.auth.user.id },
      fiscalYear,
      isActive: true,
      ...(propertyId && { propertyId }),
      ...(period && { period }),
    }

    const budgets = await prisma.maintenanceBudget.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
    })

    if (groupBy === 'category') {
      // Group by category
      const categoryMap = new Map<
        string,
        {
          category: string
          categoryLabel: string
          budgetAmount: number
          actualSpent: number
          committedAmount: number
          variance: number
          variancePercent: number
        }
      >()

      for (const budget of budgets) {
        const budgetAmount = Number(budget.budgetAmount)
        const spentAmount = Number(budget.spentAmount)
        const committedAmount = Number(budget.committedAmount)
        const existing = categoryMap.get(budget.category)

        if (existing) {
          existing.budgetAmount += budgetAmount
          existing.actualSpent += spentAmount
          existing.committedAmount += committedAmount
        } else {
          categoryMap.set(budget.category, {
            category: budget.category,
            categoryLabel: categoryLabels[budget.category] || budget.category,
            budgetAmount,
            actualSpent: spentAmount,
            committedAmount,
            variance: 0,
            variancePercent: 0,
          })
        }
      }

      // Calculate variance
      const result = Array.from(categoryMap.values()).map((item) => ({
        ...item,
        variance: item.budgetAmount - item.actualSpent,
        variancePercent:
          item.budgetAmount > 0
            ? Math.round(((item.budgetAmount - item.actualSpent) / item.budgetAmount) * 10000) / 100
            : 0,
      }))

      return { groupBy, data: result.sort((a, b) => a.variancePercent - b.variancePercent) }
    }

    if (groupBy === 'property') {
      // Group by property
      const propertyMap = new Map<
        string,
        {
          propertyId: string
          propertyName: string
          budgetAmount: number
          actualSpent: number
          committedAmount: number
          variance: number
          variancePercent: number
        }
      >()

      for (const budget of budgets) {
        const budgetAmount = Number(budget.budgetAmount)
        const spentAmount = Number(budget.spentAmount)
        const committedAmount = Number(budget.committedAmount)
        const existing = propertyMap.get(budget.propertyId)

        if (existing) {
          existing.budgetAmount += budgetAmount
          existing.actualSpent += spentAmount
          existing.committedAmount += committedAmount
        } else {
          propertyMap.set(budget.propertyId, {
            propertyId: budget.propertyId,
            propertyName: budget.property.name,
            budgetAmount,
            actualSpent: spentAmount,
            committedAmount,
            variance: 0,
            variancePercent: 0,
          })
        }
      }

      // Calculate variance
      const result = Array.from(propertyMap.values()).map((item) => ({
        ...item,
        variance: item.budgetAmount - item.actualSpent,
        variancePercent:
          item.budgetAmount > 0
            ? Math.round(((item.budgetAmount - item.actualSpent) / item.budgetAmount) * 10000) / 100
            : 0,
      }))

      return { groupBy, data: result.sort((a, b) => a.variancePercent - b.variancePercent) }
    }

    // Group by month (default)
    // Get all work orders for the fiscal year
    const yearStart = new Date(fiscalYear, 0, 1)
    const yearEnd = new Date(fiscalYear, 11, 31, 23, 59, 59)

    // Get monthly spending from work orders
    const workOrders = await prisma.maintenanceRequest.findMany({
      where: {
        unit: {
          property: {
            managerId: context.auth.user.id,
            ...(propertyId && { id: propertyId }),
          },
        },
        status: 'COMPLETED',
        completedAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        actualCost: true,
        completedAt: true,
      },
    })

    // Calculate total annual budget
    const totalAnnualBudget = budgets.reduce((sum, b) => sum + Number(b.budgetAmount), 0)
    const monthlyBudget = totalAnnualBudget / 12

    // Aggregate by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthLabel: format(new Date(fiscalYear, i, 1), 'MMM'),
      budgetAmount: monthlyBudget,
      actualSpent: 0,
      cumulativeBudget: monthlyBudget * (i + 1),
      cumulativeSpent: 0,
    }))

    for (const wo of workOrders) {
      if (wo.completedAt) {
        const month = wo.completedAt.getMonth()
        monthlyData[month].actualSpent += Number(wo.actualCost || 0)
      }
    }

    // Calculate cumulative spending
    let cumulativeSpent = 0
    for (const month of monthlyData) {
      cumulativeSpent += month.actualSpent
      month.cumulativeSpent = cumulativeSpent
    }

    return { groupBy, data: monthlyData }
  })

// =============================================================================
// BUDGET SPENDING RECALCULATION
// =============================================================================

// Recalculate budget spending (called when work order costs change)
export const recalculateBudgetSpending = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const budget = await prisma.maintenanceBudget.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
    })

    if (!budget) {
      throw new Error('Budget not found')
    }

    // Calculate actual spending from completed work orders
    const actualSpending = await prisma.maintenanceRequest.aggregate({
      where: {
        unit: { propertyId: budget.propertyId },
        category: budget.category,
        status: 'COMPLETED',
        completedAt: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        actualCost: true,
      },
    })

    // Calculate committed from in-progress work orders
    const committedSpending = await prisma.maintenanceRequest.aggregate({
      where: {
        unit: { propertyId: budget.propertyId },
        category: budget.category,
        status: { in: ['IN_PROGRESS', 'SCHEDULED', 'PENDING_PARTS'] },
        createdAt: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        estimatedCost: true,
      },
    })

    const spentAmount = Number(actualSpending._sum.actualCost || 0)
    const committedAmount = Number(committedSpending._sum.estimatedCost || 0)
    const budgetAmount = Number(budget.budgetAmount)
    const spentPercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0

    // Update budget
    const updatedBudget = await prisma.maintenanceBudget.update({
      where: { id: data.id },
      data: {
        spentAmount,
        committedAmount,
      },
    })

    // Check if we need to create alerts
    const existingAlerts = await prisma.budgetAlert.findMany({
      where: { budgetId: data.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    const lastAlert = existingAlerts[0]
    let alertType: string | null = null

    if (spentPercent >= 100 && (!lastAlert || lastAlert.alertType !== 'EXCEEDED')) {
      alertType = 'EXCEEDED'
    } else if (
      spentPercent >= budget.criticalThreshold &&
      spentPercent < 100 &&
      (!lastAlert || lastAlert.alertType === 'WARNING')
    ) {
      alertType = 'CRITICAL'
    } else if (
      spentPercent >= budget.warningThreshold &&
      spentPercent < budget.criticalThreshold &&
      !lastAlert
    ) {
      alertType = 'WARNING'
    }

    if (alertType) {
      await prisma.budgetAlert.create({
        data: {
          budgetId: data.id,
          alertType,
          thresholdPercent: Math.round(spentPercent),
          spentAmount,
          budgetAmount,
          message: `Budget for ${categoryLabels[budget.category]} has reached ${Math.round(spentPercent)}% (${alertType.toLowerCase()})`,
        },
      })
    }

    return updatedBudget
  })

// =============================================================================
// BUDGET ALERTS
// =============================================================================

// Acknowledge budget alert
export const acknowledgeBudgetAlert = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(acknowledgeBudgetAlertSchema))
  .handler(async ({ context, data }) => {
    // Verify ownership through budget relation
    const alert = await prisma.budgetAlert.findFirst({
      where: {
        id: data.alertId,
        budget: {
          property: { managerId: context.auth.user.id },
        },
      },
    })

    if (!alert) {
      throw new Error('Alert not found')
    }

    const updatedAlert = await prisma.budgetAlert.update({
      where: { id: data.alertId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedById: context.auth.user.id,
      },
    })

    return updatedAlert
  })

// Get unacknowledged budget alerts
export const getUnacknowledgedAlerts = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context }) => {
    const alerts = await prisma.budgetAlert.findMany({
      where: {
        acknowledgedAt: null,
        budget: {
          property: { managerId: context.auth.user.id },
          isActive: true,
        },
      },
      include: {
        budget: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return alerts.map((alert) => ({
      ...alert,
      spentAmount: Number(alert.spentAmount),
      budgetAmount: Number(alert.budgetAmount),
      categoryLabel: categoryLabels[alert.budget.category] || alert.budget.category,
    }))
  })
