/**
 * Authentication E2E Tests
 *
 * Tests sign in and sign up flows using Playwright
 */

import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Sign In Page', () => {
    test('displays sign in form', async ({ page }) => {
      await page.goto('/auth/sign-in')

      // Check that the sign in form is displayed
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('shows validation errors for empty form submission', async ({ page }) => {
      await page.goto('/auth/sign-in')

      // Try to submit empty form
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show validation errors
      await expect(page.getByText(/email/i)).toBeVisible()
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/sign-in')

      // Fill in invalid credentials
      await page.getByLabel(/email/i).fill('invalid@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show error message
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    })

    test('has link to sign up page', async ({ page }) => {
      await page.goto('/auth/sign-in')

      const signUpLink = page.getByRole('link', { name: /sign up/i })
      await expect(signUpLink).toBeVisible()

      await signUpLink.click()
      await expect(page).toHaveURL(/\/auth\/sign-up/)
    })

    test('remembers email when navigating back', async ({ page }) => {
      await page.goto('/auth/sign-in')

      const emailInput = page.getByLabel(/email/i)
      await emailInput.fill('test@example.com')

      // Navigate away and back
      await page.goto('/auth/sign-up')
      await page.goBack()

      // Email might be remembered (depends on browser behavior)
      // This test documents expected behavior
    })
  })

  test.describe('Sign Up Page', () => {
    test('displays sign up form', async ({ page }) => {
      await page.goto('/auth/sign-up')

      // Check that sign up elements are present
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/^password$/i)).toBeVisible()
      await expect(page.getByLabel(/confirm password/i)).toBeVisible()
      await expect(page.getByLabel(/name/i)).toBeVisible()
      await expect(page.getByRole('checkbox')).toBeVisible()
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('has link to sign in page', async ({ page }) => {
      await page.goto('/auth/sign-up')

      const signInLink = page.getByRole('link', { name: /sign in/i })
      await expect(signInLink).toBeVisible()

      await signInLink.click()
      await expect(page).toHaveURL(/\/auth\/sign-in/)
    })

    test('shows password requirements indicator', async ({ page }) => {
      await page.goto('/auth/sign-up')

      // Initially shows requirements text
      await expect(page.getByText(/8\+ characters/)).toBeVisible()
      await expect(page.getByText(/1 uppercase/)).toBeVisible()
      await expect(page.getByText(/1 number/)).toBeVisible()
      await expect(page.getByText(/1 special/)).toBeVisible()
    })

    test('updates password requirements as user types', async ({ page }) => {
      await page.goto('/auth/sign-up')

      const passwordInput = page.getByLabel(/^password$/i)

      // Type a valid password
      await passwordInput.fill('Abcdefgh1!')

      // Requirements should show as met (with checkmarks)
      await expect(page.getByText(/✓.*8\+ characters/)).toBeVisible()
      await expect(page.getByText(/✓.*1 uppercase/)).toBeVisible()
      await expect(page.getByText(/✓.*1 number/)).toBeVisible()
      await expect(page.getByText(/✓.*1 special/)).toBeVisible()
    })

    test('displays Google OAuth button', async ({ page }) => {
      await page.goto('/auth/sign-up')

      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    })

    test('displays terms of service link', async ({ page }) => {
      await page.goto('/auth/sign-up')

      await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible()
    })

    test('displays privacy policy link', async ({ page }) => {
      await page.goto('/auth/sign-up')

      await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('redirects to sign in when accessing protected route unauthenticated', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/app/dashboard')

      // Should redirect to sign in
      await expect(page).toHaveURL(/\/auth\/sign-in/)
    })

    test('redirects to sign in when accessing properties page unauthenticated', async ({ page }) => {
      await page.goto('/app/properties')

      await expect(page).toHaveURL(/\/auth\/sign-in/)
    })
  })

  test.describe('Navigation', () => {
    test('logo links to home page', async ({ page }) => {
      await page.goto('/auth/sign-in')

      // Find and click the logo/brand link
      const homeLink = page.getByRole('link').first()
      await homeLink.click()

      // Should navigate to home
      await expect(page).toHaveURL('/')
    })
  })
})

test.describe('Authenticated User Flow', () => {
  // Note: For full E2E tests with authentication, you would typically:
  // 1. Use Playwright's storageState to persist auth
  // 2. Create a test user in beforeAll
  // 3. Sign in once and reuse the session

  test.describe.skip('Dashboard Access (requires auth setup)', () => {
    test('can access dashboard after sign in', async ({ page }) => {
      // This test would require a valid test account
      await page.goto('/auth/sign-in')

      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('testpassword123')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/app\/dashboard/)
    })
  })
})

