# Epic 2 — Implementation Checklist

**Last Updated:** 2026-01-04
**Branch:** `claude/review-epic-2-planning-bVVzm`

Use this checklist to track implementation progress for Epic 2: Tenant Management & Leasing.

---

## Quick Status Overview

| Issue | Backend | Frontend | Tests | Status |
|-------|---------|----------|-------|--------|
| EPM-21: Tenant Profile | ✅ | 🔶 | ⬜ | In Progress |
| EPM-24: Tenant List | ✅ | 🔶 | ⬜ | In Progress |
| EPM-20: Create Lease | ✅ | 🔶 | ⬜ | In Progress |
| EPM-22: Expiration Tracking | ✅ | ⬜ | ⬜ | Not Started |
| EPM-23: Lease Renewal | ⬜ | ⬜ | ⬜ | Not Started |
| EPM-25: Tenant Detail | ✅ | ⬜ | ⬜ | Not Started |
| EPM-26: Pet Application | ⬜ | ⬜ | ⬜ | Not Started |
| EPM-27: Move-In Inspection | ⬜ | ⬜ | ⬜ | Not Started |
| EPM-28: Move-Out Process | ⬜ | ⬜ | ⬜ | Not Started |

**Legend:** ✅ Complete | 🔶 Partial | ⬜ Not Started

---

## Database Migrations Needed

- [ ] **`00X_leases_renewal_link.sql`** - Add `renewed_from_lease_id` column to leases
- [ ] **`00X_move_out_damage_items.sql`** - Create damage items table
- [ ] **`00X_deposit_disposition_letters.sql`** - Create disposition letters table
- [ ] Update `prisma/schema.prisma` with new models

---

## EPM-21: Tenant Profile Creation (8 pts)

### Backend ✅
- [x] `src/services/tenants.api.ts` - CRUD operations
- [x] `src/services/tenants.schema.ts` - Zod schemas
- [x] `src/services/tenants.query.ts` - React Query hooks
- [ ] Add audit logging to create/update
- [ ] Add better error codes for validation failures

### Frontend 🔶
- [x] `src/routes/app.tenants.new.tsx` - Form shell exists
- [ ] Wire form to `useCreateTenant` mutation
- [ ] Use TanStack Form with `createTenantSchema`
- [ ] Add property/unit dropdown with live API data
- [ ] Add co-tenant dynamic form section
- [ ] Add employment info collapsible section
- [ ] Add vehicle info collapsible section
- [ ] Add SSN input with masking
- [ ] Add success toast on creation
- [ ] Navigate to tenant detail on success
- [ ] Add form draft persistence (localStorage)

### Tests
- [ ] Unit: Email uniqueness validation
- [ ] Unit: Required field validation
- [ ] Integration: Create tenant flow
- [ ] E2E: Full tenant creation journey

---

## EPM-24: Tenant List & Search (5 pts)

### Backend ✅
- [x] `getTenants` with filters
- [x] Search by name/email/phone
- [x] Status filter
- [x] Pagination
- [ ] Add property filter (via lease/unit join)
- [ ] Add CSV export endpoint

### Frontend 🔶
- [x] `src/routes/app.tenants.index.tsx` - Data table exists
- [x] Column definitions
- [x] Search UI
- [x] Filter dropdowns
- [ ] Replace mock data with API call (`tenantsQueryOptions`)
- [ ] Wire search input to filter param
- [ ] Wire property filter to API
- [ ] Add loading skeleton
- [ ] Add empty state component
- [ ] Wire inline editing to `useUpdateTenant`
- [ ] Wire CSV export button

### Tests
- [ ] Unit: Filter combinations
- [ ] Integration: List with real data
- [ ] E2E: Search and filter flow

---

## EPM-20: Create New Lease Agreement (13 pts)

### Backend ✅
- [x] `src/services/leases.api.ts` - CRUD operations
- [x] `src/services/leases.schema.ts` - Zod schemas
- [x] `src/services/leases.query.ts` - React Query hooks
- [x] Overlap validation implemented
- [x] Lease number auto-generation
- [ ] Add status transition validation
- [ ] Add co-tenant connection (LeaseTenant creation)
- [ ] Add addenda connection (LeaseAddendum creation)
- [ ] Add `finalizeLease` endpoint (DRAFT → PENDING_SIGNATURE)
- [ ] Integrate document generation (EPM-43)

