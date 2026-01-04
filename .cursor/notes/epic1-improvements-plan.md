# Epic 1 Improvements Plan

**Created:** January 4, 2026
**Completed:** January 4, 2026
**Priority:** Optional enhancements after core Epic 1 completion
**Status:** ✅ ALL IMPROVEMENTS IMPLEMENTED

---

## Overview

These improvements enhance Epic 1's quality, performance, and maintainability. They are organized by priority and effort level.

---

## Improvement 1: E2E Test Authentication Setup

**Priority:** High
**Effort:** Medium (2-3 hours)
**Files to modify:**
- `tests/e2e/auth.setup.ts` (create)
- `tests/e2e/properties.spec.ts`
- `playwright.config.ts`

### Problem
The authenticated E2E tests in `tests/e2e/properties.spec.ts` are currently skipped (`test.describe.skip`) because they require authentication setup.

### Solution
Implement Playwright's authentication state storage pattern:

1. **Create auth setup file** (`tests/e2e/auth.setup.ts`):
   ```typescript
   import { test as setup, expect } from '@playwright/test'

   const authFile = 'tests/.auth/user.json'

   setup('authenticate', async ({ page }) => {
     // Navigate to sign in
     await page.goto('/auth/sign-in')

     // Fill credentials (use test account)
     await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
     await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
     await page.getByRole('button', { name: /sign in/i }).click()

     // Wait for redirect to app
     await expect(page).toHaveURL(/\/app/)

     // Save auth state
     await page.context().storageState({ path: authFile })
   })
   ```

2. **Update playwright.config.ts**:
   ```typescript
   projects: [
     { name: 'setup', testMatch: /.*\.setup\.ts/ },
     {
       name: 'chromium',
       use: {
         ...devices['Desktop Chrome'],
         storageState: 'tests/.auth/user.json',
       },
       dependencies: ['setup'],
     },
   ]
   ```

3. **Enable skipped tests** - Remove `test.describe.skip` from properties.spec.ts

