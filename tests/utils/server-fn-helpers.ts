/**
 * Server function testing helpers
 * Utilities for testing TanStack Start server functions
 */

import type { AuthContext, ServerFnContext } from './mock-auth'

/**
 * Handler options for testing server functions
 * Matches the structure passed to server function handlers
 */
export interface HandlerOptions<TData = unknown> {
  context: ServerFnContext
  data: TData
}

/**
 * Create handler options for testing server functions
 */
export function createHandlerOptions<TData>(
  context: ServerFnContext,
  data: TData
): HandlerOptions<TData> {
  return { context, data }
}

/**
 * Create handler options with auth context shorthand
 */
export function createAuthenticatedHandlerOptions<TData>(
  auth: AuthContext,
  data: TData
): HandlerOptions<TData> {
  return {
    context: { auth },
    data,
  }
}

/**
 * Test that a server function rejects unauthenticated requests
 */
export async function expectUnauthorized(
  handler: (options: HandlerOptions<unknown>) => Promise<unknown>,
  data: unknown = {}
): Promise<void> {
  const { expect } = await import('vitest')
  const { createUnauthenticatedContext } = await import('./mock-auth')
  
  await expect(
    handler({
      context: createUnauthenticatedContext(),
      data,
    })
  ).rejects.toThrow('Unauthorized')
}

/**
 * Test that a server function rejects requests with invalid data
 */
export async function expectValidationError(
  handler: (options: HandlerOptions<unknown>) => Promise<unknown>,
  context: ServerFnContext,
  invalidData: unknown
): Promise<void> {
  const { expect } = await import('vitest')
  
  await expect(
    handler({
      context,
      data: invalidData,
    })
  ).rejects.toThrow()
}

/**
 * Type-safe wrapper for testing server function handlers
 * 
 * @example
 * const result = await testServerFn(
 *   getProperties,
 *   authContext,
 *   { limit: 10, offset: 0 }
 * )
 */
export async function testServerFn<TInput, TOutput>(
  serverFn: { handler: (options: HandlerOptions<TInput>) => Promise<TOutput> },
  context: ServerFnContext,
  data: TInput
): Promise<TOutput> {
  return serverFn.handler({ context, data })
}

/**
 * Assert that a paginated response has the expected structure
 */
export function assertPaginatedResponse<T>(
  response: { items?: T[]; total?: number; limit?: number; offset?: number },
  expectedTotal?: number
): void {
  const { expect } = require('vitest')
  
  expect(response).toHaveProperty('total')
  expect(response).toHaveProperty('limit')
  expect(response).toHaveProperty('offset')
  expect(typeof response.total).toBe('number')
  expect(typeof response.limit).toBe('number')
  expect(typeof response.offset).toBe('number')
  
  if (expectedTotal !== undefined) {
    expect(response.total).toBe(expectedTotal)
  }
}

/**
 * Assert that an error response matches expected error code
 */
export async function expectErrorCode(
  handler: (options: HandlerOptions<unknown>) => Promise<unknown>,
  context: ServerFnContext,
  data: unknown,
  expectedCode: string
): Promise<void> {
  const { expect } = await import('vitest')
  
  try {
    await handler({ context, data })
    expect.fail('Expected handler to throw an error')
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message).toContain(expectedCode)
    } else {
      throw error
    }
  }
}

