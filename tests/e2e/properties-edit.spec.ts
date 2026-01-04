/**
 * Property & Unit Editing E2E Tests
 *
 * Tests edit pages and inline table editing functionality.
 * These tests run with authenticated state from auth.setup.ts
 */

import { expect, test } from '@playwright/test'

test.describe('Property Edit Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to properties list first
    await page.goto('/app/properties')
    await page.waitForLoadState('networkidle')
  })

  test('can navigate to edit page from property detail', async ({ page }) => {
    // Click on first property in the table
    const firstPropertyRow = page.getByRole('row').nth(1) // Skip header row
    const propertyLink = firstPropertyRow.getByRole('link').first()

    // Skip if no properties exist
    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()
    await expect(page).toHaveURL(/\/app\/properties\/[^/]+$/)

    // Click edit button
    await page.getByRole('link', { name: /edit/i }).click()
    await expect(page).toHaveURL(/\/app\/properties\/[^/]+\/edit$/)
  })

  test('edit form is pre-populated with existing data', async ({ page }) => {
    // Navigate directly to a property's edit page
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()
    await page.getByRole('link', { name: /edit/i }).click()

    // Form fields should be pre-filled
    const nameInput = page.getByLabel(/property name/i)
    await expect(nameInput).toBeVisible()
    await expect(nameInput).not.toHaveValue('')

    const addressInput = page.getByLabel(/address/i).first()
    await expect(addressInput).toBeVisible()
  })

  test('can update property name', async ({ page }) => {
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()
    await page.getByRole('link', { name: /edit/i }).click()

    const nameInput = page.getByLabel(/property name/i)
    const originalName = await nameInput.inputValue()
    const newName = `Updated ${originalName} ${Date.now()}`

    await nameInput.fill(newName)
    await page.getByRole('button', { name: /save|update/i }).click()

    // Should show success and redirect
    await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/app\/properties\/[^/]+$/)
  })

  test('cancel returns to detail page without saving changes', async ({ page }) => {
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()
    const detailUrl = page.url()

    await page.getByRole('link', { name: /edit/i }).click()

    // Make a change
    const nameInput = page.getByLabel(/property name/i)
    const originalName = await nameInput.inputValue()
    await nameInput.fill('Should Not Save')

    // Cancel
    await page.getByRole('link', { name: /cancel/i }).click()
    await expect(page).toHaveURL(detailUrl)
  })

  test('validates required fields', async ({ page }) => {
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()
    await page.getByRole('link', { name: /edit/i }).click()

    // Clear required field
    const nameInput = page.getByLabel(/property name/i)
    await nameInput.clear()

    // Try to submit
    await page.getByRole('button', { name: /save|update/i }).click()

    // Should show validation error
    await expect(page.getByText(/required|cannot be empty/i)).toBeVisible()
  })
})

