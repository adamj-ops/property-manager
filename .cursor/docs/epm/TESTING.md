# Testing Framework Documentation

**EPM-9: Testing Framework Setup**  
**Last Updated:** January 3, 2026  
**Status:** Complete

---

## Overview

This document describes the testing framework for the Everyday Property Manager platform. The testing stack includes:

- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end (E2E) testing
- **MSW**: Mock Service Worker for API mocking (optional)

## Directory Structure

```
tests/
├── unit/                           # Unit tests
│   ├── services/                   # Schema validation tests
│   │   └── properties.schema.test.ts
│   ├── server/                     # Server utility tests
│   │   └── pagination.test.ts
│   └── utils.test.ts               # Pure function tests
├── integration/                    # Integration tests
│   └── services/                   # Server function tests
│       └── properties.api.test.ts
├── components/                     # Component tests
│   ├── ui/                         # UI component tests
│   │   └── button.test.tsx
│   └── documents/                  # Feature component tests
├── e2e/                           # End-to-end tests
│   ├── auth.spec.ts               # Authentication flows
│   └── properties.spec.ts         # Property management flows
├── utils/                         # Test utilities
│   ├── index.ts                   # Barrel export
│   ├── test-db.ts                 # Database utilities
│   ├── test-helpers.ts            # Data creation helpers
│   ├── mock-auth.ts               # Auth mocking utilities
│   └── server-fn-helpers.ts       # Server function testing
├── setup.ts                       # Global test setup
└── vitest.d.ts                    # TypeScript declarations
```

## Running Tests

### Available Scripts

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Open Vitest UI for interactive testing
pnpm test:ui

# Run specific test categories
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:components    # Component tests only

# Generate coverage report
pnpm test:coverage