### Frontend 🔶
- [x] `src/routes/app.leases.new.tsx` - Multi-step form shell
- [x] Template selection UI
- [x] Addenda selection UI
- [x] Progress steps UI
- [ ] Wire property dropdown to `propertiesQueryOptions`
- [ ] Wire unit dropdown to `unitsQueryOptions` (filtered by property)
- [ ] Wire tenant dropdown to `tenantsQueryOptions`
- [ ] Add "Create New Tenant" inline option
- [ ] Wire form to `useCreateLease` mutation
- [ ] Add date validation (startDate < endDate)
- [ ] Add overlap check before submit
- [ ] Implement multi-step state management
- [ ] Add form persistence between steps
- [ ] Wire template selection to API
- [ ] Wire addenda multi-select to API
- [ ] Add review step with summary
- [ ] Trigger document generation on finalization

### Tests
- [ ] Unit: Date validation
- [ ] Unit: Overlap detection
- [ ] Integration: Full lease creation
- [ ] E2E: Multi-step wizard flow

---

## EPM-22: Lease Expiration Tracking (8 pts)

### Backend ✅
- [x] `getExpiringLeases` returns grouped buckets (30/60/90 days)
- [ ] Add notification trigger integration (EPM-6)

### Frontend ⬜
- [ ] Create `src/components/dashboard/expiring-leases-widget.tsx`
- [ ] Add widget to dashboard
- [ ] Wire `src/routes/app.leases.index.tsx` to API (replace mock)
- [ ] Add expiration badges with color coding
- [ ] Add "Renew" quick action button
- [ ] Add expiration date filter

### Tests
- [ ] Unit: Date bucket logic
- [ ] Integration: Widget data loading
- [ ] E2E: Dashboard widget interaction

---

## EPM-23: Lease Renewal Workflow (8 pts)

### Database ⬜
- [ ] Create migration `00X_leases_renewal_link.sql`
- [ ] Update Prisma schema with `renewedFromLeaseId`

### Backend ⬜
- [ ] Create `src/services/lease-renewals.api.ts`
  - [ ] `createLeaseRenewalFromLease(leaseId, newTerms)`
  - [ ] `finalizeLeaseRenewal(leaseId)`
- [ ] Create `src/services/lease-renewals.schema.ts`
  - [ ] `createLeaseRenewalFromLeaseSchema`
  - [ ] `finalizeLeaseRenewalSchema`
- [ ] Create `src/services/lease-renewals.query.ts`

### Frontend ⬜
- [ ] Add "Renew Lease" button on lease detail
- [ ] Create `src/components/leases/renewal-wizard.tsx`
- [ ] Pre-populate form with current lease terms
- [ ] Allow adjustment of rent, dates
- [ ] Show rent increase calculation
- [ ] Add renewal history section on lease detail

### Tests
- [ ] Unit: Renewal linking
- [ ] Integration: Full renewal flow
- [ ] E2E: Renew from expiring lease

---

## EPM-25: Tenant Detail Page (8 pts)

### Backend ✅
- [x] `getTenant` includes related data

### Frontend ⬜
- [ ] Wire `src/routes/app.tenants.$tenantId.tsx` to API
- [ ] Create overview section (editable inline)
- [ ] Create active lease section
- [ ] Create payment history table
- [ ] Create maintenance requests section
- [ ] Create documents section
- [ ] Create pets section
- [ ] Create communication log section
- [ ] Add loading skeleton
- [ ] Add error state

### Tests
- [ ] Unit: Component rendering
- [ ] Integration: Data loading
- [ ] E2E: Navigation and actions

---

## EPM-26: Pet Application & Approval (8 pts)

### Backend ⬜
- [ ] Create `src/services/pets.api.ts`
  - [ ] `getPets(tenantId)`
  - [ ] `getPet(id)`
  - [ ] `createPet(tenantId, data)`
  - [ ] `updatePet(id, data)`
  - [ ] `approvePet(id)`
  - [ ] `denyPet(id, reason)`
  - [ ] `removePet(id)`
