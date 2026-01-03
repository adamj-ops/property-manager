/**
 * Global test setup file
 * This file runs before all tests and sets up the test environment
 */

import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll } from 'vitest'

import { cleanupTestDatabase, connectTestDatabase, disconnectTestDatabase } from './utils/test-db'

// Track if database is connected
let dbConnected = false

// Setup test database connection before all tests
// Skip for unit tests that don't need database access
beforeAll(async () => {
  try {
    await connectTestDatabase()
    dbConnected = true
  } catch (error) {
    // Database connection is optional for unit tests
    console.warn('[Test Setup] Database connection skipped - tests not requiring DB will still run')
  }
})

// Clean up after each test for isolation
afterEach(async () => {
  if (dbConnected) {
    await cleanupTestDatabase()
  }
})

// Disconnect from test database after all tests
afterAll(async () => {
  if (dbConnected) {
    await disconnectTestDatabase()
  }
})

// Mock environment variables for testing
process.env.NODE_ENV = 'test'

// Suppress console output during tests (optional - uncomment if needed)
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})

