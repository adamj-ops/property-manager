import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, startOfQuarter, endOfQuarter } from 'date-fns'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  costReportingFiltersSchema,
  costByPeriodSchema,
  type CostSummary,
  type CostByProperty,
  type CostByCategory,
  type CostByVendor,
  type CostByPeriod,
  type TopExpensiveRequest,
  type AggregationPeriod,
} from '~/services/cost-reporting.schema'
import { maintenanceCategoryEnum } from '~/services/maintenance.schema'

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

// Build base where clause for authorized access
function buildBaseWhere(userId: string, filters: {
  startDate?: Date
  endDate?: Date
  propertyId?: string
  unitId?: string
  vendorId?: string
  category?: string
}) {
  const where: Parameters<typeof prisma.maintenanceRequest.findMany>[0]['where'] = {
    unit: {
      property: {
        managerId: userId,
      },
    },
    status: 'COMPLETED',
  }

  if (filters.startDate) {
    where.completedAt = { gte: filters.startDate }
  }

  if (filters.endDate) {
    where.completedAt = {
      ...((where.completedAt as object) || {}),
      lte: filters.endDate,
    }
  }

  if (filters.propertyId) {
    where.unit = {
      ...((where.unit as object) || {}),
      propertyId: filters.propertyId,
    }
  }

  if (filters.unitId) {
    where.unitId = filters.unitId
  }

  if (filters.vendorId) {
    where.vendorId = filters.vendorId
  }

  if (filters.category) {
    where.category = filters.category as any
  }

  return where
}

// Get cost summary statistics
export const getCostSummary = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costReportingFiltersSchema))
  .handler(async ({ context, data }) => {
    const where = buildBaseWhere(context.auth.user.id, data)

    const result = await prisma.maintenanceRequest.aggregate({
      where,
      _sum: {
        estimatedCost: true,
        actualCost: true,
        tenantCharge: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        actualCost: true,
      },
    })

    const totalEstimated = Number(result._sum.estimatedCost || 0)
    const totalActual = Number(result._sum.actualCost || 0)
    const totalTenantCharges = Number(result._sum.tenantCharge || 0)

    const summary: CostSummary = {
      totalEstimated,
      totalActual,
      totalTenantCharges,
      netCost: totalActual - totalTenantCharges,
      completedCount: result._count.id,
      avgCostPerRequest: Number(result._avg.actualCost || 0),
      savingsVsEstimate: totalEstimated - totalActual,
    }

    return summary
  })

// Get costs grouped by property
export const getCostsByProperty = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costReportingFiltersSchema))
  .handler(async ({ context, data }) => {
    const where = buildBaseWhere(context.auth.user.id, data)

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: {
        estimatedCost: true,
        actualCost: true,
        tenantCharge: true,
        unit: {
          select: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Aggregate by property
    const propertyMap = new Map<string, CostByProperty>()

    for (const request of requests) {
      const propertyId = request.unit.property.id
      const existing = propertyMap.get(propertyId)

      if (existing) {
        existing.estimatedCost += Number(request.estimatedCost || 0)
        existing.actualCost += Number(request.actualCost || 0)
        existing.tenantCharges += Number(request.tenantCharge || 0)
        existing.requestCount += 1
      } else {
        propertyMap.set(propertyId, {
          propertyId,
          propertyName: request.unit.property.name,
          estimatedCost: Number(request.estimatedCost || 0),
          actualCost: Number(request.actualCost || 0),
          tenantCharges: Number(request.tenantCharge || 0),
          requestCount: 1,
        })
      }
    }

    return Array.from(propertyMap.values()).sort((a, b) => b.actualCost - a.actualCost)
  })

// Get costs grouped by category
export const getCostsByCategory = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costReportingFiltersSchema))
  .handler(async ({ context, data }) => {
    const where = buildBaseWhere(context.auth.user.id, data)

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: {
        category: true,
        estimatedCost: true,
        actualCost: true,
        tenantCharge: true,
      },
    })

    // Aggregate by category
    const categoryMap = new Map<string, CostByCategory>()

    for (const request of requests) {
      const category = request.category
      const existing = categoryMap.get(category)

      if (existing) {
        existing.estimatedCost += Number(request.estimatedCost || 0)
        existing.actualCost += Number(request.actualCost || 0)
        existing.tenantCharges += Number(request.tenantCharge || 0)
        existing.requestCount += 1
      } else {
        categoryMap.set(category, {
          category,
          categoryLabel: categoryLabels[category] || category,
          estimatedCost: Number(request.estimatedCost || 0),
          actualCost: Number(request.actualCost || 0),
          tenantCharges: Number(request.tenantCharge || 0),
          requestCount: 1,
        })
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.actualCost - a.actualCost)
  })

