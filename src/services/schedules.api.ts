import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleFiltersSchema,
  scheduleIdSchema,
} from '~/services/schedules.schema'
import type { RecurrenceFrequency } from '~/services/schedules.schema'

/**
 * Calculate the next run date based on frequency and settings
 */
function calculateNextRunDate(
  frequency: RecurrenceFrequency,
  intervalCount: number,
  startDate: Date,
  lastRunAt: Date | null,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  monthOfYear?: number | null
): Date {
  const baseDate = lastRunAt ? new Date(lastRunAt) : new Date(startDate)
  const next = new Date(baseDate)

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + intervalCount)
      break

    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * intervalCount)
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        // Adjust to the correct day of week
        const currentDay = next.getDay()
        const daysUntil = (dayOfWeek - currentDay + 7) % 7
        next.setDate(next.getDate() + (daysUntil === 0 ? 7 : daysUntil))
      }
      break

    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14 * intervalCount)
      break

    case 'MONTHLY':
      next.setMonth(next.getMonth() + intervalCount)
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        // Set to specific day of month (handle month-end edge cases)
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break

    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3 * intervalCount)
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break

    case 'BIANNUALLY':
      next.setMonth(next.getMonth() + 6 * intervalCount)
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break

    case 'ANNUALLY':
      next.setFullYear(next.getFullYear() + intervalCount)
      if (monthOfYear !== null && monthOfYear !== undefined) {
        next.setMonth(monthOfYear - 1) // monthOfYear is 1-12
      }
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break
  }

  // If calculated date is in the past, recalculate from today
  const now = new Date()
  if (next <= now) {
    return calculateNextRunDate(
      frequency,
      intervalCount,
      now,
      now,
      dayOfWeek,
      dayOfMonth,
      monthOfYear
    )
  }

  return next
}

// Get all schedules
export const getSchedules = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(scheduleFiltersSchema))
  .handler(async ({ context, data }) => {
    const { offset, limit, isActive, propertyId, unitId, category, frequency, search } = data

    const where: Parameters<typeof prisma.maintenanceSchedule.findMany>[0]['where'] = {
      OR: [
        { property: { managerId: context.auth.user.id } },
        { unit: { property: { managerId: context.auth.user.id } } },
      ],
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (propertyId) {
      where.propertyId = propertyId
    }

    if (unitId) {
      where.unitId = unitId
    }

    if (category) {
      where.category = category
    }

    if (frequency) {
      where.frequency = frequency
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [schedules, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { nextRunAt: 'asc' },
        ],
        include: {
          property: { select: { id: true, name: true } },
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
          vendor: { select: { id: true, companyName: true } },
          _count: { select: { generatedRequests: true } },
        },
      }),
      prisma.maintenanceSchedule.count({ where }),
    ])

    return { schedules, total, limit, offset }
  })

// Get single schedule
export const getSchedule = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(scheduleIdSchema))
  .handler(async ({ context, data }) => {
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: {
        id: data.id,
        OR: [
          { property: { managerId: context.auth.user.id } },
          { unit: { property: { managerId: context.auth.user.id } } },
        ],
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            property: { select: { id: true, name: true } },
          },
        },
        vendor: { select: { id: true, companyName: true, phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        generatedRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
        _count: { select: { generatedRequests: true } },
      },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    return schedule
  })

// Create schedule
export const createSchedule = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createScheduleSchema))
  .handler(async ({ context, data }) => {
    // Verify property/unit ownership
    if (data.unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: data.unitId,
          property: { managerId: context.auth.user.id },
        },
      })
      if (!unit) {
        throw new Error('Unit not found or access denied')
      }
    } else if (data.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: data.propertyId,
          managerId: context.auth.user.id,
        },
      })
      if (!property) {
        throw new Error('Property not found or access denied')
      }
    }

    // Calculate first run date
    const nextRunAt = calculateNextRunDate(
      data.frequency,
      data.intervalCount,
      data.startDate,
      null,
      data.dayOfWeek,
      data.dayOfMonth,
      data.monthOfYear
    )

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        ...data,
        nextRunAt,
        createdById: context.auth.user.id,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            property: { select: { id: true, name: true } },
          },
        },
        vendor: { select: { id: true, companyName: true } },
      },
    })

    return schedule
  })

