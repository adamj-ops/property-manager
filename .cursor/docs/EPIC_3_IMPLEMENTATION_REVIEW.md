# Epic 3: Maintenance & Work Orders - Implementation Review

**Date:** 2026-01-04
**Branch:** `claude/epic-3-review-planning-Pqak1`
**Status:** ~90% Complete (MVP Core Features Done)
**Total Story Points:** 42 (MVP), 49 (Full)

---

## Recent Implementation Progress (2026-01-04)

### Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| Wire maintenance list page to real API | ✅ Done | Replaced mock data with query hooks |
| Wire new work order form to real API | ✅ Done | Integrated with properties/units queries |
| Wire work order detail page to real API | ✅ Done | Status updates, comments, cost tracking |
| Vendor management CRUD (EPM-33) | ✅ Done | Full service layer + API + query hooks |
| Vendor list route | ✅ Done | `/app/maintenance/vendors` |
| Vendor detail route | ✅ Done | `/app/maintenance/vendors/$vendorId` |
| Status history tracking (EPM-32) | ✅ Done | Auto-records on status changes |
| **Photo upload for work orders** | ✅ Done | Issue photos + completion photos with Supabase Storage |
| **Vendor assignment dropdown** | ✅ Done | Can assign/unassign vendors from work order detail |

### Files Created (Session 2)
- `src/components/maintenance/photo-upload.tsx` - Reusable photo upload component
- `src/components/ui/tabs.tsx` - Simple tabs component for photo type switching

### Files Modified (Session 2)
- `src/services/maintenance.api.ts` - Added photo upload functions (createMaintenancePhotoUploadUrl, confirmMaintenancePhotoUpload, getMaintenancePhotoUrls)
- `src/services/maintenance.schema.ts` - Added photoUploadRequestSchema, photoUrlsSchema types
- `src/services/maintenance.query.ts` - Added photo upload hooks (useMaintenancePhotoUpload)
- `src/routes/app.maintenance.$workOrderId.tsx` - Integrated photo upload component, vendor assignment dropdown

### Files Created (Session 1)
- `src/services/vendors.schema.ts` - Zod validators for vendors
- `src/services/vendors.api.ts` - Server functions for vendor CRUD
- `src/services/vendors.query.ts` - React Query hooks for vendors
- `src/routes/app.maintenance.vendors.tsx` - Vendor list page
- `src/routes/app.maintenance.vendors.$vendorId.tsx` - Vendor detail page

### Files Modified (Session 1)
- `src/routes/app.maintenance.index.tsx` - Wired to real API
- `src/routes/app.maintenance.$workOrderId.tsx` - Wired to real API
- `src/services/maintenance.api.ts` - Added status history tracking

---

## Executive Summary

Epic 3 covers comprehensive maintenance request tracking, work order management, and vendor coordination. The backend API layer is largely complete, but the UI routes still use mock data and need to be wired to real APIs. Several key features (vendor management, recurring schedules, cost reporting) are not yet implemented.

---

## Current Implementation Status

### ✅ COMPLETE - Backend Services

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| API Server Functions | `src/services/maintenance.api.ts` | ✅ Complete | 6 server functions |
| Zod Schemas | `src/services/maintenance.schema.ts` | ✅ Complete | All enums, create/update/filter schemas |
| React Query Hooks | `src/services/maintenance.query.ts` | ✅ Complete | Query keys, options, suspense hooks, mutations |
| Database Models | `prisma/schema.prisma` | ✅ Complete | MaintenanceRequest, MaintenanceComment, WorkOrderStatusHistory, Vendor |

### 🟡 PARTIAL - Frontend Routes

| Route | File | Status | Issue |
|-------|------|--------|-------|
| List View | `app.maintenance.index.tsx` | 🟡 UI Complete | Uses mock data |
| New Work Order | `app.maintenance.new.tsx` | 🟡 UI Complete | Uses mock data |
| Detail View | `app.maintenance.$workOrderId.tsx` | 🟡 UI Complete | Uses mock data |
| Vendors | N/A | ❌ Not Started | Route doesn't exist |

### ❌ REMAINING WORK

