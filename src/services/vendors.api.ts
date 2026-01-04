import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFiltersSchema,
  vendorIdSchema,
} from './vendors.schema'

// Types for responses
export type VendorWithStats = {
  id: string
  status: string
  companyName: string
  contactName: string
  email: string
  phone: string
  altPhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  categories: string[]
  serviceAreas: string[]
  hourlyRate: number | null
  insuranceProvider: string | null
  insurancePolicyNum: string | null
  insuranceExpiry: Date | null
  licenseNumber: string | null
  licenseExpiry: Date | null
  taxId: string | null
  paymentTerms: number
  rating: number | null
  totalJobs: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    maintenanceRequests: number
    expenses: number
  }
}

export type VendorFull = VendorWithStats & {
  maintenanceRequests: Array<{
    id: string
    requestNumber: string
    title: string
    status: string
    priority: string
    category: string
    createdAt: Date
    completedAt: Date | null
    unit: {
      id: string
      unitNumber: string
      property: {
        id: string
        name: string
      }
    }
  }>
}

// Get all vendors
export const getVendors = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorFiltersSchema))
  .handler(async ({ data }) => {
    const { status, category, search, limit, offset } = data

    const where: Parameters<typeof prisma.vendor.findMany>[0]['where'] = {
      ...(status && { status }),
      ...(category && { categories: { has: category } }),
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { contactName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { companyName: 'asc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { maintenanceRequests: true, expenses: true },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ])

    return { vendors, total, limit, offset }
  })

// Get single vendor by ID
export const getVendor = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema))
  .handler(async ({ data }) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.id },
      include: {
        maintenanceRequests: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            unit: {
              include: {
                property: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        _count: {
          select: { maintenanceRequests: true, expenses: true },
        },
      },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return vendor as VendorFull
  })

// Create vendor
export const createVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createVendorSchema))
  .handler(async ({ data }) => {
    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { maintenanceRequests: true, expenses: true },
        },
      },
    })

    return vendor
  })

// Update vendor
export const updateVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema.merge(updateVendorSchema)))
  .handler(async ({ data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.vendor.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Vendor not found')
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { maintenanceRequests: true, expenses: true },
        },
      },
    })

    return vendor
  })

// Delete vendor (soft delete - set to inactive)
export const deleteVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema))
  .handler(async ({ data }) => {
    const existing = await prisma.vendor.findUnique({
      where: { id: data.id },
    })

    if (!existing) {
      throw new Error('Vendor not found')
    }

    const vendor = await prisma.vendor.update({
      where: { id: data.id },
      data: { status: 'INACTIVE' },
    })

    return vendor
  })

// Get vendor stats
export const getVendorStats = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async () => {
    const [active, inactive, totalJobs, pendingApproval] = await Promise.all([
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count({ where: { status: 'INACTIVE' } }),
      prisma.maintenanceRequest.count({
        where: { vendorId: { not: null } },
      }),
      prisma.vendor.count({ where: { status: 'PENDING_APPROVAL' } }),
    ])

    // Get vendors with expiring insurance (within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringInsurance = await prisma.vendor.count({
      where: {
        status: 'ACTIVE',
        insuranceExpiry: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    })

    return {
      active,
      inactive,
      pendingApproval,
      totalJobs,
      expiringInsurance,
    }
  })
