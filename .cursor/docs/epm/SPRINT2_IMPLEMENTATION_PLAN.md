# Sprint 2 — Detailed Implementation Plan

**Created:** 2026-01-04
**Sprint Duration:** Week 3-4
**Total Story Points:** 24 (EPM-22: 8, EPM-23: 8, EPM-25: 8)

---

## Overview

Sprint 2 focuses on the lease lifecycle management features:
1. **EPM-22**: Lease Expiration Tracking - Dashboard widget + list improvements
2. **EPM-23**: Lease Renewal Workflow - Create renewal from existing lease
3. **EPM-25**: Tenant Detail Page - Wire to API and add missing sections

---

## EPM-22: Lease Expiration Tracking (8 pts)

### Goal
Surface leases expiring in 30/60/90 days on the dashboard and enable quick action to renew.

### Current State Analysis

**Backend ✅ Complete:**
- `getExpiringLeases()` in `leases.api.ts:226-259` already returns:
  ```typescript
  {
    within30Days: Lease[],
    within60Days: Lease[],
    within90Days: Lease[]
  }
  ```
- Each lease includes `unit`, `property`, and `tenant` data

**Frontend ⚠️ Not Started:**
- Dashboard (`app.dashboard.tsx`) uses static mock data
- Lease list (`app.leases.index.tsx`) likely uses mock data
- No expiration widget component exists

### Implementation Tasks

#### Task 1: Create Expiring Leases Widget Component
**File:** `src/components/dashboard/expiring-leases-widget.tsx`

```typescript
// Component structure:
interface ExpiringLeasesWidgetProps {}

// Features:
- Fetch data using useQuery(expiringLeasesQueryOptions())
- Display 3 tabs/sections: <30 days (red), 30-60 (yellow), 60-90 (gray)
- Each lease item shows:
  - Tenant name
  - Unit/Property
  - Days until expiration
  - "Renew" quick action button
- Loading skeleton
- Empty state ("No leases expiring soon")
- Link to full lease list with filter
```

**Acceptance Criteria:**
- [ ] Widget fetches data from API
- [ ] Shows count badges for each time bucket
- [ ] Color-coded urgency (red/yellow/gray)
- [ ] "Renew" button navigates to renewal flow
- [ ] Clicking lease navigates to lease detail

#### Task 2: Add Widget to Dashboard
**File:** `src/routes/app.dashboard.tsx`

**Changes:**
1. Import the new widget component
2. Replace static "Urgent Items" card with live expiring leases widget
3. Update stats card "Active Tenants" to show actual expiring count

**Acceptance Criteria:**
- [ ] Widget appears on dashboard
- [ ] Data is live from API
- [ ] Navigation to leases works

#### Task 3: Wire Lease List to API
**File:** `src/routes/app.leases.index.tsx`

**Current State:** Needs to be checked if using mock data

**Changes:**
1. Replace mock data with `leasesQueryOptions()` API call
2. Add expiration badges to table rows
3. Add expiration filter dropdown
4. Add loading/empty states

**Acceptance Criteria:**
- [ ] Lease list populated from database
- [ ] Expiration badges show correctly
- [ ] Filter by expiring status works

### Files to Create/Modify
```
CREATE: src/components/dashboard/expiring-leases-widget.tsx
MODIFY: src/routes/app.dashboard.tsx
MODIFY: src/routes/app.leases.index.tsx
```

### Estimated Time: 4-6 hours

---

## EPM-23: Lease Renewal Workflow (8 pts)

### Goal
Enable creating a new lease from an expiring one, with pre-populated terms and tracking.

### Current State Analysis

**Database ⚠️ Needs Migration:**
- Missing `renewed_from_lease_id` column on `pm_leases` table
- This links new lease to the one it's renewing

**Backend ⚠️ Needs New Service:**
- No `lease-renewals.api.ts` exists
- Need endpoints for renewal workflow

**Frontend ⚠️ Not Started:**
- No "Renew" button action implemented
- No renewal wizard exists

### Implementation Tasks

#### Task 1: Database Migration
**File:** `supabase/migrations/00X_leases_renewal_link.sql`

```sql
-- Add renewal tracking
ALTER TABLE pm_leases
  ADD COLUMN IF NOT EXISTS renewed_from_lease_id UUID REFERENCES pm_leases(id);

CREATE INDEX IF NOT EXISTS idx_leases_renewed_from
  ON pm_leases(renewed_from_lease_id);

-- Add renewal status enum values if not present
-- (check if enum already supports RENEWED status)
```