| Feature | Linear Issue | Priority | Notes |
|---------|-------------|----------|-------|
| Photo Upload | EPM-29 | P0 MVP | Supabase ready, component UI exists, needs wiring |
| Email Notifications | EPM-29, 31, 32 | P0 MVP | Infrastructure ready, needs wiring to status changes |
| Vendor Assignment in Work Order | EPM-31 | P0 MVP | UI exists, needs dropdown populated with vendors |
| Recurring Schedules | EPM-74 | P1 Phase 2 | Needs new table + background job |
| Emergency Escalation | EPM-75 | P1 Phase 2 | Needs Twilio + escalation job |
| Cost Reporting | EPM-76 | P1 Phase 2 | Needs aggregation APIs + reporting UI |

---

## Detailed Gap Analysis

### 1. Wire UI to Real APIs (HIGH PRIORITY)

The UI is complete but uses hardcoded mock data. Need to integrate with the existing service layer.

#### 1.1 Maintenance List Page (`app.maintenance.index.tsx`)

**Current State:**
```typescript
// Line 72-144: Mock data array
const workOrders: WorkOrder[] = [
  { id: '2891', title: 'No heat in unit', ... },
  ...
]
```

**Required Changes:**
1. Import query hooks from `maintenance.query.ts`
2. Replace mock data with `useMaintenanceRequestsQuery()`
3. Replace mock stats with `useMaintenanceStatsQuery()`
4. Wire filter controls to query filters
5. Add loading/error states
6. Connect drawer form to `useCreateMaintenanceRequest()` mutation

**Code Spec:**
```typescript
import {
  useMaintenanceRequestsQuery,
  useMaintenanceStatsQuery,
  useCreateMaintenanceRequest
} from '~/services/maintenance.query'

function MaintenanceListPage() {
  const [filters, setFilters] = useState<MaintenanceFilters>({})
  const { data } = useMaintenanceRequestsQuery(filters)
  const { data: stats } = useMaintenanceStatsQuery()
  const createMutation = useCreateMaintenanceRequest()

  // Map data.requests to table
  // Map stats to stat cards
}
```

#### 1.2 New Work Order Page (`app.maintenance.new.tsx`)

**Current State:**
- Form UI exists but doesn't submit
- Property/Unit selects have hardcoded options
- No form validation with Zod

**Required Changes:**
1. Use `@tanstack/react-form` with Zod adapter
2. Fetch properties with existing `usePropertiesQuery()`
3. Fetch units based on selected property
4. Wire form submission to `useCreateMaintenanceRequest()`
5. Add success/error handling with toast notifications
6. Navigate to detail page on success

**Form Schema (from `maintenance.schema.ts`):**
```typescript
export const createMaintenanceSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum,
  priority: maintenancePriorityEnum.default('MEDIUM'),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  permissionToEnter: z.boolean().default(true),
  preferredTimes: z.string().optional(),
  scheduledDate: z.coerce.date().optional(),
  estimatedCost: z.number().min(0).optional(),
  photoUrls: z.array(z.string().url()).default([]),
})
```

#### 1.3 Work Order Detail Page (`app.maintenance.$workOrderId.tsx`)

**Current State:**
```typescript
// Line 29-53: Mock work order object
const workOrder = { id: '2889', title: 'Water leak...', ... }
```

**Required Changes:**
1. Use route loader with `maintenanceRequestQueryOptions(workOrderId)`
2. Wire status update dropdown to `useUpdateMaintenanceRequest()`
3. Wire comment form to `useAddMaintenanceComment()`
4. Display real status history from `statusHistory` relation
5. Wire cost recording to update mutation
6. Add photo upload component

**Route Loader Pattern:**
```typescript
export const Route = createFileRoute('/app/maintenance/$workOrderId')({
  loader: ({ params }) => ({
    workOrder: maintenanceRequestQueryOptions(params.workOrderId),
  }),
  component: WorkOrderDetailPage,
})

function WorkOrderDetailPage() {
  const { workOrderId } = Route.useParams()
  const { data: workOrder } = useMaintenanceRequestQuery(workOrderId)
  // ...
}
```

---

### 2. Vendor Management (EPM-33) - NEW FEATURE

Complete CRUD for vendor directory with categories, rates, and insurance tracking.

#### 2.1 Create Service Files