- [ ] Create `src/services/pets.schema.ts`
  - [ ] `petStatusEnum`
  - [ ] `petTypeEnum`
  - [ ] `createPetSchema`
  - [ ] `updatePetSchema`
  - [ ] `approvePetSchema`
  - [ ] `denyPetSchema`
- [ ] Create `src/services/pets.query.ts`
- [ ] Add vaccination document upload (Supabase Storage)
- [ ] Add pet addendum generation on approval

### Frontend ⬜
- [ ] Create pet application form component
- [ ] Create pet approval workflow UI
- [ ] Add pets section to tenant detail page
- [ ] Create pending applications queue view
- [ ] Add photo upload component
- [ ] Add approve/deny dialogs

### Tests
- [ ] Unit: Status transitions
- [ ] Integration: Approval workflow
- [ ] E2E: Full pet application flow

---

## EPM-27: Move-In Inspection (8 pts)

### Backend ⬜
- [ ] Create `src/services/inspections.api.ts`
  - [ ] `createInspection(propertyId, leaseId, type, scheduledDate)`
  - [ ] `getInspections(filters)`
  - [ ] `getInspection(id)`
  - [ ] `addInspectionItem(inspectionId, item)`
  - [ ] `updateInspectionItem(itemId, data)`
  - [ ] `deleteInspectionItem(itemId)`
  - [ ] `completeInspection(id, signature)`
  - [ ] `generateInspectionReport(id)`
- [ ] Create `src/services/inspections.schema.ts`
  - [ ] `inspectionTypeEnum`
  - [ ] `inspectionStatusEnum`
  - [ ] `conditionEnum`
  - [ ] `createInspectionSchema`
  - [ ] `addInspectionItemSchema`
  - [ ] `updateInspectionItemSchema`
- [ ] Create `src/services/inspections.query.ts`
- [ ] Add photo upload to Supabase Storage
- [ ] Add signature capture
- [ ] Add PDF report generation

### Frontend ⬜
- [ ] Create `src/routes/app.inspections.tsx` (list)
- [ ] Create `src/routes/app.inspections.$inspectionId.tsx` (detail)
- [ ] Create `src/routes/app.inspections.new.tsx` (create)
- [ ] Create inspection form wizard
- [ ] Create room-by-room checklist
- [ ] Create condition rating component
- [ ] Create photo upload component
- [ ] Create signature capture component
- [ ] Add inspection section to lease detail

### Tests
- [ ] Unit: Item condition validation
- [ ] Integration: Full inspection flow
- [ ] E2E: Room-by-room workflow

---

## EPM-28: Move-Out Process (13 pts)

### Database ⬜
- [ ] Create migration `00X_move_out_damage_items.sql`
- [ ] Create migration `00X_deposit_disposition_letters.sql`
- [ ] Update Prisma schema with new models

### Backend ⬜
- [ ] Create `src/services/move-out.api.ts`
  - [ ] `createMoveOutInspection(leaseId)`
  - [ ] `recordMoveOutDamages(inspectionId, items)`
  - [ ] `compareMoveInMoveOut(leaseId)`
  - [ ] `calculateDepositDisposition(leaseId)`
  - [ ] `generateDepositDispositionLetter(leaseId)`
  - [ ] `sendDepositDispositionLetter(letterId)`
  - [ ] `processDepositRefund(leaseId, amount)`
- [ ] Create `src/services/move-out.schema.ts`
  - [ ] `damageLineItemSchema`
  - [ ] `recordMoveOutDamagesSchema`
  - [ ] `depositDispositionSchema`
- [ ] Create `src/services/move-out.query.ts`
- [ ] Implement MN compliance rules
  - [ ] 21-day deadline tracking
  - [ ] 1% annual interest calculation
  - [ ] Required disclosure language
- [ ] Add PDF generation for disposition letter
- [ ] Add email sending via EPM-4 integration

### Frontend ⬜
- [ ] Create `src/routes/app.move-out.$leaseId.tsx`
- [ ] Create move-out wizard component
  - [ ] Step 1: Schedule inspection
  - [ ] Step 2: Conduct inspection
  - [ ] Step 3: Record damages
  - [ ] Step 4: Calculate disposition
  - [ ] Step 5: Generate letter
  - [ ] Step 6: Process refund
