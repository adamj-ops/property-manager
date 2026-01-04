import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
  expenseIdSchema,
  expenseSummaryFiltersSchema,
} from '~/services/expenses.schema'

// Get all expenses with filters
export const getExpenses = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(expenseFiltersSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const {
      propertyId,
      vendorId,
      maintenanceRequestId,
      category,
      status,
      startDate,
      endDate,
      search,
      taxDeductible,
      limit,
      offset,
    } = data

    const where = {
      property: { managerId: context.auth.user.id },
      ...(propertyId && { propertyId }),
      ...(vendorId && { vendorId }),
      ...(maintenanceRequestId && { maintenanceRequestId }),
      ...(category && { category }),
      ...(status && { status }),
      ...(taxDeductible !== undefined && { taxDeductible }),
      ...(startDate && { expenseDate: { gte: startDate } }),
      ...(endDate && { expenseDate: { lte: endDate } }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' as const } },
          { expenseNumber: { contains: search, mode: 'insensitive' as const } },
          { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true },
          },
          vendor: {
            select: { id: true, companyName: true, contactName: true },
          },
          maintenanceRequest: {
            select: { id: true, requestNumber: true, title: true },
          },
        },
        orderBy: { expenseDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.expense.count({ where }),
    ])

    return { expenses, total, limit, offset }
  })

// Get single expense
export const getExpense = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(expenseIdSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const expense = await prisma.expense.findFirst({
      where: {
        id: data.id,
        property: { managerId: context.auth.user.id },
      },
      include: {
        property: true,
        vendor: true,
        maintenanceRequest: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
    })

    if (!expense) {
      throw new Error('Expense not found')
    }

    return expense
  })

// Create expense
export const createExpense = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createExpenseSchema))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, managerId: context.auth.user.id },
    })

    if (!property) {
      throw new Error('Property not found or access denied')
    }

    const expense = await prisma.expense.create({
      data: {
        ...data,
        receiptUrl: data.receiptUrl || null,
      },
      include: {
        property: { select: { id: true, name: true } },
        vendor: { select: { id: true, companyName: true } },
        maintenanceRequest: { select: { id: true, requestNumber: true } },
      },
    })

    return expense
  })

// Update expense
export const updateExpense = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(expenseIdSchema.merge(updateExpenseSchema)))
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    // Verify expense belongs to user's property
    const existing = await prisma.expense.findFirst({
      where: { id, property: { managerId: context.auth.user.id } },
    })

    if (!existing) {
      throw new Error('Expense not found or access denied')
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...updateData,
        receiptUrl: updateData.receiptUrl || null,
      },
      include: {
        property: { select: { id: true, name: true } },
        vendor: { select: { id: true, companyName: true } },
        maintenanceRequest: { select: { id: true, requestNumber: true } },
      },
    })

    return expense
  })

// Delete expense
export const deleteExpense = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(expenseIdSchema))
  .handler(async ({ context, data }) => {
    // Verify expense belongs to user's property
    const existing = await prisma.expense.findFirst({
      where: { id: data.id, property: { managerId: context.auth.user.id } },
    })

    if (!existing) {
      throw new Error('Expense not found or access denied')
    }

    await prisma.expense.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

// Get expense summary by category
export const getExpenseSummary = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(expenseSummaryFiltersSchema))
  .handler(async ({ context, data }) => {
    const { propertyId, startDate, endDate } = data

    // Default to current month if no dates provided
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const effectiveStartDate = startDate || defaultStartDate
    const effectiveEndDate = endDate || defaultEndDate

    const where = {
      property: { managerId: context.auth.user.id },
      ...(propertyId && { propertyId }),
      expenseDate: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
      status: { in: ['APPROVED', 'PAID'] as const },
    }

    // Get totals by category
    const categoryTotals = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    })

    // Get total expenses
    const totalResult = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })

    // Get tax deductible total
    const taxDeductibleResult = await prisma.expense.aggregate({
      where: { ...where, taxDeductible: true },
      _sum: { amount: true },
    })

    // Transform results
    const byCategory = categoryTotals.map((cat) => ({
      category: cat.category,
      total: Number(cat._sum.amount || 0),
      count: cat._count,
    }))

    return {
      byCategory,
      totalExpenses: Number(totalResult._sum.amount || 0),
      totalCount: totalResult._count,
      taxDeductibleTotal: Number(taxDeductibleResult._sum.amount || 0),
      dateRange: {
        start: effectiveStartDate,
        end: effectiveEndDate,
      },
    }
  })

// Get expense stats for dashboard
export const getExpenseStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const baseWhere = {
      property: { managerId: context.auth.user.id },
      status: { in: ['APPROVED', 'PAID'] as const },
    }

    // Current month expenses
    const currentMonthResult = await prisma.expense.aggregate({
      where: {
        ...baseWhere,
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Last month expenses
    const lastMonthResult = await prisma.expense.aggregate({
      where: {
        ...baseWhere,
        expenseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    })

    // Pending expenses
    const pendingResult = await prisma.expense.aggregate({
      where: {
        property: { managerId: context.auth.user.id },
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Year to date
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const ytdResult = await prisma.expense.aggregate({
      where: {
        ...baseWhere,
        expenseDate: { gte: startOfYear, lte: now },
      },
      _sum: { amount: true },
    })

    const currentMonth = Number(currentMonthResult._sum.amount || 0)
    const lastMonth = Number(lastMonthResult._sum.amount || 0)
    const monthOverMonthChange = lastMonth > 0
      ? ((currentMonth - lastMonth) / lastMonth) * 100
      : 0

    return {
      currentMonth,
      currentMonthCount: currentMonthResult._count,
      lastMonth,
      monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
      pendingAmount: Number(pendingResult._sum.amount || 0),
      pendingCount: pendingResult._count,
      yearToDate: Number(ytdResult._sum.amount || 0),
    }
  })

// Mark expense as paid
export const markExpensePaid = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(
    zodValidator(
      expenseIdSchema.extend({
        paidDate: createExpenseSchema.shape.paidDate,
        referenceNumber: createExpenseSchema.shape.referenceNumber,
      })
    )
  )
  // @ts-expect-error - Prisma Decimal types aren't serializable but work at runtime
  .handler(async ({ context, data }) => {
    const { id, paidDate, referenceNumber } = data

    // Verify expense belongs to user's property
    const existing = await prisma.expense.findFirst({
      where: { id, property: { managerId: context.auth.user.id } },
    })

    if (!existing) {
      throw new Error('Expense not found or access denied')
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: paidDate || new Date(),
        referenceNumber,
      },
      include: {
        property: { select: { id: true, name: true } },
        vendor: { select: { id: true, companyName: true } },
      },
    })

    return expense
  })
