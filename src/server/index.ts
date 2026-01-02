/**
 * Server Utilities - Central Export
 *
 * Import from '~/server' for all server-side utilities:
 *
 * import { prisma, ApiError, auditLog, paginatedResponse } from '~/server'
 */

// Database
export { prisma } from './db'
export type { PrismaClient } from './db'

// Redis
export { redis, disconnectRedis, checkRedisHealth } from './redis'
export type { Redis } from './redis'

// Authorization
export {
  AuthorizationError,
  requireRole,
  requireAdmin,
  requirePropertyAccess,
  requireUnitAccess,
  requireTenantAccess,
  requireLeaseAccess,
  requireMaintenanceRequestAccess,
  requireResourceAccess,
  checkPropertyAccess,
  checkUnitAccess,
  checkTenantAccess,
  checkLeaseAccess,
  checkMaintenanceRequestAccess,
  checkResourceAccess,
} from './authorization'
export type { ResourceType } from './authorization'

// Error Handling
export {
  ApiError,
  ErrorCode,
  isApiError,
  toApiError,
  safeHandler,
  success,
  error,
} from './errors'
export type {
  ErrorCode as ErrorCodeType,
  ErrorDetails,
  ErrorEnvelope,
  SuccessEnvelope,
  ApiResponse,
} from './errors'

// Pagination
export {
  paginationSchema,
  cursorPaginationSchema,
  sortingSchema,
  paginatedSortedSchema,
  parsePagination,
  paginatedResponse,
  cursorPaginatedResponse,
  pageToOffset,
  offsetToPage,
  toPrismaArgs,
  toPrismaOrderBy,
  toPrismaQueryArgs,
  buildPaginationQuery,
  getNextPageParams,
  getPrevPageParams,
} from './pagination'
export type {
  PaginationParams,
  CursorPaginationParams,
  SortingParams,
  PaginatedResponse,
  CursorPaginatedResponse,
} from './pagination'

// Audit Logging
export {
  auditLog,
  auditLogWithContext,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditView,
  auditExport,
  auditUpload,
  auditDownload,
  queryAuditLogs,
  getEntityAuditHistory,
  getUserAuditHistory,
  computeDiff,
} from './audit'
export type { AuditAction, AuditEntityType, AuditLogEntry, AuditLogQuery } from './audit'

// Storage
export {
  createUploadUrl,
  createDownloadUrl,
  deleteFile,
  getFileInfo,
  validateFile,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from './storage'

// Email
export { sendEmail } from './email'

// Environment
export { env } from './env'

// Utils
export { getSessionFromHeaders, createURL, requireUser } from './utils'
