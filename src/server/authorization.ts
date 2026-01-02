/**
 * Authorization Helpers for Property Management Platform
 *
 * Provides role-based access control (RBAC) and resource-level authorization.
 *
 * Usage:
 *   - requireRole('admin') - Requires specific role
 *   - requirePropertyAccess(propertyId) - Verifies user owns/manages property
 *   - requireResourceAccess(resource, resourceId) - Generic resource access check
 */

import { createMiddleware } from '@tanstack/start'
import { status } from 'http-status'
import { setResponseStatus } from 'vinxi/http'

import { authedMiddleware, Role, type Role as RoleType } from '~/middlewares/auth'
import { prisma } from '~/server/db'

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AuthorizationError extends Error {
  public statusCode: number
  public code: string

  constructor(message: string, code = 'FORBIDDEN', statusCode = status.FORBIDDEN) {
    super(message)
    this.name = 'AuthorizationError'
    this.code = code
    this.statusCode = statusCode
  }
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL
// =============================================================================

/**
 * Middleware factory that requires a specific role
 *
 * @example
 * export const adminOnlyEndpoint = createServerFn({ method: 'GET' })
 *   .middleware([requireRole('admin')])
 *   .handler(async ({ context }) => { ... })
 */
export function requireRole(requiredRole: RoleType) {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context }) => {
      const userRole = context.auth.user.role

      if (userRole !== requiredRole) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          `This action requires ${requiredRole} role`,
          'INSUFFICIENT_ROLE'
        )
      }

      return next({ context })
    })
}

/**
 * Middleware that requires admin role
 */
export const requireAdmin = requireRole(Role.Admin)

// =============================================================================
// PROPERTY ACCESS CONTROL
// =============================================================================

/**
 * Check if user has access to a specific property
 * Currently: User must be the property manager
 * Future: Will support team-based access
 */
export async function checkPropertyAccess(
  userId: string,
  propertyId: string
): Promise<boolean> {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      managerId: userId,
    },
    select: { id: true },
  })

  return property !== null
}

/**
 * Middleware factory for property access validation
 * Expects propertyId to be in the request data
 *
 * @example
 * export const updateProperty = createServerFn({ method: 'POST' })
 *   .middleware([requirePropertyAccess()])
 *   .validator(zodValidator(updatePropertySchema))
 *   .handler(async ({ context, data }) => { ... })
 */
export function requirePropertyAccess() {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      // Extract propertyId from various possible locations in data
      const propertyId =
        (data as { propertyId?: string })?.propertyId ||
        (data as { id?: string })?.id

      if (!propertyId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          'Property ID is required',
          'MISSING_PROPERTY_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkPropertyAccess(context.auth.user.id, propertyId)

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          'You do not have access to this property',
          'PROPERTY_ACCESS_DENIED'
        )
      }

      return next({ context })
    })
}

// =============================================================================
// UNIT ACCESS CONTROL
// =============================================================================

/**
 * Check if user has access to a specific unit (via property ownership)
 */
export async function checkUnitAccess(
  userId: string,
  unitId: string
): Promise<boolean> {
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: {
        managerId: userId,
      },
    },
    select: { id: true },
  })

  return unit !== null
}

/**
 * Middleware factory for unit access validation
 */
export function requireUnitAccess() {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      const unitId = (data as { unitId?: string })?.unitId

      if (!unitId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          'Unit ID is required',
          'MISSING_UNIT_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkUnitAccess(context.auth.user.id, unitId)

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          'You do not have access to this unit',
          'UNIT_ACCESS_DENIED'
        )
      }

      return next({ context })
    })
}

// =============================================================================
// TENANT ACCESS CONTROL
// =============================================================================

/**
 * Check if user has access to a tenant (via property/lease relationship)
 */
export async function checkTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  // User has access if tenant has a lease in one of their properties
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      leases: {
        some: {
          unit: {
            property: {
              managerId: userId,
            },
          },
        },
      },
    },
    select: { id: true },
  })

  return tenant !== null
}

/**
 * Middleware factory for tenant access validation
 */
