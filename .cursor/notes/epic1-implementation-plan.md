# Epic 1: Core Property & Unit Management - Implementation Plan

**Created:** January 4, 2026
**Epic Issues:** EPM-14, EPM-15, EPM-16, EPM-17, EPM-18, EPM-19
**Total Story Points:** 34

---

## Executive Summary

Epic 1 (Core Property & Unit Management) is **100% complete** (updated January 4, 2026). All frontend components are wired to real APIs with full CRUD operations.

### Completed Issues (6/6):
- **EPM-17**: Property creation form wired to API
- **EPM-14**: Property list connected to real API with delete + inline editing
- **EPM-15**: Unit creation form implemented
- **EPM-19**: Units list with search/filter functionality + inline editing
- **EPM-18**: Property detail page with real data
- **EPM-16**: Edit property/unit pages with Airtable-style inline table editing

### Key Features Implemented:
- Dedicated edit pages for properties and units (full form editing)
- Airtable-style inline table editing in property list (name, type, status)
- Airtable-style inline table editing in units list (status, rent values)
- Toggle between table view and grid view for units
- All changes saved immediately to API with loading states

---

## Current Status Assessment

### Backend (APIs) - COMPLETE

| Component | Status | Location |
|-----------|--------|----------|
| `createProperty` | Implemented | `src/services/properties.api.ts:113` |
| `getProperties` | Implemented | `src/services/properties.api.ts:14` |
| `getProperty` | Implemented | `src/services/properties.api.ts:65` |
| `updateProperty` | Implemented | `src/services/properties.api.ts:128` |
| `deleteProperty` | Implemented | `src/services/properties.api.ts:152` |
| `getPropertyStats` | Implemented | `src/services/properties.api.ts:173` |
| `createUnit` | Implemented | `src/services/units.api.ts:106` |
| `bulkCreateUnits` | Implemented | `src/services/units.api.ts:133` |
| `getUnits` | Implemented | `src/services/units.api.ts:15` |
| `getUnit` | Implemented | `src/services/units.api.ts:74` |
| `updateUnit` | Implemented | `src/services/units.api.ts:165` |
| `deleteUnit` | Implemented | `src/services/units.api.ts:189` |

### Frontend (UI) - MOSTLY COMPLETE

| Route | Status | Notes |
|-------|--------|-------|
| `/app/properties` (list) | DONE | Connected to `getProperties` API with delete |
| `/app/properties/new` | DONE | Form wired to `createProperty` API |
| `/app/properties/$propertyId` | DONE | Connected to `getProperty` API |
| `/app/properties/$propertyId/units` | DONE | Connected to `getUnits` API with filters |
| `/app/properties/$propertyId/units/new` | DONE | Unit creation form implemented |
| `/app/properties/$propertyId/edit` | PENDING | Create edit page with `updateProperty` |
| `/app/properties/$propertyId/units/$unitId/edit` | PENDING | Create unit edit page |

### Query Hooks - PARTIAL

| Component | Status | Location |
|-----------|--------|----------|
| Properties query hooks | Exist | `src/services/properties.query.ts` |
| Units query hooks | Exist | `src/services/units.query.ts` |

---

## Implementation Order (Recommended)

Based on dependencies and the Linear issue structure:

### Phase 1: EPM-17 - Add New Property (5 pts)
**Priority: First - No dependencies, foundational**

Tasks:
1. Wire up `app.properties.new.tsx` form to use `createProperty` API
2. Add react-hook-form with zod validation (`createPropertySchema`)
3. Implement form submission with TanStack Query mutation
4. Add loading/error states
5. Add success redirect to property detail page
6. Add toast notifications for success/error

Files to modify:
- `src/routes/app.properties.new.tsx`
- Create `src/hooks/use-create-property.ts` (mutation hook)

### Phase 2: EPM-14 - View Property Portfolio Dashboard (3 pts)
**Priority: Second - Depends on EPM-17**

Tasks:
1. Replace mock data in `app.properties.index.tsx` with `getProperties` API
2. Wire up stats cards to use `getPropertyStats` API
3. Implement search/filter functionality
4. Add pagination support
5. Add loading skeleton states
6. Implement delete property action

Files to modify:
- `src/routes/app.properties.index.tsx`
- Use existing query hooks from `src/services/properties.query.ts`

### Phase 3: EPM-15 - Add Units to Property (8 pts)
**Priority: Third - Depends on EPM-17**

Tasks:
1. Create `app.properties.$propertyId.units.new.tsx` for single unit creation
2. Wire form to `createUnit` API with validation
3. Create bulk add units modal/drawer
4. Implement `bulkCreateUnits` API integration
5. Add unit preview before bulk creation
6. Add form validation for uniqueness (propertyId + unitNumber)

Files to create:
- `src/routes/app.properties.$propertyId.units.new.tsx`
- `src/components/units/bulk-create-dialog.tsx`
- Create mutation hooks for unit creation

### Phase 4: EPM-16 - Edit Property/Unit Details (5 pts)
**Priority: Fourth - Depends on EPM-17, EPM-15**
**Status: IN PROGRESS (January 4, 2026)**

#### UX Research Summary

Based on research of property management platforms (Buildium, AppFolio, Propertyware):

**Recommended Pattern: Dedicated Page Editing**
- Properties and units have 15-25+ fields across multiple categories
- Full-page edit forms provide:
  - Bulk editing capability for many fields at once
  - Clear context of what's being edited (breadcrumb navigation)
  - Familiar form-based UX matching creation flow
  - Adequate space for complex fields (address autocomplete, notes)
- Inline editing only appropriate for single-field quick updates (not our use case)
- Modal editing loses context of the full resource hierarchy

