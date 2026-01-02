/**
 * Standardized Error Handling for Property Management Platform
 *
 * Provides consistent error types, error envelopes, and HTTP status mapping.
 *
 * Usage:
 *   throw new ApiError('Not found', 'NOT_FOUND', 404)
 *   throw ApiError.notFound('Property')
 *   throw ApiError.badRequest('Invalid email format')
 */

import { status } from 'http-status'

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCode = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Authorization errors
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Domain-specific errors
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  UNIT_NOT_FOUND: 'UNIT_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  LEASE_NOT_FOUND: 'LEASE_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  LEASE_OVERLAP: 'LEASE_OVERLAP',
  INVALID_LEASE_DATES: 'INVALID_LEASE_DATES',
  UNIT_OCCUPIED: 'UNIT_OCCUPIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// =============================================================================
// API ERROR CLASS
// =============================================================================

export interface ErrorDetails {
  field?: string
  value?: unknown
  constraint?: string
  [key: string]: unknown
}

export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: ErrorDetails

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = status.INTERNAL_SERVER_ERROR,
    details?: ErrorDetails
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  // ---------------------------------------------------------------------------
  // Factory Methods - Client Errors
  // ---------------------------------------------------------------------------

  static badRequest(message: string, details?: ErrorDetails): ApiError {
    return new ApiError(message, ErrorCode.BAD_REQUEST, status.BAD_REQUEST, details)
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(message, ErrorCode.UNAUTHORIZED, status.UNAUTHORIZED)
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(message, ErrorCode.FORBIDDEN, status.FORBIDDEN)
  }

  static notFound(resource: string, id?: string): ApiError {
    const message = id
      ? `${resource} with ID "${id}" not found`
      : `${resource} not found`
    return new ApiError(message, ErrorCode.NOT_FOUND, status.NOT_FOUND, { resource, id })
  }

  static conflict(message: string, details?: ErrorDetails): ApiError {
    return new ApiError(message, ErrorCode.CONFLICT, status.CONFLICT, details)
  }

  static validationError(message: string, details?: ErrorDetails): ApiError {
    return new ApiError(
      message,
      ErrorCode.VALIDATION_ERROR,
      status.UNPROCESSABLE_ENTITY,
      details
    )
  }

  static rateLimited(retryAfter?: number): ApiError {
    return new ApiError(
      'Too many requests. Please try again later.',
      ErrorCode.RATE_LIMITED,
      status.TOO_MANY_REQUESTS,
      retryAfter ? { retryAfter } : undefined
    )
  }

  // ---------------------------------------------------------------------------
  // Factory Methods - Domain Errors
  // ---------------------------------------------------------------------------

  static propertyNotFound(id?: string): ApiError {
    return new ApiError(
      id ? `Property with ID "${id}" not found` : 'Property not found',
      ErrorCode.PROPERTY_NOT_FOUND,
      status.NOT_FOUND,
      { resource: 'property', id }
    )
  }

  static unitNotFound(id?: string): ApiError {
    return new ApiError(
      id ? `Unit with ID "${id}" not found` : 'Unit not found',
      ErrorCode.UNIT_NOT_FOUND,
      status.NOT_FOUND,
      { resource: 'unit', id }
    )
  }

  static tenantNotFound(id?: string): ApiError {
    return new ApiError(
      id ? `Tenant with ID "${id}" not found` : 'Tenant not found',
      ErrorCode.TENANT_NOT_FOUND,
      status.NOT_FOUND,
      { resource: 'tenant', id }
    )
  }

  static leaseNotFound(id?: string): ApiError {
    return new ApiError(
      id ? `Lease with ID "${id}" not found` : 'Lease not found',
      ErrorCode.LEASE_NOT_FOUND,
      status.NOT_FOUND,
      { resource: 'lease', id }
    )
  }

  static documentNotFound(id?: string): ApiError {
    return new ApiError(
      id ? `Document with ID "${id}" not found` : 'Document not found',
      ErrorCode.DOCUMENT_NOT_FOUND,
      status.NOT_FOUND,
      { resource: 'document', id }
    )
  }

  static leaseOverlap(unitId: string, dates: { start: Date; end: Date }): ApiError {
    return new ApiError(
      'Lease dates overlap with an existing lease on this unit',
      ErrorCode.LEASE_OVERLAP,
      status.CONFLICT,
      { unitId, startDate: dates.start.toISOString(), endDate: dates.end.toISOString() }
    )
  }

  static invalidLeaseDates(message: string): ApiError {
    return new ApiError(message, ErrorCode.INVALID_LEASE_DATES, status.BAD_REQUEST)
  }

  static unitOccupied(unitId: string): ApiError {
    return new ApiError(
      'Cannot perform this action. Unit is currently occupied.',
      ErrorCode.UNIT_OCCUPIED,
      status.CONFLICT,
      { unitId }
    )
  }

  static fileTooLarge(maxSize: number, actualSize: number): ApiError {
    return new ApiError(
      `File exceeds maximum size of ${formatBytes(maxSize)}`,
      ErrorCode.FILE_TOO_LARGE,
      status.PAYLOAD_TOO_LARGE,
      { maxSize, actualSize }
    )
  }

  static invalidFileType(mimeType: string, allowedTypes: string[]): ApiError {
    return new ApiError(
      `File type "${mimeType}" is not allowed`,
      ErrorCode.INVALID_FILE_TYPE,
      status.UNSUPPORTED_MEDIA_TYPE,
      { mimeType, allowedTypes }
    )
  }

  // ---------------------------------------------------------------------------
  // Factory Methods - Server Errors
  // ---------------------------------------------------------------------------

  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError(message, ErrorCode.INTERNAL_ERROR, status.INTERNAL_SERVER_ERROR)
  }

  static database(message = 'Database operation failed'): ApiError {
    return new ApiError(message, ErrorCode.DATABASE_ERROR, status.INTERNAL_SERVER_ERROR)
  }

  static externalService(service: string, message?: string): ApiError {
    return new ApiError(
      message || `External service "${service}" is unavailable`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      status.BAD_GATEWAY,
      { service }
    )
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  toJSON(): ErrorEnvelope {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

// =============================================================================
// ERROR ENVELOPE (Response Format)
// =============================================================================

export interface ErrorEnvelope {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: ErrorDetails
  }
}

export interface SuccessEnvelope<T> {
  success: true
  data: T
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope

/**
 * Wrap a successful response in the standard envelope
 */
export function success<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data }
}

