/**
 * Audit Logging for Property Management Platform
 *
 * Provides compliance-grade audit logging for sensitive operations.
 * Logs are stored in the audit_logs table with full change tracking.
 *
 * Usage:
 *   await auditLog(userId, 'CREATE', 'Property', propertyId, null, newData)
 *   await auditLog(userId, 'UPDATE', 'Lease', leaseId, oldData, newData)
 *   await auditLog(userId, 'DELETE', 'Tenant', tenantId, oldData, null)
 */

import { getWebRequest } from 'vinxi/http'
import { prisma } from '~/server/db'

// =============================================================================
// TYPES
// =============================================================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'ARCHIVE'
  | 'RESTORE'

export type AuditEntityType =
  | 'User'
  | 'Property'
  | 'Unit'
  | 'Tenant'
  | 'Lease'
  | 'Payment'
  | 'Expense'
  | 'MaintenanceRequest'
  | 'Vendor'
  | 'Document'
  | 'Inspection'
  | 'Message'
  | 'Pet'

export interface AuditLogEntry {
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

// =============================================================================
// CORE AUDIT FUNCTION
// =============================================================================

/**
 * Create an audit log entry
 *
 * @example
 * // Log a create action
 * await auditLog(userId, 'CREATE', 'Property', property.id, null, property)
 *
 * // Log an update action (with diff)
 * await auditLog(userId, 'UPDATE', 'Lease', lease.id, oldLease, newLease)
 *
 * // Log a delete action
 * await auditLog(userId, 'DELETE', 'Tenant', tenantId, tenant, null)
 */
export async function auditLog(
  userId: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null
): Promise<void> {
  try {
    // Extract request info if available
    let ipAddress: string | null = null
    let userAgent: string | null = null

    try {
      const request = getWebRequest()
      if (request) {
        ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          null
        userAgent = request.headers.get('user-agent') || null
      }
    } catch {
      // Request context may not be available in all contexts
    }

    // Filter sensitive fields from logged values
    const sanitizedOld = oldValues ? sanitizeForAudit(oldValues) : null
    const sanitizedNew = newValues ? sanitizeForAudit(newValues) : null

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: sanitizedOld,
        newValues: sanitizedNew,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Don't let audit logging failures break the main operation
    // Log to console for monitoring
    console.error('[AUDIT] Failed to create audit log entry:', error)
  }
}

/**
 * Create an audit log entry with automatic request context extraction
 * For use in server functions where context is available
 */
export async function auditLogWithContext(
  entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>
): Promise<void> {
  return auditLog(
    entry.userId,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.oldValues,
    entry.newValues
  )
}

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Log a create action
 */
export async function auditCreate(
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  return auditLog(userId, 'CREATE', entityType, entityId, null, data)
}

/**
 * Log an update action
 */
export async function auditUpdate(
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Promise<void> {
  return auditLog(userId, 'UPDATE', entityType, entityId, oldData, newData)
}

/**
 * Log a delete action
 */
export async function auditDelete(
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  return auditLog(userId, 'DELETE', entityType, entityId, data, null)
}

/**
 * Log a view action (for sensitive data access)
 */
export async function auditView(
  userId: string,
  entityType: AuditEntityType,
  entityId: string
): Promise<void> {
  return auditLog(userId, 'VIEW', entityType, entityId, null, null)
}

/**
 * Log an export action (for compliance)
 */
export async function auditExport(
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  exportDetails?: Record<string, unknown>
): Promise<void> {
  return auditLog(userId, 'EXPORT', entityType, entityId, null, exportDetails || null)
}

/**
 * Log a document upload
 */
export async function auditUpload(
  userId: string,
  documentId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  return auditLog(userId, 'UPLOAD', 'Document', documentId, null, metadata)
}

/**
 * Log a document download
 */
export async function auditDownload(
  userId: string,
  documentId: string
): Promise<void> {
  return auditLog(userId, 'DOWNLOAD', 'Document', documentId, null, null)
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export interface AuditLogQuery {
  userId?: string
  entityType?: AuditEntityType
  entityId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(query: AuditLogQuery) {
  const {
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = query

  const where = {
    ...(userId && { userId }),
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...(action && { action }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total, limit, offset }
}

/**
 * Get audit history for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: AuditEntityType,
  entityId: string,
  limit = 50
) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get recent activity for a user
 */
export async function getUserAuditHistory(userId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// =============================================================================
// SANITIZATION
// =============================================================================

/**
 * Fields that should never be logged to audit trail
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'ssn',
  'socialSecurityNumber',
  'driversLicense',
  'bankAccountNumber',
  'routingNumber',
  'creditCardNumber',
  'cvv',
  'accessToken',
  'refreshToken',
  'idToken',
  'secretKey',
  'apiKey',
  'privateKey',
])

/**
 * Remove sensitive fields from an object before logging
 */
function sanitizeForAudit(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeForAudit(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// =============================================================================
// DIFF UTILITIES
// =============================================================================

/**
 * Compute the difference between two objects for audit logging
 * Returns only the fields that changed
 */
export function computeDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } {
  const oldDiff: Record<string, unknown> = {}
  const newDiff: Record<string, unknown> = {}

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

  for (const key of allKeys) {
    const oldVal = oldObj[key]
    const newVal = newObj[key]

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (key in oldObj) oldDiff[key] = oldVal
      if (key in newObj) newDiff[key] = newVal
    }
  }

  return { old: sanitizeForAudit(oldDiff), new: sanitizeForAudit(newDiff) }
}