# Run E2E tests
pnpm test:e2e           # Headless
pnpm test:e2e:ui        # With Playwright UI
pnpm test:e2e:headed    # With browser visible
```

## Test Configuration

### Vitest Configuration

Located at `vitest.config.ts`:

- **Environment**: happy-dom (fast DOM simulation)
- **Globals**: Enabled (describe, it, expect available globally)
- **Path aliases**: `~/*` maps to `src/*`
- **Setup file**: `tests/setup.ts`
- **Coverage thresholds**: 80% statements, 70% branches

### Playwright Configuration

Located at `playwright.config.ts`:

- **Browsers**: Chromium (default), Firefox and WebKit available
- **Base URL**: `http://localhost:3000`
- **Artifacts**: Screenshots on failure, videos on retry
- **Web server**: Automatically starts dev server

## Test Patterns

### Unit Testing (Schemas & Pure Functions)

Unit tests verify isolated functionality without external dependencies.

```typescript
import { describe, expect, it } from 'vitest'
import { createPropertySchema } from '~/services/properties.schema'

describe('createPropertySchema', () => {
  it('validates valid property data', () => {
    const valid = createPropertySchema.parse({
      name: 'Test Property',
      addressLine1: '123 Main St',
      city: 'Minneapolis',
      state: 'MN',
      zipCode: '55401',
    })
    expect(valid).toBeDefined()
    expect(valid.name).toBe('Test Property')
  })

  it('rejects invalid data', () => {
    expect(() => createPropertySchema.parse({ name: '' })).toThrow()
  })

  it('applies default values', () => {
    const result = createPropertySchema.parse({
      name: 'Test',
      addressLine1: '123 Main',
      city: 'Minneapolis',
      state: 'MN',
      zipCode: '55401',
    })
    expect(result.type).toBe('MULTI_FAMILY')
    expect(result.status).toBe('ACTIVE')
  })
})
```

### Integration Testing (Server Functions)

Integration tests verify server functions with real database interactions.

```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { cleanupTestDatabase, getTestPrisma } from '../../utils/test-db'
import { createTestProperty, createTestUser } from '../../utils/test-helpers'

describe('Properties API', () => {
  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  it('returns properties for authenticated user', async () => {
    const user = await createTestUser()
    await createTestProperty(user.id, { name: 'Test Property' })
    
    const prisma = getTestPrisma()
    const properties = await prisma.property.findMany({
      where: { managerId: user.id },
    })

    expect(properties).toHaveLength(1)
    expect(properties[0].name).toBe('Test Property')
  })

  it('filters properties by status', async () => {
    const user = await createTestUser()
    await createTestProperty(user.id, { status: 'ACTIVE' })
    await createTestProperty(user.id, { status: 'INACTIVE' })

    const prisma = getTestPrisma()
    const active = await prisma.property.findMany({
      where: { managerId: user.id, status: 'ACTIVE' },
    })

    expect(active).toHaveLength(1)
  })
})
```

### Component Testing (React Testing Library)

Component tests verify UI behavior and user interactions.

```typescript
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from '~/components/ui/button'

afterEach(() => cleanup())

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

### E2E Testing (Playwright)

E2E tests verify complete user workflows in a real browser.

```typescript
import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test('displays sign in form', async ({ page }) => {
    await page.goto('/auth/sign-in')
    
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })

  test('shows validation errors', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/email/i)).toBeVisible()
  })
})
```

## Test Utilities

### Database Utilities (`tests/utils/test-db.ts`)

```typescript
import { getTestPrisma, cleanupTestDatabase, connectTestDatabase } from './utils/test-db'

// Get test Prisma client
const prisma = getTestPrisma()

// Clean up all test data
await cleanupTestDatabase()

// Clean up test users specifically
await cleanupTestUsers()
```

### Test Helpers (`tests/utils/test-helpers.ts`)

```typescript
import { 
  createTestUser, 
  createTestProperty, 
  createTestUnit,
  createTestTenant,
  createTestLease,
  createTestScenario,
  createPropertyWithUnits,
} from './utils/test-helpers'

// Create a test user
const user = await createTestUser({ name: 'Test User' })

// Create a property for the user
const property = await createTestProperty(user.id, { name: 'Test Property' })

// Create a complete scenario (user, property, unit, tenant, lease)
const scenario = await createTestScenario()
console.log(scenario.user, scenario.property, scenario.lease)

// Create a property with multiple units
const { property, units } = await createPropertyWithUnits(user.id, 5)
```

### Mock Auth (`tests/utils/mock-auth.ts`)

```typescript
import { 
  createMockAuth, 
  createMockUnauthenticated,
  createMockUserAuth,
  createMockAdminAuth,
  createServerFnContext,
} from './utils/mock-auth'

// Create authenticated context
const auth = await createMockUserAuth()
const context = createServerFnContext(auth)

// Create admin context
const adminAuth = await createMockAdminAuth()

// Create unauthenticated context
const unauthContext = createServerFnContext(createMockUnauthenticated())
```

## Test Database Setup

### Configuration

Tests use the same Prisma schema as the application. For isolation, configure a separate test database:

1. Create a test database (e.g., `property_manager_test`)
2. Set `TEST_DATABASE_URL` environment variable
3. Run migrations: `pnpm db:push`

### Cleanup Strategy

The test setup automatically:
- Connects to the test database before all tests
- Cleans up test data after each test
- Disconnects after all tests complete

```typescript
// tests/setup.ts
beforeAll(async () => {
  await connectTestDatabase()
})

afterEach(async () => {
  await cleanupTestDatabase()
})

afterAll(async () => {
  await disconnectTestDatabase()
})
```

## Coverage Requirements

### Thresholds

| Metric     | Threshold |
|------------|-----------|
| Statements | 80%       |
| Branches   | 70%       |
| Functions  | 80%       |
| Lines      | 80%       |

### Exclusions

The following are excluded from coverage:
- Test files (`tests/**`)
- Type definitions (`**/*.d.ts`)
- Configuration files (`**/*.config.{ts,js}`)
- Generated files (`src/route-tree.gen.ts`)
- Entry points (`src/entry-*.{ts,tsx}`)
- Prisma migrations (`prisma/**`)

## Best Practices

### General

1. **Test naming**: Use descriptive names that explain the expected behavior
2. **Single assertion**: Prefer one logical assertion per test
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Cleanup**: Always clean up test data to prevent test pollution

### Unit Tests

1. Focus on pure functions and schema validation
2. Test edge cases and error conditions
3. Mock external dependencies when needed

### Integration Tests

1. Test real database interactions
2. Verify authorization logic
3. Test pagination and filtering
4. Clean up after each test

### Component Tests

1. Test user interactions, not implementation details
2. Use semantic queries (getByRole, getByLabelText)
3. Test accessibility (ARIA attributes, keyboard navigation)
4. Mock API calls when testing components in isolation

### E2E Tests

1. Focus on critical user journeys
2. Use realistic test data
3. Handle authentication state properly
4. Test both happy paths and error cases

## Troubleshooting

### Common Issues

**Tests fail to connect to database**
- Ensure `DATABASE_URL` or `TEST_DATABASE_URL` is set
- Verify the database exists and migrations are applied

**Component tests fail with hydration errors**
- Ensure proper cleanup between tests with `cleanup()`
- Check for async state updates

**E2E tests timeout**
- Increase timeout in `playwright.config.ts`
- Ensure dev server starts correctly
- Check for network issues

**Coverage report shows unexpected files**
- Update exclusion patterns in `vitest.config.ts`
- Verify source maps are generated correctly

## CI/CD Integration

Tests should run in the CI pipeline:

```yaml
# Example GitHub Actions step
- name: Run Tests
  run: |
    pnpm test:coverage
    pnpm test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