// Update schedule
export const updateSchedule = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(scheduleIdSchema.merge(updateScheduleSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.maintenanceSchedule.findFirst({
      where: {
        id,
        OR: [
          { property: { managerId: context.auth.user.id } },
          { unit: { property: { managerId: context.auth.user.id } } },
        ],
      },
    })

    if (!existing) {
      throw new Error('Schedule not found')
    }

    // Recalculate next run date if schedule settings changed
    const needsRecalculation =
      updateData.frequency !== undefined ||
      updateData.intervalCount !== undefined ||
      updateData.dayOfWeek !== undefined ||
      updateData.dayOfMonth !== undefined ||
      updateData.monthOfYear !== undefined ||
      updateData.startDate !== undefined

    let nextRunAt = existing.nextRunAt

    if (needsRecalculation) {
      nextRunAt = calculateNextRunDate(
        updateData.frequency ?? existing.frequency,
        updateData.intervalCount ?? existing.intervalCount,
        updateData.startDate ?? existing.startDate,
        existing.lastRunAt,
        updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : existing.dayOfWeek,
        updateData.dayOfMonth !== undefined ? updateData.dayOfMonth : existing.dayOfMonth,
        updateData.monthOfYear !== undefined ? updateData.monthOfYear : existing.monthOfYear
      )
    }

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...updateData,
        nextRunAt,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            property: { select: { id: true, name: true } },
          },
        },
        vendor: { select: { id: true, companyName: true } },
      },
    })

    return schedule
  })

// Delete schedule
export const deleteSchedule = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(scheduleIdSchema))
  .handler(async ({ context, data }) => {
    const existing = await prisma.maintenanceSchedule.findFirst({
      where: {
        id: data.id,
        OR: [
          { property: { managerId: context.auth.user.id } },
          { unit: { property: { managerId: context.auth.user.id } } },
        ],
      },
    })

    if (!existing) {
      throw new Error('Schedule not found')
    }

    await prisma.maintenanceSchedule.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// Get schedule stats
export const getScheduleStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const baseWhere = {
      OR: [
        { property: { managerId: context.auth.user.id } },
        { unit: { property: { managerId: context.auth.user.id } } },
      ],
    }

    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const [total, active, upcomingThisWeek] = await Promise.all([
      prisma.maintenanceSchedule.count({ where: baseWhere }),
      prisma.maintenanceSchedule.count({
        where: { ...baseWhere, isActive: true },
      }),
      prisma.maintenanceSchedule.count({
        where: {
          ...baseWhere,
          isActive: true,
          nextRunAt: { lte: nextWeek },
        },
      }),
    ])

    return { total, active, upcomingThisWeek }
  })

// Execute a schedule manually (creates a work order)
export const executeSchedule = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(scheduleIdSchema))
  .handler(async ({ context, data }) => {
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: {
        id: data.id,
        OR: [
          { property: { managerId: context.auth.user.id } },
          { unit: { property: { managerId: context.auth.user.id } } },
        ],
      },
      include: {
        property: { include: { units: { take: 1 } } },
        unit: true,
      },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    // Determine which unit(s) to create work orders for
    const unitId = schedule.unitId || schedule.property?.units[0]?.id

    if (!unitId) {
      throw new Error('No unit available for this schedule')
    }

    // Create the work order
    const workOrder = await prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.create({
        data: {
          title: schedule.title,
          description: schedule.description,
          category: schedule.category,
          priority: schedule.priority,
          location: schedule.location,
          estimatedCost: schedule.estimatedCost,
          estimatedDuration: schedule.estimatedDuration,
          unitId,
          vendorId: schedule.autoAssignVendor ? schedule.vendorId : null,
          createdById: context.auth.user.id,
          scheduleId: schedule.id,
        },
      })

      // Record status history
      await tx.workOrderStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          changedByName: 'System',
          changedByType: 'system',
          notes: `Auto-generated from schedule: ${schedule.name}`,
        },
      })

      return request
    })

    // Update the schedule
    const nextRunAt = calculateNextRunDate(
      schedule.frequency,
      schedule.intervalCount,
      schedule.startDate,
      new Date(),
      schedule.dayOfWeek,
      schedule.dayOfMonth,
      schedule.monthOfYear
    )

    await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    })

    return workOrder
  })