/**
 * Wrap an error in the standard envelope
 */
export function error(
  message: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: ErrorDetails
): ErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Check if an error is an ApiError
 */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/**
 * Convert any error to an ApiError
 * Useful for catch blocks to ensure consistent error handling
 */
export function toApiError(err: unknown): ApiError {
  if (isApiError(err)) {
    return err
  }

  if (err instanceof Error) {
    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
      const prismaError = err as Error & { code?: string; meta?: { target?: string[] } }
      
      switch (prismaError.code) {
        case 'P2002':
          return new ApiError(
            `A record with this ${prismaError.meta?.target?.join(', ') || 'value'} already exists`,
            ErrorCode.CONFLICT,
            status.CONFLICT,
            { constraint: prismaError.meta?.target }
          )
        case 'P2025':
          return ApiError.notFound('Record')
        default:
          return ApiError.database(err.message)
      }
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
      return ApiError.validationError('Validation failed', {
        errors: (err as Error & { errors?: unknown[] }).errors,
      })
    }

    return new ApiError(err.message, ErrorCode.INTERNAL_ERROR, status.INTERNAL_SERVER_ERROR)
  }

  return ApiError.internal()
}

/**
 * Safe handler wrapper that catches errors and converts them to ApiErrors
 *
 * @example
 * export const getProperty = createServerFn({ method: 'GET' })
 *   .handler(safeHandler(async ({ data }) => {
 *     const property = await prisma.property.findUnique({ where: { id: data.id } })
 *     if (!property) throw ApiError.propertyNotFound(data.id)
 *     return property
 *   }))
 */
export function safeHandler<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    try {
      return await handler(args)
    } catch (err) {
      throw toApiError(err)
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