export function requireTenantAccess() {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      const tenantId = (data as { tenantId?: string })?.tenantId

      if (!tenantId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          'Tenant ID is required',
          'MISSING_TENANT_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkTenantAccess(context.auth.user.id, tenantId)

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          'You do not have access to this tenant',
          'TENANT_ACCESS_DENIED'
        )
      }

      return next({ context })
    })
}

// =============================================================================
// LEASE ACCESS CONTROL
// =============================================================================

/**
 * Check if user has access to a lease (via property ownership)
 */
export async function checkLeaseAccess(
  userId: string,
  leaseId: string
): Promise<boolean> {
  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      unit: {
        property: {
          managerId: userId,
        },
      },
    },
    select: { id: true },
  })

  return lease !== null
}

/**
 * Middleware factory for lease access validation
 */
export function requireLeaseAccess() {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      const leaseId = (data as { leaseId?: string })?.leaseId

      if (!leaseId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          'Lease ID is required',
          'MISSING_LEASE_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkLeaseAccess(context.auth.user.id, leaseId)

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          'You do not have access to this lease',
          'LEASE_ACCESS_DENIED'
        )
      }

      return next({ context })
    })
}

// =============================================================================
// MAINTENANCE REQUEST ACCESS CONTROL
// =============================================================================

/**
 * Check if user has access to a maintenance request
 */
export async function checkMaintenanceRequestAccess(
  userId: string,
  requestId: string
): Promise<boolean> {
  const request = await prisma.maintenanceRequest.findFirst({
    where: {
      id: requestId,
      unit: {
        property: {
          managerId: userId,
        },
      },
    },
    select: { id: true },
  })

  return request !== null
}

/**
 * Middleware factory for maintenance request access validation
 */
export function requireMaintenanceRequestAccess() {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      const requestId =
        (data as { requestId?: string })?.requestId ||
        (data as { id?: string })?.id

      if (!requestId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          'Maintenance request ID is required',
          'MISSING_REQUEST_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkMaintenanceRequestAccess(
        context.auth.user.id,
        requestId
      )

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          'You do not have access to this maintenance request',
          'REQUEST_ACCESS_DENIED'
        )
      }

      return next({ context })
    })
}

// =============================================================================
// GENERIC RESOURCE ACCESS CONTROL
// =============================================================================

export type ResourceType =
  | 'property'
  | 'unit'
  | 'tenant'
  | 'lease'
  | 'maintenance_request'
  | 'document'

/**
 * Generic resource access check
 * Routes to the appropriate specific check based on resource type
 */
export async function checkResourceAccess(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'property':
      return checkPropertyAccess(userId, resourceId)
    case 'unit':
      return checkUnitAccess(userId, resourceId)
    case 'tenant':
      return checkTenantAccess(userId, resourceId)
    case 'lease':
      return checkLeaseAccess(userId, resourceId)
    case 'maintenance_request':
      return checkMaintenanceRequestAccess(userId, resourceId)
    case 'document':
      // Documents are accessed via property or tenant
      // For now, check if user owns any property (admin-level check)
      // TODO: Implement proper document access control
      return true
    default:
      return false
  }
}

/**
 * Factory for creating resource-specific access middleware
 *
 * @example
 * export const getResource = createServerFn({ method: 'GET' })
 *   .middleware([requireResourceAccess('property', 'propertyId')])
 *   .handler(async ({ context, data }) => { ... })
 */
export function requireResourceAccess(
  resourceType: ResourceType,
  idField: string = 'id'
) {
  return createMiddleware()
    .middleware([authedMiddleware])
    .server(async ({ next, context, data }) => {
      const resourceId = (data as Record<string, unknown>)?.[idField] as
        | string
        | undefined

      if (!resourceId) {
        setResponseStatus(status.BAD_REQUEST)
        throw new AuthorizationError(
          `${idField} is required`,
          'MISSING_RESOURCE_ID',
          status.BAD_REQUEST
        )
      }

      const hasAccess = await checkResourceAccess(
        context.auth.user.id,
        resourceType,
        resourceId
      )

      if (!hasAccess) {
        setResponseStatus(status.FORBIDDEN)
        throw new AuthorizationError(
          `You do not have access to this ${resourceType.replace('_', ' ')}`,
          `${resourceType.toUpperCase()}_ACCESS_DENIED`
        )
      }

      return next({ context })
    })
}
