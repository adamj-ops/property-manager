/**
 * Authentication mocking utilities
 * Provides helpers for mocking authentication state in tests
 */

import type { User } from '@prisma/client'

import { createTestUser } from './test-helpers'

/**
 * Auth context type matching the application's auth structure
 */
export interface MockAuth {
  isAuthenticated: true
  user: User
}

export interface MockUnauthenticated {
  isAuthenticated: false
  user: null
}

export type AuthContext = MockAuth | MockUnauthenticated

/**
 * Create a mock authenticated context
 */
export function createMockAuth(user: User): MockAuth {
  return {
    isAuthenticated: true,
    user,
  }
}

/**
 * Create a mock unauthenticated context
 */
export function createMockUnauthenticated(): MockUnauthenticated {
  return {
    isAuthenticated: false,
    user: null,
  }
}

/**
 * Create a mock admin auth context
 */
export async function createMockAdminAuth(): Promise<MockAuth> {
  const adminUser = await createTestUser({
    role: 'admin',
    name: 'Admin User',
  })
  
  return createMockAuth(adminUser)
}

/**
 * Create a mock regular user auth context
 */
export async function createMockUserAuth(): Promise<MockAuth> {
  const user = await createTestUser({
    role: 'user',
    name: 'Regular User',
  })
  
  return createMockAuth(user)
}

/**
 * Server function handler context type
 * Matches the context passed to TanStack Start server function handlers
 */
export interface ServerFnContext {
  auth: AuthContext
}

/**
 * Create a mock server function context with authentication
 */
export function createServerFnContext(auth: AuthContext): ServerFnContext {
  return { auth }
}

/**
 * Create an authenticated server function context with a new user
 */
export async function createAuthenticatedContext(): Promise<ServerFnContext> {
  const auth = await createMockUserAuth()
  return createServerFnContext(auth)
}

/**
 * Create an authenticated server function context with an admin user
 */
export async function createAdminContext(): Promise<ServerFnContext> {
  const auth = await createMockAdminAuth()
  return createServerFnContext(auth)
}

/**
 * Create an unauthenticated server function context
 */
export function createUnauthenticatedContext(): ServerFnContext {
  return createServerFnContext(createMockUnauthenticated())
}