- [ ] Create damage comparison view
- [ ] Create damage line item form
- [ ] Create disposition calculator
- [ ] Create letter preview component
- [ ] Add compliance warnings (deadline, missing info)

### Tests
- [ ] Unit: Interest calculation
- [ ] Unit: Deadline calculation
- [ ] Integration: Full move-out flow
- [ ] E2E: Complete process with letter generation

---

## Implementation Priority Order

### Sprint 1: Foundation (Week 1-2)
1. [ ] EPM-21: Wire tenant create form to API
2. [ ] EPM-24: Replace tenant list mock data with API
3. [ ] EPM-20: Complete lease creation wizard

### Sprint 2: Lease Lifecycle (Week 3-4)
4. [ ] EPM-22: Expiration tracking dashboard widget
5. [ ] EPM-23: Lease renewal workflow (requires migration)
6. [ ] EPM-25: Complete tenant detail page

### Sprint 3: Pet & Inspections (Week 5-6)
7. [ ] EPM-26: Full pet service layer + UI
8. [ ] EPM-27: Full inspection service layer + UI

### Sprint 4: Move-Out (Week 7-8)
9. [ ] EPM-28: Full move-out process (requires migrations)

---

## Files Created/Modified Summary

### New Service Files Needed
```
src/services/pets.api.ts
src/services/pets.schema.ts
src/services/pets.query.ts
src/services/inspections.api.ts
src/services/inspections.schema.ts
src/services/inspections.query.ts
src/services/lease-renewals.api.ts
src/services/lease-renewals.schema.ts
src/services/lease-renewals.query.ts
src/services/move-out.api.ts
src/services/move-out.schema.ts
src/services/move-out.query.ts
```

### New Routes Needed
```
src/routes/app.pets.tsx
src/routes/app.inspections.tsx
src/routes/app.inspections.$inspectionId.tsx
src/routes/app.inspections.new.tsx
src/routes/app.move-out.$leaseId.tsx
```

### Routes to Modify
```
src/routes/app.tenants.index.tsx      # Replace mock data
src/routes/app.tenants.new.tsx        # Wire to API
src/routes/app.tenants.$tenantId.tsx  # Complete implementation
src/routes/app.leases.index.tsx       # Replace mock data
src/routes/app.leases.new.tsx         # Complete wizard
src/routes/app.leases.$leaseId.tsx    # Add renewal, inspections
src/routes/app.dashboard.tsx          # Add expiring widget
```

### New Components Needed
```
src/components/dashboard/expiring-leases-widget.tsx
src/components/forms/tenant-form.tsx
src/components/leases/renewal-wizard.tsx
src/components/pets/pet-application-form.tsx
src/components/pets/pet-card.tsx
src/components/pets/pet-approval-dialog.tsx
src/components/inspections/inspection-form.tsx
src/components/inspections/room-checklist.tsx
src/components/inspections/condition-rating.tsx
src/components/inspections/photo-upload.tsx
src/components/inspections/signature-capture.tsx
src/components/move-out/move-out-wizard.tsx
src/components/move-out/damage-comparison.tsx
src/components/move-out/damage-line-item.tsx
src/components/move-out/disposition-calculator.tsx
src/components/move-out/disposition-letter-preview.tsx
src/components/move-out/compliance-warnings.tsx
```

### Database Migrations Needed
```
supabase/migrations/00X_leases_renewal_link.sql
supabase/migrations/00X_move_out_damage_items.sql
supabase/migrations/00X_deposit_disposition_letters.sql
```

---

## Notes

### MN Compliance Requirements (Critical for Move-Out)
- 21-day deadline for security deposit disposition
- 1% annual simple interest on deposits
- Required disclosures: bank name, itemized deductions
- Certified mail recommended for disposition letter

### Tech Stack Reminders
- Forms: TanStack Form with Zod validation
- Data fetching: TanStack Query with server functions
- File uploads: Supabase Storage (documents/media buckets)
- PDFs: React-PDF for generation
- Email: Resend/Nodemailer via EPM-4

### Testing Approach
- Unit: Vitest for service/schema/component logic
- Integration: React Testing Library for connected components
- E2E: Playwright for full user journeys
