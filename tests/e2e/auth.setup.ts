/**
 * Playwright Authentication Setup
 *
 * This file runs before authenticated tests to establish a session.
 * The authenticated state is saved to a file and reused across tests.
 *
 * @see https://playwright.dev/docs/auth
 */

import { expect, test as setup } from '@playwright/test'

const authFile = 'tests/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Use test credentials from environment or defaults
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || '!Ab12345'

  // Navigate to sign in
  await page.goto('/auth/sign-in')

  // Wait for the form to be visible
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Fill in credentials
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for successful redirect to app
  await expect(page).toHaveURL(/\/app/, { timeout: 10000 })

  // Verify we're authenticated by checking for app shell elements
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 5000 })

  // Save authentication state to file
  await page.context().storageState({ path: authFile })
})