**File: `src/services/vendors.schema.ts`**
```typescript
import { z } from 'zod'
import { maintenanceCategoryEnum } from './maintenance.schema'

export const vendorStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PENDING_APPROVAL',
  'SUSPENDED',
])

export const createVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  altPhone: z.string().optional(),

  // Address
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  // Services
  categories: z.array(maintenanceCategoryEnum).min(1, 'Select at least one category'),
  serviceAreas: z.array(z.string()).default([]),
  hourlyRate: z.number().min(0).optional(),

  // Insurance & Licensing
  insuranceProvider: z.string().optional(),
  insurancePolicyNum: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.coerce.date().optional(),

  // Payment
  taxId: z.string().optional(),
  paymentTerms: z.number().int().default(30),

  notes: z.string().optional(),
})

export const updateVendorSchema = createVendorSchema.partial().extend({
  status: vendorStatusEnum.optional(),
  rating: z.number().min(1).max(5).optional(),
})

export const vendorFiltersSchema = z.object({
  status: vendorStatusEnum.optional(),
  category: maintenanceCategoryEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const vendorIdSchema = z.object({
  id: z.string().uuid(),
})

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type VendorFilters = z.infer<typeof vendorFiltersSchema>
```

**File: `src/services/vendors.api.ts`**
```typescript
import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFiltersSchema,
  vendorIdSchema,
} from './vendors.schema'

// Get all vendors
export const getVendors = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorFiltersSchema))
  .handler(async ({ data }) => {
    const { status, category, search, limit, offset } = data

    const where = {
      ...(status && { status }),
      ...(category && { categories: { has: category } }),
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { contactName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { companyName: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.vendor.count({ where }),
    ])

    return { vendors, total, limit, offset }
  })

// Get single vendor
export const getVendor = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema))
  .handler(async ({ data }) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.id },
      include: {
        maintenanceRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            unit: { include: { property: true } },
          },
        },
        _count: {
          select: { maintenanceRequests: true, expenses: true },
        },
      },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return vendor
  })

// Create vendor
export const createVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createVendorSchema))
  .handler(async ({ data }) => {
    const vendor = await prisma.vendor.create({
      data,
    })
    return vendor
  })

// Update vendor
export const updateVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema.merge(updateVendorSchema)))
  .handler(async ({ data }) => {
    const { id, ...updateData } = data

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    })

    return vendor
  })

// Delete vendor (soft delete - set to inactive)
export const deleteVendor = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(vendorIdSchema))
  .handler(async ({ data }) => {
    const vendor = await prisma.vendor.update({
      where: { id: data.id },
      data: { status: 'INACTIVE' },
    })
    return vendor
  })
```

**File: `src/services/vendors.query.ts`**
```typescript
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
} from './vendors.api'
import type { CreateVendorInput, UpdateVendorInput, VendorFilters } from './vendors.schema'

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilters) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
}

const defaultFilters: Pick<VendorFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

export const vendorsQueryOptions = (filters: Partial<VendorFilters> = {}) => {
  const mergedFilters: VendorFilters = { ...defaultFilters, ...filters }
  return queryOptions({
    queryKey: vendorKeys.list(mergedFilters),
    queryFn: () => getVendors({ data: mergedFilters }),
  })
}

export const vendorQueryOptions = (id: string) =>
  queryOptions({
    queryKey: vendorKeys.detail(id),
    queryFn: () => getVendor({ data: { id } }),
  })

export const useVendorsQuery = (filters: Partial<VendorFilters> = {}) =>
  useSuspenseQuery(vendorsQueryOptions(filters))

export const useVendorQuery = (id: string) =>
  useSuspenseQuery(vendorQueryOptions(id))

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVendorInput) => createVendor({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateVendorInput & { id: string }) =>
      updateVendor({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVendor({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}
```

#### 2.2 Create Route Files

**File: `src/routes/app.maintenance.vendors.tsx`** - Vendor list page
**File: `src/routes/app.maintenance.vendors.new.tsx`** - New vendor form
**File: `src/routes/app.maintenance.vendors.$vendorId.tsx`** - Vendor detail page

---

### 3. Status History Tracking (EPM-32)

Track all status transitions with user, timestamp, and notes.

#### 3.1 Add Status History Recording to API

Modify `updateMaintenanceRequest` in `maintenance.api.ts`:

```typescript
export const updateMaintenanceRequest = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema.merge(updateMaintenanceSchema)))
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data

    const existing = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        unit: { property: { managerId: context.auth.user.id } },
      },
    })

    if (!existing) {
      throw new Error('Maintenance request not found')
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (updateData.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date()
    }

    // Record status change in history
    const statusChanged = updateData.status && updateData.status !== existing.status

    const request = await prisma.$transaction(async (tx) => {
      // Create status history entry if status changed
      if (statusChanged) {
        await tx.workOrderStatusHistory.create({
          data: {
            requestId: id,
            fromStatus: existing.status,
            toStatus: updateData.status!,
            reason: updateData.statusChangeReason, // Add to schema
            notes: updateData.statusChangeNotes,   // Add to schema
            changedByName: context.auth.user.name,
            changedByType: 'staff',
          },
        })
      }

      // Update the request
      return tx.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          unit: { include: { property: true } },
          tenant: true,
          vendor: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })
    })

    return request
  })
```

#### 3.2 Add Status History API

```typescript
export const getMaintenanceStatusHistory = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(maintenanceIdSchema))
  .handler(async ({ context, data }) => {
    const history = await prisma.workOrderStatusHistory.findMany({
      where: {
        requestId: data.id,
        request: {
          unit: { property: { managerId: context.auth.user.id } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return history
  })
```

---

### 4. Photo Upload Integration

Integrate with Supabase Storage for work order photos.

#### 4.1 Create Upload Component

```typescript
// src/components/maintenance/PhotoUpload.tsx
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '~/server/storage'

interface PhotoUploadProps {
  workOrderId: string
  existingPhotos: string[]
  onPhotosChange: (urls: string[]) => void
  type: 'issue' | 'completion'
}

export function PhotoUpload({
  workOrderId,
  existingPhotos,
  onPhotosChange,
  type
}: PhotoUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadPromises = acceptedFiles.map(async (file) => {
      const path = `maintenance/${workOrderId}/${type}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path)

      return publicUrl
    })

    const newUrls = await Promise.all(uploadPromises)
    onPhotosChange([...existingPhotos, ...newUrls])
  }, [workOrderId, existingPhotos, onPhotosChange, type])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
  })

  return (
    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <p>Drag & drop photos, or click to select</p>
      )}
    </div>
  )
}
```

---

### 5. Email Notifications

Wire up email notifications using existing infrastructure.

#### 5.1 Notification Triggers

| Event | Recipient | Template | Priority |
|-------|-----------|----------|----------|
| Request submitted | Tenant | `maintenance_submitted` | P0 |
| Vendor assigned | Vendor | `vendor_assigned` | P0 |
| Status → SCHEDULED | Tenant | `maintenance_scheduled` | P0 |
| Status → COMPLETED | Tenant | `maintenance_completed` | P0 |
| Emergency submitted | Manager + Vendor | `emergency_alert` | P0 |

#### 5.2 Add Notification Service

**File: `src/services/notifications.maintenance.ts`**
```typescript
import { sendEmail } from '~/server/email'

export async function notifyMaintenanceSubmitted(request: MaintenanceRequest) {
  if (!request.tenant?.email) return

  await sendEmail({
    to: request.tenant.email,
    subject: `Maintenance Request #${request.requestNumber} Received`,
    template: 'maintenance_submitted',
    data: {
      tenantName: request.tenant.firstName,
      requestNumber: request.requestNumber,
      title: request.title,
      property: request.unit.property.name,
      unit: request.unit.unitNumber,
    },
  })
}

export async function notifyVendorAssigned(request: MaintenanceRequest) {
  if (!request.vendor?.email) return

  await sendEmail({
    to: request.vendor.email,
    subject: `New Work Order Assigned: #${request.requestNumber}`,
    template: 'vendor_assigned',
    data: {
      vendorName: request.vendor.contactName,
      requestNumber: request.requestNumber,
      title: request.title,
      priority: request.priority,
      category: request.category,
      property: request.unit.property.name,
      unit: request.unit.unitNumber,
      description: request.description,
      scheduledDate: request.scheduledDate,
      estimatedCost: request.estimatedCost,
    },
  })
}