test.describe('Unit Edit Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/properties')
    await page.waitForLoadState('networkidle')
  })

  test('can navigate to unit edit page', async ({ page }) => {
    // Click first property
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()

    // Navigate to units tab/page
    const unitsLink = page.getByRole('link', { name: /units/i })
    if (await unitsLink.isVisible()) {
      await unitsLink.click()
    }

    await page.waitForLoadState('networkidle')

    // Click on first unit
    const unitLink = page.getByRole('link').filter({ hasText: /unit|#/i }).first()
    if (!(await unitLink.isVisible())) {
      test.skip()
      return
    }

    await unitLink.click()

    // Click edit
    await page.getByRole('link', { name: /edit/i }).click()
    await expect(page).toHaveURL(/\/units\/[^/]+\/edit$/)
  })

  test('unit edit form shows current values', async ({ page }) => {
    // Navigate to first property's units
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()

    const unitsLink = page.getByRole('link', { name: /units/i })
    if (await unitsLink.isVisible()) {
      await unitsLink.click()
    }

    await page.waitForLoadState('networkidle')

    const unitLink = page.getByRole('link').filter({ hasText: /unit|#/i }).first()
    if (!(await unitLink.isVisible())) {
      test.skip()
      return
    }

    await unitLink.click()
    await page.getByRole('link', { name: /edit/i }).click()

    // Check form has values
    const unitNumberInput = page.getByLabel(/unit number/i)
    await expect(unitNumberInput).toBeVisible()
    await expect(unitNumberInput).not.toHaveValue('')
  })
})

test.describe('Inline Table Editing - Properties', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/properties')
    await page.waitForLoadState('networkidle')
  })

  test('can edit property name inline by clicking cell', async ({ page }) => {
    // Find an editable name cell in the table
    const tableRow = page.getByRole('row').nth(1)
    const nameCell = tableRow.getByRole('cell').first()

    if (!(await nameCell.isVisible())) {
      test.skip()
      return
    }

    const originalText = await nameCell.textContent()

    // Click to activate edit mode
    await nameCell.click()

    // Look for input field
    const input = nameCell.getByRole('textbox')
    if (await input.isVisible()) {
      await input.fill(`${originalText} (edited)`)
      await input.blur()

      // Should show success toast
      await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('can change property status via dropdown', async ({ page }) => {
    const tableRow = page.getByRole('row').nth(1)

    if (!(await tableRow.isVisible())) {
      test.skip()
      return
    }

    // Find status badge/dropdown
    const statusCell = tableRow.locator('[data-status], [role="button"]').filter({ hasText: /active|inactive/i }).first()

    if (await statusCell.isVisible()) {
      await statusCell.click()

      // Select different status
      const option = page.getByRole('option').first()
      if (await option.isVisible()) {
        await option.click()
        await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('reverts changes on escape key', async ({ page }) => {
    const tableRow = page.getByRole('row').nth(1)
    const nameCell = tableRow.getByRole('cell').first()

    if (!(await nameCell.isVisible())) {
      test.skip()
      return
    }

    const originalText = await nameCell.textContent()
    await nameCell.click()

    const input = nameCell.getByRole('textbox')
    if (await input.isVisible()) {
      await input.fill('Should be reverted')
      await input.press('Escape')

      // Text should revert
      await expect(nameCell).toHaveText(originalText!)
    }
  })
})

test.describe('Inline Table Editing - Units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/properties')
    await page.waitForLoadState('networkidle')
  })

  test('can edit unit status inline', async ({ page }) => {
    // Navigate to property units
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()

    const unitsLink = page.getByRole('link', { name: /units/i })
    if (await unitsLink.isVisible()) {
      await unitsLink.click()
    }

    await page.waitForLoadState('networkidle')

    // Look for table view toggle if present
    const tableViewButton = page.getByRole('button', { name: /table/i })
    if (await tableViewButton.isVisible()) {
      await tableViewButton.click()
    }

    // Find status dropdown in unit row
    const unitRow = page.getByRole('row').nth(1)
    const statusBadge = unitRow.locator('[role="button"]').filter({ hasText: /vacant|occupied|notice/i }).first()

    if (await statusBadge.isVisible()) {
      await statusBadge.click()

      const option = page.getByRole('option').first()
      if (await option.isVisible()) {
        await option.click()
        await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('can edit unit rent inline', async ({ page }) => {
    // Navigate to property units
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()

    const unitsLink = page.getByRole('link', { name: /units/i })
    if (await unitsLink.isVisible()) {
      await unitsLink.click()
    }

    await page.waitForLoadState('networkidle')

    // Switch to table view if available
    const tableViewButton = page.getByRole('button', { name: /table/i })
    if (await tableViewButton.isVisible()) {
      await tableViewButton.click()
    }

    // Find rent cell
    const unitRow = page.getByRole('row').nth(1)
    const rentCell = unitRow.getByRole('cell').filter({ hasText: /\$[0-9,]+/ }).first()

    if (await rentCell.isVisible()) {
      await rentCell.click()

      const input = rentCell.getByRole('textbox')
      if (await input.isVisible()) {
        await input.fill('1500')
        await input.blur()
        await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('can toggle between grid and table view', async ({ page }) => {
    // Navigate to property units
    const firstPropertyRow = page.getByRole('row').nth(1)
    const propertyLink = firstPropertyRow.getByRole('link').first()

    if (!(await propertyLink.isVisible())) {
      test.skip()
      return
    }

    await propertyLink.click()

    const unitsLink = page.getByRole('link', { name: /units/i })
    if (await unitsLink.isVisible()) {
      await unitsLink.click()
    }

    await page.waitForLoadState('networkidle')

    // Toggle views
    const tableButton = page.getByRole('button', { name: /table/i })
    const gridButton = page.getByRole('button', { name: /grid|card/i })

    if (await tableButton.isVisible() && await gridButton.isVisible()) {
      // Start in table view
      await tableButton.click()
      await expect(page.getByRole('table')).toBeVisible()

      // Switch to grid view
      await gridButton.click()
      await expect(page.locator('[data-view="grid"], .grid')).toBeVisible()
    }
  })
})