**Key UX Decisions:**
1. Edit pages mirror create pages but pre-populated with existing data
2. Form validation uses same Zod schemas as create (via `updatePropertySchema`/`updateUnitSchema`)
3. Changes require explicit "Save" action (no auto-save)
4. Cancel returns to detail page without changes
5. Success redirects to detail page with toast confirmation

**Property Edit Fields (by section):**
1. Basic Information: name, type, totalUnits
2. Address: addressLine1/2, city, state, zipCode (with Google Places)
3. Details: yearBuilt, totalSqFt, lotSize, parkingSpaces, notes

**Unit Edit Fields (by section):**
1. Unit Information: unitNumber, floorPlan, bedrooms, bathrooms, sqFt, floor
2. Rent Information: marketRent, currentRent, depositAmount
3. Pet Policy: petFriendly, petDeposit, petRent
4. Status: status (VACANT, OCCUPIED, etc.)
5. Notes: notes

#### Implementation Tasks

1. Create `app.properties.$propertyId.edit.tsx` for property editing
   - Fetch existing property data via `usePropertyQuery`
   - Pre-fill form with current values
   - Wire to `updateProperty` mutation
   - Validate using `updatePropertySchema`
   - Redirect to property detail on success

2. Create `app.properties.$propertyId.units.$unitId.edit.tsx` for unit editing
   - Fetch existing unit data via `useUnitQuery`
   - Pre-fill form matching create unit structure
   - Wire to `updateUnit` mutation
   - Validate using `updateUnitSchema`
   - Redirect to units list on success

3. Add success/error toast notifications
4. Test edit flow end-to-end

Files to create:
- `src/routes/app.properties.$propertyId.edit.tsx`
- `src/routes/app.properties.$propertyId.units.$unitId.edit.tsx`

**Sources:**
- [Buildium vs AppFolio Comparison](https://www.buildium.com/blog/buildium-vs-appfolio/)
- [PatternFly Inline Edit Guidelines](https://www.patternfly.org/components/inline-edit/design-guidelines/)
- [Cloudscape Edit Patterns](https://cloudscape.design/patterns/resource-management/edit/inline-edit/)

### Phase 5: EPM-19 - View Unit Availability Status (5 pts)
**Priority: Fifth - Depends on EPM-15**

Tasks:
1. Wire `app.properties.$propertyId.units.tsx` to real API
2. Implement status badges with proper styling
3. Add status filter functionality
4. Show vacancy duration (derived calculation)
5. Add manual status override capability
6. Ensure lease status drives unit status automatically (verify backend)

Files to modify:
- `src/routes/app.properties.$propertyId.units.tsx`

### Phase 6: EPM-18 - Property Detail Page (8 pts)
**Priority: Last - Depends on EPM-17, EPM-15, EPM-19**

Tasks:
1. Wire `app.properties.$propertyId.index.tsx` to real API
2. Display units table with actual data
3. Show active tenants from lease data
4. Display recent expenses (from API)
5. Display inspection history (from API)
6. Add expiring leases widget (integrate with leases API)
7. Add work orders widget (future - Epic 3)

Files to modify:
- `src/routes/app.properties.$propertyId.index.tsx`

---

## Technical Implementation Notes

### TanStack Query Integration Pattern

```typescript
// Example query hook usage
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProperties, createProperty } from '~/services/properties.api'

// In component:
const { data, isLoading, error } = useQuery({
  queryKey: ['properties', filters],
  queryFn: () => getProperties({ data: filters }),
})

// Mutation with cache invalidation:
const queryClient = useQueryClient()
const createMutation = useMutation({
  mutationFn: createProperty,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] })
  },
})
```

### Form Validation Pattern

```typescript
// Use zod schemas from services
import { createPropertySchema } from '~/services/properties.schema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(createPropertySchema),
  defaultValues: { /* ... */ },
})
```

### Loading States

Use skeleton components from shadcn/ui for loading states.

### Error Handling

Use toast notifications via sonner (already integrated) for error feedback.

---

## Dependencies on Other Epics/Infrastructure

| Dependency | Status | Impact |
|------------|--------|--------|
| EPM-1: Database Schema | Complete | Properties/Units tables exist |
| EPM-7: API Service Layer | Complete | Server functions implemented |
| EPM-9: Testing Framework | Complete | Can add tests for new code |
| EPM-46: Authentication | Implemented | `authedMiddleware` works |
| EPM-3: Google Places API | Implemented | Address autocomplete works |

---

## Estimated Effort Breakdown

| Issue | Story Points | Estimated Tasks | Status |
|-------|--------------|-----------------|--------|
| EPM-17 | 5 | Form wiring, validation, mutation | Ready to start |
| EPM-14 | 3 | Query integration, filters, pagination | Ready after EPM-17 |
| EPM-15 | 8 | Create/bulk create units, validation | Ready after EPM-17 |
| EPM-16 | 5 | Edit forms, optimistic updates | Ready after EPM-15 |
| EPM-19 | 5 | Status filtering, automation verification | Ready after EPM-15 |
| EPM-18 | 8 | Detail page integration, widgets | Ready after EPM-19 |

**Total: 34 story points**

---

## Success Criteria

Epic 1 is complete when:

1. Users can create new properties via the UI with validation
2. Property list displays real data with search/filter
3. Units can be added individually or in bulk
4. Property and unit details can be edited
5. Unit availability status is accurately displayed
6. Property detail page shows all related data (units, tenants, expenses)
7. All data persists correctly in the database
8. Proper loading and error states are shown
9. Tests cover critical paths

---

## Recommended Next Steps

1. **Start with EPM-17** - Wire up the property creation form
2. **Then EPM-14** - Connect the property list to real data
3. **Proceed sequentially** through EPM-15 -> EPM-16 -> EPM-19 -> EPM-18

This order minimizes context switching and builds features incrementally.