**Prisma Update:** `prisma/schema.prisma`
```prisma
model Lease {
  // ... existing fields
  renewedFromLeaseId String? @db.Uuid
  renewedFromLease   Lease?  @relation("LeaseRenewal", fields: [renewedFromLeaseId], references: [id])
  renewedTo          Lease?  @relation("LeaseRenewal")
}
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Prisma schema updated
- [ ] `npx prisma generate` works

#### Task 2: Create Lease Renewals API
**File:** `src/services/lease-renewals.api.ts`

```typescript
// Endpoints:
createLeaseRenewalFromLease(leaseId: string, newTerms: {
  startDate: Date
  endDate: Date
  monthlyRent: number
  rentIncrease?: number // percentage
}) -> Lease (DRAFT status)

// Logic:
1. Fetch original lease with all relationships
2. Validate original lease is ACTIVE and expiring
3. Create new lease with:
   - Same unitId, tenantId
   - Same addenda (copy references)
   - New dates and rent
   - renewedFromLeaseId = original lease id
   - status = DRAFT
4. Return new lease
```

**File:** `src/services/lease-renewals.schema.ts`
```typescript
export const createRenewalSchema = z.object({
  leaseId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.number().positive(),
  rentIncreasePercent: z.number().min(0).max(100).optional(),
})
```

**File:** `src/services/lease-renewals.query.ts`
```typescript
export const useCreateLeaseRenewal = () => { ... }
```

**Acceptance Criteria:**
- [ ] API creates DRAFT lease linked to original
- [ ] Original lease not modified
- [ ] Co-tenants and addenda preserved
- [ ] Proper error handling for invalid states

#### Task 3: Create Renewal UI
**File:** `src/components/leases/renewal-wizard.tsx`

**Features:**
1. Dialog/modal or page for renewal
2. Shows current lease terms (read-only summary)
3. Editable fields:
   - New start date (default: day after current end)
   - Duration (12/24/6/month-to-month)
   - New monthly rent
   - Rent increase percentage display
4. "Create Renewal" button → creates DRAFT lease
5. Navigate to new lease detail on success

**Acceptance Criteria:**
- [ ] Pre-populated from existing lease
- [ ] Shows rent increase calculation
- [ ] Creates DRAFT lease
- [ ] Success toast and navigation

#### Task 4: Add Renew Button to UI
**Locations to update:**
- `app.leases.$leaseId.tsx` - "Renew Lease" button (exists, wire up)
- `expiring-leases-widget.tsx` - Quick action button
- `app.tenants.$tenantId.tsx` - "Renew Lease" quick action

**Acceptance Criteria:**
- [ ] Renew button opens renewal wizard
- [ ] Only shows for ACTIVE leases
- [ ] Available from multiple entry points

### Files to Create/Modify
```
CREATE: supabase/migrations/00X_leases_renewal_link.sql
MODIFY: prisma/schema.prisma
CREATE: src/services/lease-renewals.api.ts
CREATE: src/services/lease-renewals.schema.ts
CREATE: src/services/lease-renewals.query.ts
CREATE: src/components/leases/renewal-wizard.tsx
MODIFY: src/routes/app.leases.$leaseId.tsx
MODIFY: src/components/dashboard/expiring-leases-widget.tsx
```

### Estimated Time: 8-10 hours

---

## EPM-25: Tenant Detail Page (8 pts)

### Goal
Complete tenant detail page with live data from API, including all sections.

### Current State Analysis

**Backend ✅ Complete:**
- `getTenant(id)` in `tenants.api.ts:92-139` returns:
  - Full tenant record
  - Related leases (with unit and property)
  - Pets
  - Payments (last 20)
  - Maintenance requests (last 10)
  - Documents

**Frontend ⚠️ Uses Mock Data:**
- `app.tenants.$tenantId.tsx` has full UI layout
- Uses hardcoded mock data
- All sections need to be wired to API

### Implementation Tasks

#### Task 1: Wire Page to API
**File:** `src/routes/app.tenants.$tenantId.tsx`

**Changes:**
1. Add route loader to fetch tenant data:
   ```typescript
   export const Route = createFileRoute('/app/tenants/$tenantId')({
     loader: ({ params }) => tenantQueryOptions(params.tenantId),
     component: TenantDetailPage,
   })
   ```
2. Use `useSuspenseQuery` or `useLoaderData` to get tenant
3. Remove all mock data constants
4. Map API response to UI sections

**Sections to wire:**
- Contact information
- Emergency contact
- Lease details (from tenant.leases[0])
- Payment history (from tenant.payments)
- Maintenance requests (from tenant.maintenanceRequests)
- Pet information (from tenant.pets)
- Documents (from tenant.documents)

**Acceptance Criteria:**
- [ ] Page loads tenant from API
- [ ] Loading state while fetching
- [ ] Error state if tenant not found
- [ ] All sections show real data

#### Task 2: Add Edit Functionality
**File:** `src/routes/app.tenants.$tenantId.tsx`

**Changes:**
1. Add "Edit" button in header
2. Create inline edit form or navigate to edit page
3. Wire to `useUpdateTenant` mutation

**Acceptance Criteria:**
- [ ] Can edit basic tenant info
- [ ] Changes persist to database
- [ ] Success toast on save

#### Task 3: Add Quick Actions
**Currently in UI but not functional:**
- "Send Message" - Link to communications
- "Record Payment" - Open payment dialog or navigate
- "Create Work Order" - Navigate to maintenance/new
- "Renew Lease" - Open renewal wizard (from EPM-23)

**Acceptance Criteria:**
- [ ] All quick action buttons work
- [ ] Proper navigation/modals

#### Task 4: Status Cards with Live Data
**Current:** Static badges

**Changes:**
- Payment Status: Calculate from payments array (any overdue?)
- Compliance: Check for violations (future feature, keep as placeholder)
- Lease Status: Calculate from active lease end date

**Acceptance Criteria:**
- [ ] Payment status reflects actual data
- [ ] Lease expiration badge accurate

### Files to Modify
```
MODIFY: src/routes/app.tenants.$tenantId.tsx
```

### Estimated Time: 6-8 hours

---

## Implementation Order

### Day 1-2: EPM-25 (Tenant Detail)
**Rationale:** No dependencies, can start immediately

1. Wire tenant detail page to API
2. Test all sections with real data
3. Add edit functionality

### Day 3-4: EPM-22 (Expiration Tracking)
**Rationale:** Backend ready, widget is standalone

1. Create expiring leases widget
2. Add to dashboard
3. Wire lease list to API

### Day 5-6: EPM-23 (Lease Renewal)
**Rationale:** Needs DB migration, more complex

1. Create and run migration
2. Update Prisma schema
3. Create renewal API
4. Create renewal wizard UI
5. Wire up renew buttons

---

## Testing Plan

### EPM-22 Tests
- [ ] Widget shows correct counts per bucket
- [ ] Navigation to lease detail works
- [ ] Renew button works
- [ ] Empty state shows when no expiring leases

### EPM-23 Tests
- [ ] Migration runs without errors
- [ ] Renewal creates DRAFT lease
- [ ] Link to original lease saved
- [ ] Terms pre-populated correctly
- [ ] Original lease unchanged

### EPM-25 Tests
- [ ] Page loads with real tenant data
- [ ] All sections display correctly
- [ ] Edit saves to database
- [ ] 404 for non-existent tenant
- [ ] Quick actions navigate correctly

---

## Dependencies

### Must Be Done First
- ✅ Sprint 1 complete (tenant/lease CRUD working)

### Parallel Work Possible
- EPM-25 can start immediately
- EPM-22 can start after widget is planned
- EPM-23 should be last (needs migration)

### External Dependencies
- Database access for migration
- Supabase storage for documents (if showing in tenant detail)

---

## Risk Assessment

### Low Risk
- **EPM-25**: Just wiring existing UI to existing API
- **EPM-22**: Backend already complete, widget is straightforward

### Medium Risk
- **EPM-23**: Database migration + new API + new UI
  - Mitigation: Test migration in development first
  - Mitigation: Keep renewal simple (no co-tenant editing in v1)

---

## Definition of Done

### Per Feature
- [ ] Code complete and committed
- [ ] TypeScript compiles without errors
- [ ] Manual testing complete
- [ ] UI matches existing design patterns
- [ ] API returns expected data
- [ ] Error states handled

### Sprint Complete
- [ ] All 3 EPM issues done
- [ ] Checklist updated
- [ ] Documentation updated
- [ ] Committed and pushed