// Get costs grouped by vendor
export const getCostsByVendor = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costReportingFiltersSchema))
  .handler(async ({ context, data }) => {
    const where = buildBaseWhere(context.auth.user.id, data)
    // Only include requests that have a vendor assigned
    where.vendorId = { not: null }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: {
        estimatedCost: true,
        actualCost: true,
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    })

    // Aggregate by vendor
    const vendorMap = new Map<string, CostByVendor>()

    for (const request of requests) {
      if (!request.vendor) continue

      const vendorId = request.vendor.id
      const existing = vendorMap.get(vendorId)

      if (existing) {
        existing.estimatedCost += Number(request.estimatedCost || 0)
        existing.actualCost += Number(request.actualCost || 0)
        existing.requestCount += 1
        existing.avgCostPerRequest = existing.actualCost / existing.requestCount
      } else {
        const actualCost = Number(request.actualCost || 0)
        vendorMap.set(vendorId, {
          vendorId,
          vendorName: request.vendor.companyName,
          estimatedCost: Number(request.estimatedCost || 0),
          actualCost,
          requestCount: 1,
          avgCostPerRequest: actualCost,
        })
      }
    }

    return Array.from(vendorMap.values()).sort((a, b) => b.actualCost - a.actualCost)
  })

// Helper to get period boundaries
function getPeriodBoundaries(date: Date, period: AggregationPeriod): { start: Date; end: Date; label: string } {
  switch (period) {
    case 'DAY':
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
        label: format(date, 'MMM d'),
      }
    case 'WEEK':
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
        label: `Week of ${format(startOfWeek(date, { weekStartsOn: 0 }), 'MMM d')}`,
      }
    case 'MONTH':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, 'MMM yyyy'),
      }
    case 'QUARTER':
      return {
        start: startOfQuarter(date),
        end: endOfQuarter(date),
        label: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
      }
    case 'YEAR':
      return {
        start: startOfYear(date),
        end: new Date(date.getFullYear(), 11, 31, 23, 59, 59),
        label: format(date, 'yyyy'),
      }
  }
}

// Get period key for grouping
function getPeriodKey(date: Date, period: AggregationPeriod): string {
  switch (period) {
    case 'DAY':
      return format(date, 'yyyy-MM-dd')
    case 'WEEK':
      return format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    case 'MONTH':
      return format(date, 'yyyy-MM')
    case 'QUARTER':
      return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
    case 'YEAR':
      return format(date, 'yyyy')
  }
}

// Get costs grouped by time period
export const getCostsByPeriod = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costByPeriodSchema))
  .handler(async ({ context, data }) => {
    const { period, ...filters } = data
    const where = buildBaseWhere(context.auth.user.id, filters)

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: {
        completedAt: true,
        estimatedCost: true,
        actualCost: true,
        tenantCharge: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    })

    // Aggregate by period
    const periodMap = new Map<string, CostByPeriod>()

    for (const request of requests) {
      if (!request.completedAt) continue

      const periodKey = getPeriodKey(request.completedAt, period)
      const { label } = getPeriodBoundaries(request.completedAt, period)
      const existing = periodMap.get(periodKey)

      if (existing) {
        existing.estimatedCost += Number(request.estimatedCost || 0)
        existing.actualCost += Number(request.actualCost || 0)
        existing.tenantCharges += Number(request.tenantCharge || 0)
        existing.requestCount += 1
      } else {
        periodMap.set(periodKey, {
          period: periodKey,
          periodLabel: label,
          estimatedCost: Number(request.estimatedCost || 0),
          actualCost: Number(request.actualCost || 0),
          tenantCharges: Number(request.tenantCharge || 0),
          requestCount: 1,
        })
      }
    }

    return Array.from(periodMap.values())
  })

// Get top expensive requests
export const getTopExpensiveRequests = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(costReportingFiltersSchema.extend({ limit: require('zod').z.number().int().min(1).max(50).default(10) })))
  .handler(async ({ context, data }) => {
    const { limit, ...filters } = data
    const where = buildBaseWhere(context.auth.user.id, filters)
    where.actualCost = { not: null }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: {
        actualCost: 'desc',
      },
      take: limit,
      select: {
        id: true,
        requestNumber: true,
        title: true,
        category: true,
        actualCost: true,
        completedAt: true,
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
    })

    return requests.map((r): TopExpensiveRequest => ({
      id: r.id,
      requestNumber: r.requestNumber,
      title: r.title,
      category: categoryLabels[r.category] || r.category,
      actualCost: Number(r.actualCost || 0),
      propertyName: r.unit.property.name,
      unitNumber: r.unit.unitNumber,
      completedAt: r.completedAt?.toISOString() || null,
    }))
  })