export async function notifyMaintenanceCompleted(request: MaintenanceRequest) {
  if (!request.tenant?.email) return

  await sendEmail({
    to: request.tenant.email,
    subject: `Maintenance Request #${request.requestNumber} Completed`,
    template: 'maintenance_completed',
    data: {
      tenantName: request.tenant.firstName,
      requestNumber: request.requestNumber,
      title: request.title,
      completedAt: request.completedAt,
      completionNotes: request.completionNotes,
    },
  })
}
```

---

## Phase 2 Features (Not in Current Scope)

### EPM-74: Recurring Maintenance Schedules

**Database Migration Required:**
```sql
-- 003_maintenance_schedules.sql
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES pm_properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES pm_units(id) ON DELETE CASCADE,
  category maintenance_category NOT NULL,
  priority maintenance_priority NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  description TEXT,
  recurrence_rule TEXT NOT NULL, -- RRULE format
  next_run_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_vendor_id UUID REFERENCES pm_vendors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_run
  ON maintenance_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_active
  ON maintenance_schedules(is_active) WHERE is_active = TRUE;
```

**Background Job:** Daily cron to check `next_run_at` and create work orders.

### EPM-75: Emergency Escalation

**Requirements:**
- Twilio integration for SMS
- 30-minute escalation timeout
- Background job for monitoring unacknowledged emergencies
- SLA tracking metrics

### EPM-76: Cost Reporting

**New API Endpoints:**
```typescript
export const getMaintenanceCostSummary = createServerFn({ method: 'GET' })
  // Parameters: dateRange, groupBy (unit|property|category|vendor)
  // Returns: aggregated cost data with trends
```

---

## Implementation Order (Recommended)

### Sprint 1: Wire Existing UI (3-5 days)

1. **Day 1-2:** Wire maintenance list page
   - Replace mock data with queries
   - Wire stats cards
   - Wire drawer form

2. **Day 2-3:** Wire work order detail page
   - Replace mock data with query
   - Wire status update
   - Wire comment form
   - Display real status history

3. **Day 3-4:** Wire new work order form
   - Fetch real properties/units
   - Form validation with Zod
   - Submit to API

4. **Day 4-5:** Testing & Bug Fixes

### Sprint 2: Vendor Management (3-4 days)

1. **Day 1:** Create service files (schema, api, query)
2. **Day 2:** Create vendor list route
3. **Day 3:** Create vendor detail + edit routes
4. **Day 4:** Wire vendor selection in work order assignment

### Sprint 3: Photo Upload & Notifications (2-3 days)

1. **Day 1:** Photo upload component
2. **Day 2:** Email notification service
3. **Day 3:** Testing & integration

---

## Testing Requirements

### Unit Tests
- [ ] Vendor schema validation
- [ ] Status transition validation
- [ ] Cost calculation helpers

### Integration Tests
- [ ] Create maintenance request flow
- [ ] Update status with history tracking
- [ ] Vendor CRUD operations
- [ ] Photo upload to Supabase

### E2E Tests
- [ ] Full work order lifecycle
- [ ] Vendor assignment flow
- [ ] Email notification delivery

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Work orders using real API | 100% | 0% |
| Vendor CRUD complete | 100% | 0% |
| Photo upload working | 100% | 0% |
| Email notifications sent | 100% | 0% |
| Status history tracked | 100% | 0% |

---

## Files to Create/Modify

### New Files
- [ ] `src/services/vendors.schema.ts`
- [ ] `src/services/vendors.api.ts`
- [ ] `src/services/vendors.query.ts`
- [ ] `src/routes/app.maintenance.vendors.tsx`
- [ ] `src/routes/app.maintenance.vendors.new.tsx`
- [ ] `src/routes/app.maintenance.vendors.$vendorId.tsx`
- [ ] `src/components/maintenance/PhotoUpload.tsx`
- [ ] `src/services/notifications.maintenance.ts`

### Files to Modify
- [ ] `src/routes/app.maintenance.index.tsx` - Wire to real API
- [ ] `src/routes/app.maintenance.new.tsx` - Wire to real API
- [ ] `src/routes/app.maintenance.$workOrderId.tsx` - Wire to real API
- [ ] `src/services/maintenance.api.ts` - Add status history tracking
- [ ] `src/services/maintenance.schema.ts` - Add status change fields

---

## Dependencies

- `react-dropzone` - Already installed for file uploads
- Email templates ready in `/emails` directory
- Supabase storage configured
- Prisma models complete

---

## Notes for Implementation

1. **Suspense Boundaries:** All query hooks use `useSuspenseQuery`, ensure proper Suspense boundaries in routes
2. **Error Handling:** Add toast notifications for mutation errors
3. **Optimistic Updates:** Consider for status changes for better UX
4. **Form State:** Use TanStack Form for complex forms with validation
5. **Type Safety:** Export types from schema files for component props