### Environment Setup
- Create `.env.test` with `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- Seed test user in database before E2E runs
- Add `tests/.auth/` to `.gitignore`

---

## Improvement 2: Tests for Edit Pages & Inline Editing

**Priority:** High
**Effort:** Medium (3-4 hours)
**Files to create:**
- `tests/e2e/properties-edit.spec.ts`
- `tests/e2e/units-edit.spec.ts`
- `tests/integration/inline-editing.test.ts`

### E2E Tests for Edit Pages

```typescript
// tests/e2e/properties-edit.spec.ts
test.describe('Property Editing', () => {
  test('can navigate to edit page from property detail', async ({ page }) => {
    await page.goto('/app/properties')
    await page.getByRole('link').first().click() // Click first property
    await page.getByRole('link', { name: /edit/i }).click()
    await expect(page).toHaveURL(/\/edit$/)
  })

  test('edit form is pre-populated with existing data', async ({ page }) => {
    await page.goto('/app/properties/[id]/edit')
    await expect(page.getByLabel(/property name/i)).not.toHaveValue('')
    await expect(page.getByLabel(/address/i)).not.toHaveValue('')
  })

  test('can update property name', async ({ page }) => {
    await page.goto('/app/properties/[id]/edit')
    await page.getByLabel(/property name/i).fill('Updated Property Name')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/updated successfully/i)).toBeVisible()
  })

  test('cancel returns to detail page without changes', async ({ page }) => {
    await page.goto('/app/properties/[id]/edit')
    const originalName = await page.getByLabel(/property name/i).inputValue()
    await page.getByLabel(/property name/i).fill('Changed Name')
    await page.getByRole('button', { name: /cancel/i }).click()
    // Navigate back to edit and verify original value
    await page.getByRole('link', { name: /edit/i }).click()
    await expect(page.getByLabel(/property name/i)).toHaveValue(originalName)
  })
})
```

### E2E Tests for Inline Table Editing

```typescript
// tests/e2e/inline-editing.spec.ts
test.describe('Inline Table Editing', () => {
  test('can edit property name inline in table', async ({ page }) => {
    await page.goto('/app/properties')

    // Double-click on name cell to edit
    const nameCell = page.getByRole('cell').filter({ hasText: /test property/i }).first()
    await nameCell.dblclick()

    // Input should appear
    const input = nameCell.getByRole('textbox')
    await expect(input).toBeVisible()

    // Change value and blur
    await input.fill('Renamed Property')
    await input.blur()

    // Should show success toast
    await expect(page.getByText(/updated successfully/i)).toBeVisible()
  })

  test('can change property status via dropdown', async ({ page }) => {
    await page.goto('/app/properties')

    // Click on status badge
    const statusBadge = page.getByRole('button').filter({ hasText: /active/i }).first()
    await statusBadge.click()

    // Select new status
    await page.getByRole('option', { name: /inactive/i }).click()

    // Should update
    await expect(page.getByText(/updated successfully/i)).toBeVisible()
  })

  test('can edit unit rent inline', async ({ page }) => {
    await page.goto('/app/properties/[id]/units')

    // Switch to table view if needed
    await page.getByRole('button', { name: /table/i }).click()

    // Click on rent cell
    const rentCell = page.getByRole('cell').filter({ hasText: /\$1,/ }).first()
    await rentCell.click()

    // Edit value
    const input = rentCell.getByRole('textbox')
    await input.fill('1500')
    await input.blur()

    await expect(page.getByText(/updated successfully/i)).toBeVisible()
  })

  test('reverts on API error', async ({ page }) => {
    // Mock API to fail
    await page.route('**/api/properties/*', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await page.goto('/app/properties')

    const nameCell = page.getByRole('cell').first()
    const originalValue = await nameCell.textContent()
    await nameCell.dblclick()

    const input = nameCell.getByRole('textbox')
    await input.fill('Will Fail')
    await input.blur()

    // Should show error and revert
    await expect(page.getByText(/failed to update/i)).toBeVisible()
    await expect(nameCell).toHaveText(originalValue!)
  })
})
```

---

## Improvement 3: Bulk Unit Delete

**Priority:** Medium
**Effort:** Low (1-2 hours)
**Files to modify:**
- `src/services/units.api.ts` - Add `bulkDeleteUnits` server function
- `src/services/units.schema.ts` - Add validation schema
- `src/services/units.query.ts` - Add mutation hook
- `src/routes/app.properties.$propertyId.units.tsx` - Wire up bulk actions

### Implementation

1. **Add schema** (`src/services/units.schema.ts`):
   ```typescript
   export const bulkDeleteUnitsSchema = z.object({
     ids: z.array(z.string().uuid()).min(1, 'Select at least one unit'),
   })
   ```

2. **Add server function** (`src/services/units.api.ts`):
   ```typescript
   export const bulkDeleteUnits = createServerFn({ method: 'POST' })
     .middleware([authedMiddleware])
     .validator(zodValidator(bulkDeleteUnitsSchema))
     .handler(async ({ context, data }) => {
       const { ids } = data

       // Verify all units belong to user's properties
       const units = await prisma.unit.findMany({
         where: {
           id: { in: ids },
           property: { managerId: context.auth.user.id },
         },
         select: { id: true },
       })

       if (units.length !== ids.length) {
         throw new Error('One or more units not found or not authorized')
       }

       // Check for active leases
       const unitsWithLeases = await prisma.unit.findMany({
         where: {
           id: { in: ids },
           leases: { some: { status: 'ACTIVE' } },
         },
       })

       if (unitsWithLeases.length > 0) {
         throw new Error(`Cannot delete ${unitsWithLeases.length} unit(s) with active leases`)
       }

       // Bulk delete
       await prisma.unit.deleteMany({
         where: { id: { in: ids } },
       })

       return { deletedCount: ids.length }
     })
   ```

3. **Add mutation hook** (`src/services/units.query.ts`):
   ```typescript
   export const useBulkDeleteUnits = () => {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: bulkDeleteUnits,
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: ['units'] })
         queryClient.invalidateQueries({ queryKey: ['properties'] }) // Update unit counts
       },
     })
   }
   ```

4. **Wire up in units list** (`src/routes/app.properties.$propertyId.units.tsx`):
   ```typescript
   // In table view, add row selection
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

   const bulkDelete = useBulkDeleteUnits()

   const handleBulkDelete = async (units: Unit[]) => {
     const ids = units.map(u => u.id)
     await bulkDelete.mutateAsync({ ids })
     toast.success(`Deleted ${units.length} unit(s)`)
     setRowSelection({})
   }

   // Add DataTableBulkActions component
   <DataTableBulkActions
     table={table}
     onDelete={handleBulkDelete}
   />
   ```

### UI Considerations
- Add confirmation dialog before bulk delete
- Show warning if any units have active leases
- Disable delete for units with active leases (greyed out checkbox)

---

## Improvement 4: Optimistic Updates

**Priority:** Low
**Effort:** Medium (2-3 hours)
**Files to modify:**
- `src/routes/app.properties.index.tsx`
- `src/routes/app.properties.$propertyId.units.tsx`
- `src/components/ui/data-table/data-table-editable-cell.tsx`

### Current Behavior
Updates wait for API response before reflecting in UI. User sees loading spinner during save.

### Proposed Behavior
UI updates immediately, reverts on error. Provides faster perceived performance.

### Implementation Pattern

1. **Update mutation with optimistic updates**:
   ```typescript
   const updateProperty = useMutation({
     mutationFn: async (data: UpdatePropertyInput) => {
       return updatePropertyApi(data)
     },
     onMutate: async (newData) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries({ queryKey: ['properties'] })

       // Snapshot previous value
       const previousProperties = queryClient.getQueryData(['properties'])

       // Optimistically update
       queryClient.setQueryData(['properties'], (old: Property[]) =>
         old.map(p => p.id === newData.id ? { ...p, ...newData } : p)
       )

       return { previousProperties }
     },
     onError: (err, newData, context) => {
       // Rollback on error
       queryClient.setQueryData(['properties'], context?.previousProperties)
       toast.error('Update failed. Changes reverted.')
     },
     onSettled: () => {
       // Refetch to ensure consistency
       queryClient.invalidateQueries({ queryKey: ['properties'] })
     },
   })
   ```

2. **Update EditableCell component**:
   - Remove loading spinner (optimistic means instant)
   - Add subtle "syncing" indicator instead
   - Flash error state briefly on revert

3. **Considerations**:
   - Only use for simple field updates (name, status, rent)
   - Keep server-side validation as source of truth
   - Add visual feedback for sync state (subtle icon or border)

---

## Implementation Order

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| 1 | E2E Auth Setup | Medium | Enables all E2E tests |
| 2 | Edit Page Tests | Medium | Ensures quality |
| 3 | Bulk Unit Delete | Low | User productivity |
| 4 | Optimistic Updates | Medium | UX polish |

### Recommended Approach
1. Start with E2E Auth Setup - unlocks all other E2E testing
2. Add Edit Page & Inline Editing tests
3. Implement Bulk Unit Delete (high ROI, low effort)
4. Add Optimistic Updates last (polish, not critical)

---

## Success Criteria

- [x] All E2E tests pass with authentication
- [x] Edit pages have >80% test coverage
- [x] Inline editing has E2E tests for all editable columns
- [x] Bulk delete works for up to 100 units at once
- [x] Optimistic updates feel instant (<50ms perceived)
- [x] Error states gracefully revert with user feedback
