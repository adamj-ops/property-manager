# EPM-76: Phases 1 & 2 Implementation Plan

**Epic**: 3.8 — Maintenance Cost Tracking
**Scope**: Phase 1 (Cost Details & Line Items) + Phase 2 (Budget Management)
**Estimated Duration**: 4 Sprints (8 weeks)
**Last Updated**: 2026-01-05

---

## Table of Contents

1. [Phase 1: Cost Line Items](#phase-1-cost-line-items)
2. [Phase 1: Invoice Management](#phase-1-invoice-management)
3. [Phase 2: Budget Management](#phase-2-budget-management)
4. [Phase 2: Threshold Alerts](#phase-2-threshold-alerts)
5. [Phase 2: Budget vs Actual Reporting](#phase-2-budget-vs-actual-reporting)
6. [Database Migrations](#database-migrations)
7. [Implementation Order](#implementation-order)
8. [Testing Requirements](#testing-requirements)

---

## Phase 1: Cost Line Items

### 1.1 Prisma Schema Changes

Add to `prisma/schema.prisma`:

```prisma
// =============================================================================
// MAINTENANCE COST LINE ITEMS (EPM-76)
// =============================================================================

enum CostLineItemType {
  LABOR
  PARTS
  MATERIALS
  PERMITS
  TRAVEL
  EMERGENCY_FEE
  DISPOSAL
  SUBCONTRACTOR
  OTHER
}

model MaintenanceCostLineItem {
  id          String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  requestId   String           @db.Uuid
  request     MaintenanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  // Item details
  type        CostLineItemType
  description String
  quantity    Decimal          @db.Decimal(10, 2) @default(1)
  unitCost    Decimal          @db.Decimal(10, 2)
  totalCost   Decimal          @db.Decimal(10, 2) // Auto-calculated: quantity * unitCost

  // Parts tracking
  partNumber      String?
  supplier        String?
  warranty        Boolean      @default(false)
  warrantyExpiry  DateTime?

  // Labor tracking
  laborHours  Decimal?         @db.Decimal(5, 2)
  laborRate   Decimal?         @db.Decimal(10, 2)
  workerId    String?          // Vendor employee name or ID

  // Documentation
  receiptUrl  String?

  // Tenant billing
  chargeToTenant      Boolean  @default(false)
  tenantChargeAmount  Decimal? @db.Decimal(10, 2)

  // Audit
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  createdById String           @db.Uuid
  createdBy   User             @relation(fields: [createdById], references: [id])

  @@index([requestId])
  @@index([type])
  @@map("maintenance_cost_line_items")
}
```

**Update MaintenanceRequest model** - add relation:

```prisma
model MaintenanceRequest {
  // ... existing fields ...

  costLineItems MaintenanceCostLineItem[]
  invoices      MaintenanceInvoice[]
}
```

**Update User model** - add relation:

```prisma
model User {
  // ... existing fields ...

  createdCostLineItems MaintenanceCostLineItem[]
}
```

---

### 1.2 Zod Schemas

**File**: `src/services/cost-line-items.schema.ts`

```typescript
import { z } from 'zod'

// =============================================================================
// ENUMS
// =============================================================================

export const costLineItemTypeEnum = z.enum([
  'LABOR',
  'PARTS',
  'MATERIALS',
  'PERMITS',
  'TRAVEL',
  'EMERGENCY_FEE',
  'DISPOSAL',
  'SUBCONTRACTOR',
  'OTHER',
])

export type CostLineItemType = z.infer<typeof costLineItemTypeEnum>

// =============================================================================
// CREATE
// =============================================================================

export const createCostLineItemSchema = z.object({
  requestId: z.string().uuid(),
  type: costLineItemTypeEnum,
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unitCost: z.number().nonnegative('Unit cost cannot be negative'),

  // Parts
  partNumber: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  warranty: z.boolean().default(false),
  warrantyExpiry: z.coerce.date().optional(),

  // Labor
  laborHours: z.number().positive().optional(),
  laborRate: z.number().positive().optional(),
  workerId: z.string().max(100).optional(),

  // Documentation
  receiptUrl: z.string().url().optional(),

  // Tenant billing
  chargeToTenant: z.boolean().default(false),
  tenantChargeAmount: z.number().nonnegative().optional(),
})

export const updateCostLineItemSchema = createCostLineItemSchema.partial().omit({
  requestId: true,
})

// =============================================================================
// FILTERS & IDS
// =============================================================================

export const costLineItemIdSchema = z.object({
  id: z.string().uuid(),
})

export const costLineItemFiltersSchema = z.object({
  requestId: z.string().uuid(),
  type: costLineItemTypeEnum.optional(),
})

// =============================================================================
// BULK OPERATIONS
// =============================================================================

export const bulkCreateCostLineItemsSchema = z.object({
  requestId: z.string().uuid(),
  items: z.array(createCostLineItemSchema.omit({ requestId: true })).min(1).max(50),
})

export const bulkDeleteCostLineItemsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface CostLineItemSummary {
  totalCost: number
  laborCost: number
  partsCost: number
  materialsCost: number
  otherCosts: number
  tenantCharges: number
  netCost: number
  itemCount: number
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateCostLineItemInput = z.infer<typeof createCostLineItemSchema>
export type UpdateCostLineItemInput = z.infer<typeof updateCostLineItemSchema>
export type CostLineItemFilters = z.infer<typeof costLineItemFiltersSchema>
export type BulkCreateCostLineItemsInput = z.infer<typeof bulkCreateCostLineItemsSchema>
```

---

### 1.3 API Endpoints

**File**: `src/services/cost-line-items.api.ts`

| Function | Method | Description | Auth |
|----------|--------|-------------|------|
| `getCostLineItems` | GET | List line items for a work order | ✅ |
| `getCostLineItem` | GET | Get single line item | ✅ |
| `createCostLineItem` | POST | Add new line item | ✅ |
| `updateCostLineItem` | POST | Update existing line item | ✅ |
| `deleteCostLineItem` | POST | Remove line item | ✅ |
| `bulkCreateCostLineItems` | POST | Add multiple line items | ✅ |
| `bulkDeleteCostLineItems` | POST | Remove multiple line items | ✅ |
| `getCostLineItemSummary` | GET | Get cost breakdown summary | ✅ |

**Implementation Notes**:

```typescript
// Auto-calculate totalCost on create/update
const totalCost = data.quantity * data.unitCost

// Auto-update MaintenanceRequest.actualCost when line items change
// Sum all line items' totalCost and update the parent request
await prisma.$transaction([
  prisma.maintenanceCostLineItem.create({ ... }),
  prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      actualCost: await calculateTotalFromLineItems(requestId),
    },
  }),
])
```

---

### 1.4 React Query Hooks

**File**: `src/services/cost-line-items.query.ts`

```typescript
// Query keys
export const costLineItemKeys = {
  all: ['cost-line-items'] as const,
  byRequest: (requestId: string) => [...costLineItemKeys.all, 'request', requestId] as const,
  detail: (id: string) => [...costLineItemKeys.all, 'detail', id] as const,
  summary: (requestId: string) => [...costLineItemKeys.all, 'summary', requestId] as const,
}

// Query options
export const costLineItemsQueryOptions = (requestId: string) => queryOptions({ ... })
export const costLineItemQueryOptions = (id: string) => queryOptions({ ... })
export const costLineItemSummaryQueryOptions = (requestId: string) => queryOptions({ ... })

// Suspense hooks
export const useCostLineItemsQuery = (requestId: string) => useSuspenseQuery(...)
export const useCostLineItemSummaryQuery = (requestId: string) => useSuspenseQuery(...)

// Mutations
export const useCreateCostLineItemMutation = () => useMutation(...)
export const useUpdateCostLineItemMutation = () => useMutation(...)
export const useDeleteCostLineItemMutation = () => useMutation(...)
export const useBulkCreateCostLineItemsMutation = () => useMutation(...)
```

---

### 1.5 UI Components

| Component | File | Description |
|-----------|------|-------------|
| `CostLineItemsTable` | `src/components/maintenance/cost-line-items-table.tsx` | Editable table with inline editing |
| `AddCostLineItemDialog` | `src/components/maintenance/add-cost-line-item-dialog.tsx` | Modal form for adding items |
| `CostBreakdownCard` | `src/components/maintenance/cost-breakdown-card.tsx` | Summary card with pie chart |
| `CostLineItemRow` | `src/components/maintenance/cost-line-item-row.tsx` | Individual row component |
| `LaborEntryForm` | `src/components/maintenance/labor-entry-form.tsx` | Specialized form for labor entries |
| `PartsEntryForm` | `src/components/maintenance/parts-entry-form.tsx` | Specialized form for parts entries |

**CostLineItemsTable Features**:
- Sortable columns (type, description, quantity, unit cost, total)
- Inline editing (click to edit)
- Row actions (edit, duplicate, delete)
- Bulk selection and delete
- Type-based icons (🔧 labor, 🔩 parts, 📦 materials, etc.)
- Auto-sum footer row
- Tenant charge toggle per row

**CostBreakdownCard Features**:
- Pie chart showing cost distribution by type
- Summary metrics (total, labor, parts, tenant charges, net)
- Link to view detailed breakdown

---

### 1.6 Route Integration

**Update**: `src/routes/app.maintenance.$workOrderId.tsx`

Add a new "Costs" tab or section:

```tsx
// In the work order detail page, add:
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="costs">Costs</TabsTrigger>  {/* NEW */}
    <TabsTrigger value="comments">Comments</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>

  <TabsContent value="costs">
    <CostBreakdownCard requestId={workOrderId} />
    <CostLineItemsTable requestId={workOrderId} />
  </TabsContent>
</Tabs>
```

---

## Phase 1: Invoice Management

### 1.7 Prisma Schema Changes

Add to `prisma/schema.prisma`:

```prisma
// =============================================================================
// MAINTENANCE INVOICES (EPM-76)
// =============================================================================

enum InvoiceStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  DISPUTED
  PAID
  CANCELLED
  VOID
}

model MaintenanceInvoice {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoiceNumber   String        // Vendor's invoice number

  // Relations
  requestId       String        @db.Uuid
  request         MaintenanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  vendorId        String?       @db.Uuid
  vendor          Vendor?       @relation(fields: [vendorId], references: [id])

  // Amounts
  subtotal        Decimal       @db.Decimal(10, 2)
  taxAmount       Decimal       @db.Decimal(10, 2) @default(0)
  totalAmount     Decimal       @db.Decimal(10, 2)

  // Discrepancy tracking
  expectedAmount  Decimal?      @db.Decimal(10, 2) // Based on line items
  varianceAmount  Decimal?      @db.Decimal(10, 2) // totalAmount - expectedAmount
  varianceReason  String?

  // Dates
  invoiceDate     DateTime
  receivedDate    DateTime      @default(now())
  dueDate         DateTime?
  paidDate        DateTime?

  // Status & Approval
  status          InvoiceStatus @default(PENDING_APPROVAL)
  approvedById    String?       @db.Uuid
  approvedBy      User?         @relation("InvoiceApprover", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  rejectedById    String?       @db.Uuid
  rejectedBy      User?         @relation("InvoiceRejecter", fields: [rejectedById], references: [id])
  rejectedAt      DateTime?
  disputeReason   String?
  resolutionNotes String?

  // Documents
  invoiceUrl      String        // PDF or image URL

  // Payment tracking
  paymentMethod   String?       // CHECK, ACH, CREDIT_CARD, etc.
  paymentReference String?      // Check number, transaction ID

  // Link to expense system
  expenseId       String?       @unique @db.Uuid
  expense         Expense?      @relation(fields: [expenseId], references: [id])

  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdById     String        @db.Uuid
  createdBy       User          @relation("InvoiceCreator", fields: [createdById], references: [id])

  @@index([requestId])
  @@index([vendorId])
  @@index([status])
  @@index([dueDate])
  @@index([invoiceDate])
  @@map("maintenance_invoices")
}
```

**Update Vendor model** - add relation:

```prisma
model Vendor {
  // ... existing fields ...

  invoices MaintenanceInvoice[]
}
```

**Update User model** - add relations:

```prisma
model User {
  // ... existing fields ...

  approvedInvoices  MaintenanceInvoice[] @relation("InvoiceApprover")
  rejectedInvoices  MaintenanceInvoice[] @relation("InvoiceRejecter")
  createdInvoices   MaintenanceInvoice[] @relation("InvoiceCreator")
}
```

**Update Expense model** - add relation:

```prisma
model Expense {
  // ... existing fields ...

  invoice MaintenanceInvoice?
}
```

---

### 1.8 Invoice Zod Schemas

**File**: `src/services/maintenance-invoices.schema.ts`

```typescript
import { z } from 'zod'

// =============================================================================
// ENUMS
// =============================================================================

export const invoiceStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'DISPUTED',
  'PAID',
  'CANCELLED',
  'VOID',
])

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>

// =============================================================================
// CREATE & UPDATE
// =============================================================================

export const createInvoiceSchema = z.object({
  requestId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100),

  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),

  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),

  invoiceUrl: z.string().url('Valid invoice URL required'),
  notes: z.string().max(2000).optional(),
})

export const updateInvoiceSchema = createInvoiceSchema.partial().omit({
  requestId: true,
})

// =============================================================================
// ACTIONS
// =============================================================================

export const approveInvoiceSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
})

export const rejectInvoiceSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required'),
})

export const disputeInvoiceSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Dispute reason is required'),
  expectedAmount: z.number().nonnegative().optional(),
})

export const resolveDisputeSchema = z.object({
  id: z.string().uuid(),
  newAmount: z.number().nonnegative(),
  resolutionNotes: z.string().min(1),
})

export const markInvoicePaidSchema = z.object({
  id: z.string().uuid(),
  paidDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().optional(),
  createExpense: z.boolean().default(true), // Auto-create expense record
})

// =============================================================================
// FILTERS
// =============================================================================

export const invoiceFiltersSchema = z.object({
  requestId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  status: invoiceStatusEnum.optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  overdueOnly: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const invoiceIdSchema = z.object({
  id: z.string().uuid(),
})

// =============================================================================
// UPLOAD
// =============================================================================

export const invoiceUploadRequestSchema = z.object({
  requestId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().max(25 * 1024 * 1024), // 25MB max
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
})

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface InvoiceSummary {
  totalPending: number
  totalApproved: number
  totalPaid: number
  totalDisputed: number
  pendingCount: number
  overdueCount: number
  dueThisWeek: number
  dueThisMonth: number
}

export interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  request: { id: string; requestNumber: string; title: string }
  vendor: { id: string; companyName: string } | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: InvoiceStatus
  invoiceDate: string
  dueDate: string | null
  paidDate: string | null
  invoiceUrl: string
  createdAt: string
  isOverdue: boolean
  daysUntilDue: number | null
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>
export type ApproveInvoiceInput = z.infer<typeof approveInvoiceSchema>
export type MarkInvoicePaidInput = z.infer<typeof markInvoicePaidSchema>
```

---

### 1.9 Invoice API Endpoints

**File**: `src/services/maintenance-invoices.api.ts`

| Function | Method | Description | Auth |
|----------|--------|-------------|------|
| `getInvoices` | GET | List invoices with filters | ✅ |
| `getInvoice` | GET | Get single invoice | ✅ |
| `createInvoice` | POST | Create invoice record | ✅ |
| `updateInvoice` | POST | Update invoice details | ✅ |
| `deleteInvoice` | POST | Delete invoice | ✅ |
| `approveInvoice` | POST | Approve for payment | ✅ |
| `rejectInvoice` | POST | Reject with reason | ✅ |
| `disputeInvoice` | POST | Mark as disputed | ✅ |
| `resolveDispute` | POST | Resolve disputed invoice | ✅ |
| `markInvoicePaid` | POST | Record payment | ✅ |
| `getInvoiceSummary` | GET | Dashboard summary stats | ✅ |
| `getOverdueInvoices` | GET | Invoices past due date | ✅ |
| `getDueThisWeek` | GET | Invoices due in 7 days | ✅ |
| `createInvoiceUploadUrl` | POST | Get signed upload URL | ✅ |
| `linkInvoiceToExpense` | POST | Connect to expense record | ✅ |

**Implementation Notes**:

```typescript
// When approving invoice, validate against line items total
const lineItemsTotal = await prisma.maintenanceCostLineItem.aggregate({
  where: { requestId: invoice.requestId },
  _sum: { totalCost: true },
})

if (Math.abs(invoice.totalAmount - lineItemsTotal) > 0.01) {
  invoice.varianceAmount = invoice.totalAmount - lineItemsTotal
  // Flag for review if variance > 10%
}

// When marking paid with createExpense=true
if (data.createExpense) {
  const expense = await prisma.expense.create({
    data: {
      propertyId: request.unit.propertyId,
      vendorId: invoice.vendorId,
      maintenanceRequestId: invoice.requestId,
      category: 'MAINTENANCE',
      status: 'PAID',
      amount: invoice.totalAmount,
      description: `Invoice ${invoice.invoiceNumber} - ${request.title}`,
      expenseDate: data.paidDate,
      paidDate: data.paidDate,
      invoiceNumber: invoice.invoiceNumber,
      referenceNumber: data.paymentReference,
    },
  })

  await prisma.maintenanceInvoice.update({
    where: { id: invoice.id },
    data: { expenseId: expense.id },
  })
}
```

---

### 1.10 Invoice React Query Hooks

**File**: `src/services/maintenance-invoices.query.ts`

```typescript
// Query keys
export const invoiceKeys = {
  all: ['maintenance-invoices'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
  byRequest: (requestId: string) => [...invoiceKeys.all, 'request', requestId] as const,
  summary: () => [...invoiceKeys.all, 'summary'] as const,
  overdue: () => [...invoiceKeys.all, 'overdue'] as const,
  dueThisWeek: () => [...invoiceKeys.all, 'due-this-week'] as const,
}

// Query options
export const invoicesQueryOptions = (filters: InvoiceFilters) => queryOptions({ ... })
export const invoiceQueryOptions = (id: string) => queryOptions({ ... })
export const invoicesByRequestQueryOptions = (requestId: string) => queryOptions({ ... })
export const invoiceSummaryQueryOptions = () => queryOptions({ ... })
export const overdueInvoicesQueryOptions = () => queryOptions({ ... })

// Suspense hooks
export const useInvoicesQuery = (filters: InvoiceFilters) => useSuspenseQuery(...)
export const useInvoiceQuery = (id: string) => useSuspenseQuery(...)
export const useInvoicesByRequestQuery = (requestId: string) => useSuspenseQuery(...)
export const useInvoiceSummaryQuery = () => useSuspenseQuery(...)

// Mutations
export const useCreateInvoiceMutation = () => useMutation(...)
export const useUpdateInvoiceMutation = () => useMutation(...)
export const useApproveInvoiceMutation = () => useMutation(...)
export const useRejectInvoiceMutation = () => useMutation(...)
export const useDisputeInvoiceMutation = () => useMutation(...)
export const useMarkInvoicePaidMutation = () => useMutation(...)
```

---

### 1.11 Invoice UI Components

| Component | File | Description |
|-----------|------|-------------|
| `InvoiceUploadCard` | `src/components/maintenance/invoice-upload-card.tsx` | Drag-drop upload with preview |
| `InvoiceTable` | `src/components/maintenance/invoice-table.tsx` | List with status badges |
| `InvoiceDetailDialog` | `src/components/maintenance/invoice-detail-dialog.tsx` | View invoice with PDF preview |
| `InvoiceApprovalActions` | `src/components/maintenance/invoice-approval-actions.tsx` | Approve/Reject/Dispute buttons |
| `InvoicePaymentDialog` | `src/components/maintenance/invoice-payment-dialog.tsx` | Record payment form |
| `OverdueInvoicesWidget` | `src/components/maintenance/overdue-invoices-widget.tsx` | Dashboard widget |
| `InvoiceSummaryCard` | `src/components/maintenance/invoice-summary-card.tsx` | Quick stats card |

---

### 1.12 Invoice Routes

**New route**: `src/routes/app.maintenance.invoices.tsx`

```
/app/maintenance/invoices
├── List view with filters (status, vendor, date range)
├── Summary stats cards at top
├── Table with pagination
└── Quick actions (approve, pay, etc.)
```

**New route**: `src/routes/app.maintenance.invoices.$invoiceId.tsx`

```
/app/maintenance/invoices/:invoiceId
├── Invoice details
├── PDF viewer
├── Linked work order info
├── Approval workflow
└── Payment history
```

---

## Phase 2: Budget Management

### 2.1 Prisma Schema Changes

Add to `prisma/schema.prisma`:

```prisma
// =============================================================================
// MAINTENANCE BUDGETS (EPM-76)
// =============================================================================

enum BudgetPeriodType {
  MONTHLY
  QUARTERLY
  ANNUALLY
}

model MaintenanceBudget {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String           // e.g., "Q1 2026 HVAC Budget"

  // Scope - at least one must be set
  propertyId      String?          @db.Uuid
  property        Property?        @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  category        MaintenanceCategory?
  // If both null = global budget for all properties

  // Period
  periodType      BudgetPeriodType @default(MONTHLY)
  year            Int
  month           Int?             // 1-12 for monthly budgets
  quarter         Int?             // 1-4 for quarterly budgets

  // Budget amounts
  budgetAmount    Decimal          @db.Decimal(12, 2)

  // Thresholds (percentage)
  warningThreshold  Int            @default(80)   // Yellow alert
  criticalThreshold Int            @default(100)  // Red alert

  // Tracking (denormalized for performance - updated by triggers/jobs)
  spentAmount     Decimal          @db.Decimal(12, 2) @default(0)
  committedAmount Decimal          @db.Decimal(12, 2) @default(0) // Scheduled but not completed
  remainingAmount Decimal          @db.Decimal(12, 2) // budgetAmount - spentAmount
  percentUsed     Decimal          @db.Decimal(5, 2)  @default(0)

  // Alerts tracking
  warningAlertSentAt  DateTime?
  criticalAlertSentAt DateTime?

  // Rollover from previous period
  rolledOverAmount    Decimal?     @db.Decimal(12, 2)
  rolloverFromBudgetId String?     @db.Uuid

  // Status
  isActive        Boolean          @default(true)
  notes           String?

  // Audit
  createdById     String           @db.Uuid
  createdBy       User             @relation(fields: [createdById], references: [id])
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([propertyId, category, year, month])
  @@unique([propertyId, category, year, quarter])
  @@index([propertyId])
  @@index([category])
  @@index([year, month])
  @@index([year, quarter])
  @@index([percentUsed])
  @@index([isActive])
  @@map("maintenance_budgets")
}

// Track budget adjustments for audit trail
model BudgetAdjustment {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  budgetId        String           @db.Uuid
  budget          MaintenanceBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  previousAmount  Decimal          @db.Decimal(12, 2)
  newAmount       Decimal          @db.Decimal(12, 2)
  adjustmentType  String           // INCREASE, DECREASE, ROLLOVER, REALLOCATION
  reason          String

  adjustedById    String           @db.Uuid
  adjustedBy      User             @relation(fields: [adjustedById], references: [id])
  createdAt       DateTime         @default(now())

  @@index([budgetId])
  @@map("budget_adjustments")
}
```

**Update Property model** - add relation:

```prisma
model Property {
  // ... existing fields ...

  maintenanceBudgets MaintenanceBudget[]
}
```

**Update MaintenanceBudget model** - add self-relation for rollover:

```prisma
model MaintenanceBudget {
  // ... existing fields ...

  rolloverFromBudget   MaintenanceBudget?  @relation("BudgetRollover", fields: [rolloverFromBudgetId], references: [id])
  rolloverToBudgets    MaintenanceBudget[] @relation("BudgetRollover")
  adjustments          BudgetAdjustment[]
}
```

---

### 2.2 Budget Zod Schemas

**File**: `src/services/maintenance-budgets.schema.ts`

```typescript
import { z } from 'zod'
import { maintenanceCategoryEnum } from '~/services/maintenance.schema'

// =============================================================================
// ENUMS
// =============================================================================

export const budgetPeriodTypeEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'])
export type BudgetPeriodType = z.infer<typeof budgetPeriodTypeEnum>

// =============================================================================
// CREATE & UPDATE
// =============================================================================

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(200),

  // Scope
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),

  // Period
  periodType: budgetPeriodTypeEnum.default('MONTHLY'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),

  // Amounts
  budgetAmount: z.number().positive('Budget amount must be positive'),

  // Thresholds
  warningThreshold: z.number().int().min(1).max(100).default(80),
  criticalThreshold: z.number().int().min(1).max(200).default(100),

  notes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    // Validate period-specific fields
    if (data.periodType === 'MONTHLY' && !data.month) {
      return false
    }
    if (data.periodType === 'QUARTERLY' && !data.quarter) {
      return false
    }
    return true
  },
  { message: 'Month required for monthly budgets, quarter required for quarterly budgets' }
)

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  budgetAmount: z.number().positive().optional(),
  warningThreshold: z.number().int().min(1).max(100).optional(),
  criticalThreshold: z.number().int().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
})

// =============================================================================
// ADJUSTMENTS
// =============================================================================

export const adjustBudgetSchema = z.object({
  id: z.string().uuid(),
  newAmount: z.number().positive(),
  adjustmentType: z.enum(['INCREASE', 'DECREASE', 'REALLOCATION']),
  reason: z.string().min(1, 'Reason is required'),
})

export const rolloverBudgetSchema = z.object({
  fromBudgetId: z.string().uuid(),
  toYear: z.number().int().min(2020).max(2100),
  toMonth: z.number().int().min(1).max(12).optional(),
  toQuarter: z.number().int().min(1).max(4).optional(),
  rolloverPercentage: z.number().min(0).max(100).default(100), // % of remaining to rollover
})

// =============================================================================
// FILTERS
// =============================================================================

export const budgetFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  year: z.number().int().optional(),
  periodType: budgetPeriodTypeEnum.optional(),
  isActive: z.boolean().optional(),
  overWarning: z.boolean().optional(),    // Only show > warning threshold
  overCritical: z.boolean().optional(),   // Only show > critical threshold
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const budgetIdSchema = z.object({
  id: z.string().uuid(),
})

// =============================================================================
// BULK OPERATIONS
// =============================================================================

export const copyBudgetsSchema = z.object({
  fromYear: z.number().int(),
  fromMonth: z.number().int().min(1).max(12).optional(),
  fromQuarter: z.number().int().min(1).max(4).optional(),
  toYear: z.number().int(),
  toMonth: z.number().int().min(1).max(12).optional(),
  toQuarter: z.number().int().min(1).max(4).optional(),
  adjustmentPercent: z.number().min(-50).max(100).default(0), // % increase/decrease
  propertyIds: z.array(z.string().uuid()).optional(), // Specific properties or all
})

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalCommitted: number
  totalRemaining: number
  overallPercentUsed: number
  budgetsOverWarning: number
  budgetsOverCritical: number
  onTrackCount: number
}

export interface BudgetWithStatus {
  id: string
  name: string
  propertyId: string | null
  propertyName: string | null
  category: string | null
  periodType: BudgetPeriodType
  periodLabel: string // "January 2026", "Q1 2026", "2026"
  budgetAmount: number
  spentAmount: number
  committedAmount: number
  remainingAmount: number
  percentUsed: number
  status: 'on-track' | 'warning' | 'critical' | 'over'
  warningThreshold: number
  criticalThreshold: number
  isActive: boolean
}

export interface BudgetVsActual {
  period: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
  status: 'under' | 'on-track' | 'over'
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>
export type AdjustBudgetInput = z.infer<typeof adjustBudgetSchema>
export type CopyBudgetsInput = z.infer<typeof copyBudgetsSchema>
```

---

### 2.3 Budget API Endpoints

**File**: `src/services/maintenance-budgets.api.ts`

| Function | Method | Description | Auth |
|----------|--------|-------------|------|
| `getBudgets` | GET | List budgets with filters | ✅ |
| `getBudget` | GET | Get single budget | ✅ |
| `createBudget` | POST | Create new budget | ✅ |
| `updateBudget` | POST | Update budget details | ✅ |
| `deleteBudget` | POST | Delete budget | ✅ |
| `adjustBudget` | POST | Adjust amount with audit trail | ✅ |
| `getBudgetSummary` | GET | Overall budget health | ✅ |
| `getBudgetAlerts` | GET | Budgets over threshold | ✅ |
| `recalculateBudgetSpend` | POST | Refresh spent amounts | ✅ |
| `copyBudgetsToNextPeriod` | POST | Clone budgets | ✅ |
| `rolloverBudget` | POST | Rollover remaining to next period | ✅ |
| `getBudgetVsActual` | GET | Variance analysis | ✅ |
| `getBudgetHistory` | GET | Historical budget performance | ✅ |
| `getAdjustmentHistory` | GET | Budget change audit trail | ✅ |

**Implementation Notes**:

```typescript
// Calculate spent amount from completed work orders
export async function calculateBudgetSpend(budget: MaintenanceBudget) {
  const { startDate, endDate } = getPeriodDates(budget)

  const where: Prisma.MaintenanceRequestWhereInput = {
    status: 'COMPLETED',
    completedAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(budget.propertyId && {
      unit: { propertyId: budget.propertyId },
    }),
    ...(budget.category && {
      category: budget.category,
    }),
  }

  const result = await prisma.maintenanceRequest.aggregate({
    where,
    _sum: { actualCost: true },
  })

  return Number(result._sum.actualCost || 0)
}

// Calculate committed amount from scheduled/in-progress work orders
export async function calculateBudgetCommitted(budget: MaintenanceBudget) {
  const { startDate, endDate } = getPeriodDates(budget)

  const where: Prisma.MaintenanceRequestWhereInput = {
    status: { in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING_PARTS'] },
    scheduledDate: {
      gte: startDate,
      lte: endDate,
    },
    ...(budget.propertyId && {
      unit: { propertyId: budget.propertyId },
    }),
    ...(budget.category && {
      category: budget.category,
    }),
  }

  const result = await prisma.maintenanceRequest.aggregate({
    where,
    _sum: { estimatedCost: true },
  })

  return Number(result._sum.estimatedCost || 0)
}

// Helper to get period date range
function getPeriodDates(budget: MaintenanceBudget): { startDate: Date; endDate: Date } {
  const { year, month, quarter, periodType } = budget

  switch (periodType) {
    case 'MONTHLY':
      return {
        startDate: new Date(year, month! - 1, 1),
        endDate: endOfMonth(new Date(year, month! - 1, 1)),
      }
    case 'QUARTERLY':
      const quarterStartMonth = (quarter! - 1) * 3
      return {
        startDate: new Date(year, quarterStartMonth, 1),
        endDate: endOfMonth(new Date(year, quarterStartMonth + 2, 1)),
      }
    case 'ANNUALLY':
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59),
      }
  }
}
```

---

### 2.4 Budget React Query Hooks

**File**: `src/services/maintenance-budgets.query.ts`

```typescript
// Query keys
export const budgetKeys = {
  all: ['maintenance-budgets'] as const,
  list: (filters: BudgetFilters) => [...budgetKeys.all, 'list', filters] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
  summary: () => [...budgetKeys.all, 'summary'] as const,
  alerts: () => [...budgetKeys.all, 'alerts'] as const,
  vsActual: (filters: BudgetFilters) => [...budgetKeys.all, 'vs-actual', filters] as const,
  history: (id: string) => [...budgetKeys.all, 'history', id] as const,
  adjustments: (id: string) => [...budgetKeys.all, 'adjustments', id] as const,
}

// Query options
export const budgetsQueryOptions = (filters: BudgetFilters) => queryOptions({ ... })
export const budgetQueryOptions = (id: string) => queryOptions({ ... })
export const budgetSummaryQueryOptions = () => queryOptions({ ... })
export const budgetAlertsQueryOptions = () => queryOptions({ ... })
export const budgetVsActualQueryOptions = (filters: BudgetFilters) => queryOptions({ ... })

// Suspense hooks
export const useBudgetsQuery = (filters: BudgetFilters) => useSuspenseQuery(...)
export const useBudgetQuery = (id: string) => useSuspenseQuery(...)
export const useBudgetSummaryQuery = () => useSuspenseQuery(...)
export const useBudgetAlertsQuery = () => useSuspenseQuery(...)

// Mutations
export const useCreateBudgetMutation = () => useMutation(...)
export const useUpdateBudgetMutation = () => useMutation(...)
export const useDeleteBudgetMutation = () => useMutation(...)
export const useAdjustBudgetMutation = () => useMutation(...)
export const useCopyBudgetsMutation = () => useMutation(...)
export const useRolloverBudgetMutation = () => useMutation(...)
```

---

### 2.5 Budget UI Components

| Component | File | Description |
|-----------|------|-------------|
| `BudgetCard` | `src/components/maintenance/budget-card.tsx` | Single budget with progress gauge |
| `BudgetGrid` | `src/components/maintenance/budget-grid.tsx` | Grid of budget cards |
| `BudgetForm` | `src/components/maintenance/budget-form.tsx` | Create/edit budget form |
| `BudgetAdjustDialog` | `src/components/maintenance/budget-adjust-dialog.tsx` | Adjust amount with reason |
| `BudgetAlertsBanner` | `src/components/maintenance/budget-alerts-banner.tsx` | Warning/critical alerts |
| `BudgetSummaryCard` | `src/components/maintenance/budget-summary-card.tsx` | Overall budget health |
| `BudgetVsActualChart` | `src/components/maintenance/budget-vs-actual-chart.tsx` | Bar chart comparison |
| `BudgetHistoryTable` | `src/components/maintenance/budget-history-table.tsx` | Adjustment audit trail |
| `CopyBudgetsDialog` | `src/components/maintenance/copy-budgets-dialog.tsx` | Clone to next period |

**BudgetCard Features**:
- Circular progress gauge (color changes: green → yellow → red)
- Budget amount and spent amount
- Remaining and committed amounts
- Quick adjust button
- Status badge (On Track, Warning, Critical, Over)
- Trend indicator (up/down arrow vs last period)

---

### 2.6 Budget Routes

**New route**: `src/routes/app.maintenance.budgets.tsx`

```
/app/maintenance/budgets
├── Period selector (month/quarter/year)
├── Summary cards row
├── Alerts banner (if any over threshold)
├── Budget grid by property
├── Budget grid by category
└── Create budget button
```

**New route**: `src/routes/app.maintenance.budgets.$budgetId.tsx`

```
/app/maintenance/budgets/:budgetId
├── Budget details
├── Spend breakdown (pie chart by category)
├── Related work orders list
├── Adjustment history
└── Edit/adjust actions
```

---

## Phase 2: Threshold Alerts

### 2.7 Alert System

**File**: `src/server/budget-alerts.ts`

```typescript
import { prisma } from '~/server/db'
import { sendEmail } from '~/server/email'
import { BudgetThresholdEmail } from '~/emails/budget-threshold-email'

interface AlertResult {
  budgetId: string
  alertType: 'warning' | 'critical'
  sent: boolean
}

export async function checkBudgetThresholds(): Promise<AlertResult[]> {
  const results: AlertResult[] = []

  // Find budgets that have crossed thresholds but haven't been alerted
  const budgetsNeedingWarning = await prisma.maintenanceBudget.findMany({
    where: {
      isActive: true,
      percentUsed: { gte: prisma.raw('warning_threshold') },
      warningAlertSentAt: null,
    },
    include: {
      property: true,
      createdBy: true,
    },
  })

  for (const budget of budgetsNeedingWarning) {
    const isCritical = Number(budget.percentUsed) >= budget.criticalThreshold
    const alertType = isCritical ? 'critical' : 'warning'

    // Get property manager email
    const manager = budget.property?.managerId
      ? await prisma.user.findUnique({ where: { id: budget.property.managerId } })
      : budget.createdBy

    if (manager?.email) {
      await sendEmail({
        to: manager.email,
        subject: `[${alertType.toUpperCase()}] Maintenance Budget Alert: ${budget.name}`,
        react: BudgetThresholdEmail({
          budgetName: budget.name,
          propertyName: budget.property?.name || 'All Properties',
          budgetAmount: Number(budget.budgetAmount),
          spentAmount: Number(budget.spentAmount),
          percentUsed: Number(budget.percentUsed),
          alertType,
          threshold: isCritical ? budget.criticalThreshold : budget.warningThreshold,
        }),
      })

      // Mark as sent
      await prisma.maintenanceBudget.update({
        where: { id: budget.id },
        data: isCritical
          ? { criticalAlertSentAt: new Date(), warningAlertSentAt: new Date() }
          : { warningAlertSentAt: new Date() },
      })

      results.push({ budgetId: budget.id, alertType, sent: true })
    }
  }

  return results
}

// Call this after any work order cost update
export async function updateBudgetSpendAndCheckAlerts(requestId: string) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      unit: { include: { property: true } },
    },
  })

  if (!request) return

  // Find matching budgets
  const budgets = await prisma.maintenanceBudget.findMany({
    where: {
      isActive: true,
      OR: [
        { propertyId: request.unit.propertyId },
        { propertyId: null }, // Global budgets
      ],
      OR: [
        { category: request.category },
        { category: null }, // All-category budgets
      ],
    },
  })

  for (const budget of budgets) {
    const spent = await calculateBudgetSpend(budget)
    const committed = await calculateBudgetCommitted(budget)
    const percentUsed = (spent / Number(budget.budgetAmount)) * 100

    await prisma.maintenanceBudget.update({
      where: { id: budget.id },
      data: {
        spentAmount: spent,
        committedAmount: committed,
        remainingAmount: Number(budget.budgetAmount) - spent,
        percentUsed,
      },
    })
  }

  // Check if any alerts need to be sent
  await checkBudgetThresholds()
}
```

---

### 2.8 Budget Alert Email Template

**File**: `src/emails/budget-threshold-email.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BudgetThresholdEmailProps {
  budgetName: string
  propertyName: string
  budgetAmount: number
  spentAmount: number
  percentUsed: number
  alertType: 'warning' | 'critical'
  threshold: number
}

export function BudgetThresholdEmail({
  budgetName,
  propertyName,
  budgetAmount,
  spentAmount,
  percentUsed,
  alertType,
  threshold,
}: BudgetThresholdEmailProps) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const isWarning = alertType === 'warning'
  const bgColor = isWarning ? '#fef3c7' : '#fee2e2'
  const textColor = isWarning ? '#92400e' : '#991b1b'

  return (
    <Html>
      <Head />
      <Preview>
        {alertType === 'critical' ? '🚨' : '⚠️'} Budget {percentUsed.toFixed(0)}% used: {budgetName}
      </Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: '20px', maxWidth: '600px' }}>
          <Section style={{ backgroundColor: bgColor, padding: '20px', borderRadius: '8px' }}>
            <Heading style={{ color: textColor, fontSize: '24px', margin: '0 0 10px' }}>
              {alertType === 'critical' ? '🚨 Critical' : '⚠️ Warning'}: Budget Threshold Exceeded
            </Heading>
            <Text style={{ color: textColor, margin: 0 }}>
              The maintenance budget "{budgetName}" has exceeded {threshold}% of its limit.
            </Text>
          </Section>

          <Section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <Text><strong>Property:</strong> {propertyName}</Text>
            <Text><strong>Budget:</strong> {formatCurrency(budgetAmount)}</Text>
            <Text><strong>Spent:</strong> {formatCurrency(spentAmount)}</Text>
            <Text><strong>Usage:</strong> {percentUsed.toFixed(1)}%</Text>
            <Text><strong>Remaining:</strong> {formatCurrency(budgetAmount - spentAmount)}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## Phase 2: Budget vs Actual Reporting

### 2.9 Enhanced Cost Reporting API

**Update**: `src/services/cost-reporting.api.ts`

Add these new endpoints:

| Function | Method | Description |
|----------|--------|-------------|
| `getBudgetVsActualSummary` | GET | Overall budget performance |
| `getBudgetVsActualByProperty` | GET | Property-level variance |
| `getBudgetVsActualByCategory` | GET | Category-level variance |
| `getBudgetVsActualTrend` | GET | Historical performance |

**Implementation**:

```typescript
export const getBudgetVsActualSummary = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(budgetVsActualFiltersSchema))
  .handler(async ({ context, data }) => {
    const { year, month, quarter, periodType, propertyId } = data

    // Get budgets for the period
    const budgets = await prisma.maintenanceBudget.findMany({
      where: {
        property: { managerId: context.auth.user.id },
        isActive: true,
        year,
        ...(month && { month }),
        ...(quarter && { quarter }),
        ...(periodType && { periodType }),
        ...(propertyId && { propertyId }),
      },
    })

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgetAmount), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spentAmount), 0)
    const variance = totalBudget - totalSpent
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0

    // Status determination
    let status: 'under' | 'on-track' | 'over'
    if (variancePercent > 10) status = 'under'
    else if (variancePercent < -10) status = 'over'
    else status = 'on-track'

    // Group by property
    const byProperty = await Promise.all(
      budgets
        .filter(b => b.propertyId)
        .reduce((acc, b) => {
          const existing = acc.find(x => x.propertyId === b.propertyId)
          if (existing) {
            existing.budget += Number(b.budgetAmount)
            existing.actual += Number(b.spentAmount)
          } else {
            acc.push({
              propertyId: b.propertyId!,
              budget: Number(b.budgetAmount),
              actual: Number(b.spentAmount),
            })
          }
          return acc
        }, [] as { propertyId: string; budget: number; actual: number }[])
        .map(async (item) => {
          const property = await prisma.property.findUnique({
            where: { id: item.propertyId },
            select: { name: true },
          })
          return {
            id: item.propertyId,
            name: property?.name || 'Unknown',
            budget: item.budget,
            actual: item.actual,
            variance: item.budget - item.actual,
            variancePercent: item.budget > 0 ? ((item.budget - item.actual) / item.budget) * 100 : 0,
          }
        })
    )

    return {
      period: getPeriodLabel(year, month, quarter, periodType),
      totalBudget,
      totalSpent,
      variance,
      variancePercent,
      status,
      byProperty,
    }
  })
```

---

## Database Migrations

### Migration Order

Execute these migrations in order:

1. **001_cost_line_items** - Cost line items table
2. **002_maintenance_invoices** - Invoice management
3. **003_maintenance_budgets** - Budget tracking
4. **004_budget_adjustments** - Budget audit trail

### Migration Commands

```bash
# Generate migrations
pnpm prisma migrate dev --name cost_line_items
pnpm prisma migrate dev --name maintenance_invoices
pnpm prisma migrate dev --name maintenance_budgets
pnpm prisma migrate dev --name budget_adjustments

# Apply to production
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

---

## Implementation Order

### Sprint 1 (Week 1-2): Cost Line Items

| # | Task | Est | Priority |
|---|------|-----|----------|
| 1 | Add Prisma schema for `MaintenanceCostLineItem` | 2h | P0 |
| 2 | Run migration | 0.5h | P0 |
| 3 | Create `cost-line-items.schema.ts` | 1h | P0 |
| 4 | Create `cost-line-items.api.ts` (all endpoints) | 4h | P0 |
| 5 | Create `cost-line-items.query.ts` | 2h | P0 |
| 6 | Build `CostLineItemsTable` component | 4h | P0 |
| 7 | Build `AddCostLineItemDialog` component | 2h | P0 |
| 8 | Build `CostBreakdownCard` component | 2h | P1 |
| 9 | Integrate into work order detail page | 2h | P0 |
| 10 | Add auto-sync with MaintenanceRequest.actualCost | 2h | P0 |
| 11 | Unit tests for API | 3h | P1 |
| 12 | Component tests | 2h | P1 |

**Sprint 1 Total**: ~26h

### Sprint 2 (Week 3-4): Invoice Management

| # | Task | Est | Priority |
|---|------|-----|----------|
| 1 | Add Prisma schema for `MaintenanceInvoice` | 2h | P0 |
| 2 | Run migration | 0.5h | P0 |
| 3 | Create `maintenance-invoices.schema.ts` | 1.5h | P0 |
| 4 | Create `maintenance-invoices.api.ts` (all endpoints) | 6h | P0 |
| 5 | Create `maintenance-invoices.query.ts` | 2h | P0 |
| 6 | Build `InvoiceUploadCard` component | 3h | P0 |
| 7 | Build `InvoiceTable` component | 3h | P0 |
| 8 | Build `InvoiceDetailDialog` component | 2h | P0 |
| 9 | Build `InvoiceApprovalActions` component | 2h | P0 |
| 10 | Build `InvoicePaymentDialog` component | 2h | P1 |
| 11 | Create `/app/maintenance/invoices` route | 3h | P0 |
| 12 | Integrate invoice upload into work order detail | 2h | P0 |
| 13 | Link invoice to expense system | 2h | P1 |
| 14 | Unit tests | 3h | P1 |
| 15 | E2E tests | 2h | P1 |

**Sprint 2 Total**: ~36h

### Sprint 3 (Week 5-6): Budget Management

| # | Task | Est | Priority |
|---|------|-----|----------|
| 1 | Add Prisma schema for `MaintenanceBudget` | 2h | P0 |
| 2 | Add Prisma schema for `BudgetAdjustment` | 1h | P0 |
| 3 | Run migrations | 0.5h | P0 |
| 4 | Create `maintenance-budgets.schema.ts` | 2h | P0 |
| 5 | Create `maintenance-budgets.api.ts` (all endpoints) | 6h | P0 |
| 6 | Create `maintenance-budgets.query.ts` | 2h | P0 |
| 7 | Implement budget spend calculation | 2h | P0 |
| 8 | Build `BudgetCard` component | 3h | P0 |
| 9 | Build `BudgetGrid` component | 2h | P0 |
| 10 | Build `BudgetForm` component | 3h | P0 |
| 11 | Build `BudgetAdjustDialog` component | 2h | P1 |
| 12 | Build `BudgetSummaryCard` component | 2h | P0 |
| 13 | Create `/app/maintenance/budgets` route | 4h | P0 |
| 14 | Create `/app/maintenance/budgets/$budgetId` route | 3h | P1 |
| 15 | Unit tests | 3h | P1 |

**Sprint 3 Total**: ~38h

### Sprint 4 (Week 7-8): Alerts & Reporting

| # | Task | Est | Priority |
|---|------|-----|----------|
| 1 | Create `budget-alerts.ts` server module | 3h | P0 |
| 2 | Create `BudgetThresholdEmail` template | 2h | P0 |
| 3 | Integrate alerts with work order completion | 2h | P0 |
| 4 | Build `BudgetAlertsBanner` component | 2h | P0 |
| 5 | Add budget vs actual to cost-reporting API | 3h | P0 |
| 6 | Build `BudgetVsActualChart` component | 3h | P0 |
| 7 | Build `BudgetHistoryTable` component | 2h | P1 |
| 8 | Build `CopyBudgetsDialog` component | 2h | P1 |
| 9 | Update cost dashboard with budget widgets | 3h | P0 |
| 10 | Build `OverdueInvoicesWidget` for dashboard | 2h | P1 |
| 11 | Integration tests for alerts | 3h | P1 |
| 12 | E2E tests for full workflow | 4h | P1 |
| 13 | Documentation update | 2h | P2 |

**Sprint 4 Total**: ~33h

---

## Testing Requirements

### Unit Tests

```typescript
// cost-line-items.api.test.ts
describe('Cost Line Items API', () => {
  describe('createCostLineItem', () => {
    it('should create line item and update actualCost', async () => { ... })
    it('should calculate totalCost automatically', async () => { ... })
    it('should reject negative quantities', async () => { ... })
    it('should require authorization', async () => { ... })
  })

  describe('getCostLineItemSummary', () => {
    it('should correctly aggregate by type', async () => { ... })
    it('should calculate tenant charges', async () => { ... })
  })
})

// maintenance-budgets.api.test.ts
describe('Maintenance Budgets API', () => {
  describe('createBudget', () => {
    it('should create monthly budget', async () => { ... })
    it('should prevent duplicate budgets', async () => { ... })
    it('should require month for monthly period', async () => { ... })
  })

  describe('recalculateBudgetSpend', () => {
    it('should sum completed work orders', async () => { ... })
    it('should filter by category when set', async () => { ... })
    it('should filter by property when set', async () => { ... })
  })

  describe('budget alerts', () => {
    it('should send warning at threshold', async () => { ... })
    it('should send critical at threshold', async () => { ... })
    it('should not resend alerts', async () => { ... })
  })
})
```

### Integration Tests

```typescript
// invoice-workflow.test.ts
describe('Invoice Workflow', () => {
  it('should complete full invoice lifecycle', async () => {
    // Create work order
    // Add cost line items
    // Upload invoice
    // Approve invoice
    // Mark as paid
    // Verify expense created
  })
})

// budget-tracking.test.ts
describe('Budget Tracking', () => {
  it('should update budget when work order completed', async () => {
    // Create budget for property
    // Create work order
    // Add costs
    // Complete work order
    // Verify budget.spentAmount updated
    // Verify alert sent if over threshold
  })
})
```

### E2E Tests

```typescript
// costs.spec.ts (Playwright)
test.describe('Cost Management', () => {
  test('add line items to work order', async ({ page }) => {
    await page.goto('/app/maintenance/WO-123')
    await page.click('[data-testid="costs-tab"]')
    await page.click('[data-testid="add-line-item"]')
    // Fill form
    await page.click('[data-testid="save-line-item"]')
    // Verify in table
  })

  test('create and track budget', async ({ page }) => {
    await page.goto('/app/maintenance/budgets')
    await page.click('[data-testid="create-budget"]')
    // Fill form
    await page.click('[data-testid="save-budget"]')
    // Verify budget card appears
  })
})
```

---

## File Checklist

### New Files to Create

**Services**:
- [ ] `src/services/cost-line-items.schema.ts`
- [ ] `src/services/cost-line-items.api.ts`
- [ ] `src/services/cost-line-items.query.ts`
- [ ] `src/services/maintenance-invoices.schema.ts`
- [ ] `src/services/maintenance-invoices.api.ts`
- [ ] `src/services/maintenance-invoices.query.ts`
- [ ] `src/services/maintenance-budgets.schema.ts`
- [ ] `src/services/maintenance-budgets.api.ts`
- [ ] `src/services/maintenance-budgets.query.ts`

**Components**:
- [ ] `src/components/maintenance/cost-line-items-table.tsx`
- [ ] `src/components/maintenance/add-cost-line-item-dialog.tsx`
- [ ] `src/components/maintenance/cost-breakdown-card.tsx`
- [ ] `src/components/maintenance/invoice-upload-card.tsx`
- [ ] `src/components/maintenance/invoice-table.tsx`
- [ ] `src/components/maintenance/invoice-detail-dialog.tsx`
- [ ] `src/components/maintenance/invoice-approval-actions.tsx`
- [ ] `src/components/maintenance/invoice-payment-dialog.tsx`
- [ ] `src/components/maintenance/budget-card.tsx`
- [ ] `src/components/maintenance/budget-grid.tsx`
- [ ] `src/components/maintenance/budget-form.tsx`
- [ ] `src/components/maintenance/budget-adjust-dialog.tsx`
- [ ] `src/components/maintenance/budget-alerts-banner.tsx`
- [ ] `src/components/maintenance/budget-summary-card.tsx`
- [ ] `src/components/maintenance/budget-vs-actual-chart.tsx`

**Routes**:
- [ ] `src/routes/app.maintenance.invoices.tsx`
- [ ] `src/routes/app.maintenance.invoices.$invoiceId.tsx`
- [ ] `src/routes/app.maintenance.budgets.tsx`
- [ ] `src/routes/app.maintenance.budgets.$budgetId.tsx`

**Server**:
- [ ] `src/server/budget-alerts.ts`

**Emails**:
- [ ] `src/emails/budget-threshold-email.tsx`

**Tests**:
- [ ] `tests/unit/cost-line-items.api.test.ts`
- [ ] `tests/unit/maintenance-invoices.api.test.ts`
- [ ] `tests/unit/maintenance-budgets.api.test.ts`
- [ ] `tests/integration/invoice-workflow.test.ts`
- [ ] `tests/integration/budget-tracking.test.ts`
- [ ] `tests/e2e/costs.spec.ts`
- [ ] `tests/e2e/budgets.spec.ts`

### Files to Modify

- [ ] `prisma/schema.prisma` - Add new models
- [ ] `src/routes/app.maintenance.$workOrderId.tsx` - Add costs tab
- [ ] `src/routes/app.maintenance.costs.tsx` - Add budget widgets
- [ ] `src/services/cost-reporting.api.ts` - Add budget vs actual
- [ ] `src/services/maintenance.api.ts` - Trigger budget updates

---

*Document Version: 1.0*
*Created: 2026-01-05*
*Total Estimated Effort: ~133 hours (4 sprints)*
