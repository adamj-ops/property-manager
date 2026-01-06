# Sprint 3: Budget Management - Implementation Plan

## Overview

This sprint adds comprehensive budget management capabilities to the Property Manager application, allowing property managers to set maintenance budgets by property and category, track spending against those budgets, and visualize budget vs actual performance.

---

## Epic 3 Sprint 3 Deliverables

1. **MaintenanceBudget model** (property/category/time period)
2. **Budget CRUD operations** (API + server functions)
3. **Budget allocation UI** (create/edit/list budgets)
4. **Budget vs Actual comparison view** (dashboard + reporting)

---

## Implementation Tasks

### Phase 1: Database Schema (MaintenanceBudget Model)

**File:** `prisma/schema.prisma`

#### Task 1.1: Add BudgetPeriod Enum
```prisma
enum BudgetPeriod {
  MONTHLY
  QUARTERLY
  ANNUAL
}
```

#### Task 1.2: Add MaintenanceBudget Model
```prisma
model MaintenanceBudget {
  id                    String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Scope - Link to property
  propertyId            String              @db.Uuid
  property              Property            @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  // Category - uses existing MaintenanceCategory enum
  category              MaintenanceCategory

  // Budget Configuration
  budgetAmount          Decimal             @db.Decimal(12, 2)
  period                BudgetPeriod        @default(ANNUAL)

  // Time Range
  fiscalYear            Int                 // e.g., 2026
  startDate             DateTime
  endDate               DateTime

  // Tracking (denormalized for performance)
  spentAmount           Decimal             @default(0) @db.Decimal(12, 2)
  committedAmount       Decimal             @default(0) @db.Decimal(12, 2)  // In-progress work orders

  // Alerts
  warningThreshold      Int                 @default(80)   // Percentage
  criticalThreshold     Int                 @default(95)   // Percentage

  // Status
  isActive              Boolean             @default(true)
  notes                 String?

  // Metadata
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  createdById           String              @db.Uuid

  // Unique constraint: one budget per property/category/period/year
  @@unique([propertyId, category, period, fiscalYear])
  @@index([propertyId])
  @@index([fiscalYear])
  @@index([isActive])
  @@map("maintenance_budgets")
}
```

#### Task 1.3: Add BudgetAlert Model (for alert history)
```prisma
model BudgetAlert {
  id                String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  budgetId          String            @db.Uuid
  budget            MaintenanceBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  alertType         String            // "WARNING" | "CRITICAL" | "EXCEEDED"
  thresholdPercent  Int
  spentAmount       Decimal           @db.Decimal(12, 2)
  budgetAmount      Decimal           @db.Decimal(12, 2)

  message           String

  acknowledgedAt    DateTime?
  acknowledgedById  String?           @db.Uuid

  createdAt         DateTime          @default(now())

  @@index([budgetId])
  @@index([createdAt])
  @@map("budget_alerts")
}
```

#### Task 1.4: Update Property Model
Add relation to MaintenanceBudget in the Property model:
```prisma
// In Property model, add:
maintenanceBudgets  MaintenanceBudget[]
```

#### Task 1.5: Run Prisma Migration
```bash
npx prisma migrate dev --name add_maintenance_budget
npx prisma generate
```

---

### Phase 2: Zod Validation Schemas

**File:** `src/services/maintenance-budget.schema.ts` (new file)

#### Task 2.1: Create Budget Schemas
```typescript
import { z } from 'zod'
import { maintenanceCategoryEnum } from './maintenance.schema'

export const budgetPeriodEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])

export const createBudgetSchema = z.object({
  propertyId: z.string().uuid(),
  category: maintenanceCategoryEnum,
  budgetAmount: z.number().positive().max(999999999.99),
  period: budgetPeriodEnum,
  fiscalYear: z.number().int().min(2020).max(2100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  warningThreshold: z.number().int().min(1).max(100).default(80),
  criticalThreshold: z.number().int().min(1).max(100).default(95),
  notes: z.string().max(1000).optional(),
})

export const updateBudgetSchema = createBudgetSchema.partial().omit({
  propertyId: true,
  category: true,
  period: true,
  fiscalYear: true,
})

export const budgetFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  period: budgetPeriodEnum.optional(),
  fiscalYear: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const acknowledgeBudgetAlertSchema = z.object({
  alertId: z.string().uuid(),
})

// Types
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>
```

---

### Phase 3: API Server Functions (CRUD Operations)

**File:** `src/services/maintenance-budget.api.ts` (new file)

#### Task 3.1: List Budgets with Spending Calculations
```typescript
export const getBudgets = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(budgetFiltersSchema)
  .handler(async ({ data: filters, context }) => {
    // Get budgets with calculated spending from MaintenanceRequests
    // Join with actual cost data
    // Return list with variance calculations
  })
```

#### Task 3.2: Get Single Budget with Details
```typescript
export const getBudget = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Get budget with:
    // - Related property info
    // - Spending breakdown by month
    // - Linked work orders
    // - Alert history
  })
```

#### Task 3.3: Create Budget
```typescript
export const createBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(createBudgetSchema)
  .handler(async ({ data, context }) => {
    // Verify property ownership
    // Check for duplicate budget (same property/category/period/year)
    // Create budget record
    // Calculate initial spending from existing work orders
  })
```

#### Task 3.4: Update Budget
```typescript
export const updateBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(z.object({ id: z.string().uuid(), data: updateBudgetSchema }))
  .handler(async ({ data, context }) => {
    // Verify ownership
    // Update budget
    // Recalculate alert thresholds if changed
  })
```

#### Task 3.5: Delete/Deactivate Budget
```typescript
export const deleteBudget = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Soft delete (set isActive = false)
    // Keep historical data for reporting
  })
```

#### Task 3.6: Get Budget Health Summary
```typescript
export const getBudgetHealth = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(z.object({
    propertyId: z.string().uuid().optional(),
    fiscalYear: z.number().int().optional()
  }))
  .handler(async ({ data, context }) => {
    // Return aggregated budget health:
    // - Total budgeted amount
    // - Total spent
    // - Total committed (in-progress)
    // - Categories over/under budget
    // - Properties with alerts
  })
```

#### Task 3.7: Update Spending (triggered when work order costs change)
```typescript
export const recalculateBudgetSpending = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(z.object({ budgetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Calculate actual spending from completed MaintenanceRequests
    // Calculate committed from in-progress work orders
    // Update spentAmount and committedAmount
    // Check thresholds and create alerts if needed
  })
```

#### Task 3.8: Acknowledge Budget Alert
```typescript
export const acknowledgeBudgetAlert = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(acknowledgeBudgetAlertSchema)
  .handler(async ({ data, context }) => {
    // Mark alert as acknowledged
    // Record who acknowledged and when
  })
```

#### Task 3.9: Get Budget vs Actual Comparison
```typescript
export const getBudgetVsActual = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(z.object({
    propertyId: z.string().uuid().optional(),
    fiscalYear: z.number().int(),
    period: budgetPeriodEnum.optional(),
    groupBy: z.enum(['category', 'property', 'month']).default('category')
  }))
  .handler(async ({ data, context }) => {
    // Return comparison data:
    // - Budget amount per group
    // - Actual spent per group
    // - Variance (amount and percentage)
    // - Trend over time periods
  })
```

---

### Phase 4: React Query Hooks

**File:** `src/services/maintenance-budget.query.ts` (new file)

#### Task 4.1: Create Query Hooks
```typescript
// List budgets
export const useBudgetsQuery = (filters?: BudgetFilters) => {...}

// Single budget with details
export const useBudgetQuery = (id: string) => {...}

// Budget health summary
export const useBudgetHealthQuery = (propertyId?: string, fiscalYear?: number) => {...}

// Budget vs Actual comparison
export const useBudgetVsActualQuery = (params: BudgetVsActualParams) => {...}

// Mutations
export const useCreateBudget = () => {...}
export const useUpdateBudget = () => {...}
export const useDeleteBudget = () => {...}
export const useAcknowledgeAlert = () => {...}
```

---

### Phase 5: Budget Allocation UI

#### Task 5.1: Budget List Route
**File:** `src/routes/app.maintenance.budgets.tsx` (new file)

Features:
- List all budgets with spending progress bars
- Filter by property, category, period, year
- Health indicators (green/yellow/red based on spending %)
- Quick actions: edit, deactivate
- "Create Budget" button

#### Task 5.2: Budget Detail/Edit Route
**File:** `src/routes/app.maintenance.budgets.$budgetId.tsx` (new file)

Features:
- Budget configuration form
- Spending breakdown chart
- Linked work orders list
- Alert history
- Edit/delete actions

#### Task 5.3: Create Budget Form Component
**File:** `src/components/maintenance/BudgetForm.tsx` (new file)

Features:
- Property selector (dropdown)
- Category selector (multi-select or single)
- Period selector (Monthly/Quarterly/Annual)
- Fiscal year picker
- Budget amount input (currency formatted)
- Threshold sliders (warning/critical %)
- Date range pickers (auto-calculated based on period/year)
- Notes textarea

#### Task 5.4: Budget Progress Component
**File:** `src/components/maintenance/BudgetProgress.tsx` (new file)

Features:
- Progress bar with color coding
- Spent vs Budget display
- Committed amount indicator
- Remaining budget
- Days remaining in period
- Projected spending (if trend continues)

#### Task 5.5: Budget Health Card Component
**File:** `src/components/maintenance/BudgetHealthCard.tsx` (new file)

Features:
- Summary card for dashboard
- Total budget / spent / remaining
- Number of categories at risk
- Quick links to problem areas

---

### Phase 6: Budget vs Actual Comparison View

#### Task 6.1: Budget Comparison Dashboard
**File:** `src/routes/app.maintenance.budgets.comparison.tsx` (new file)

Features:
- Fiscal year selector
- Property filter (optional)
- Multiple visualization options

#### Task 6.2: Comparison by Category Chart
**File:** `src/components/maintenance/BudgetCategoryComparison.tsx` (new file)

Features:
- Grouped bar chart: Budget vs Actual per category
- Color coding for over/under budget
- Variance % labels
- Click to drill down

#### Task 6.3: Comparison by Property Chart
**File:** `src/components/maintenance/BudgetPropertyComparison.tsx` (new file)

Features:
- Horizontal bar chart per property
- Budget line overlay
- Spending progress visualization

#### Task 6.4: Monthly Trend Chart
**File:** `src/components/maintenance/BudgetTrendChart.tsx` (new file)

Features:
- Line chart: Monthly spending vs budget
- Cumulative view option
- Forecast line (based on current trend)
- Budget threshold markers

#### Task 6.5: Variance Table Component
**File:** `src/components/maintenance/BudgetVarianceTable.tsx` (new file)

Features:
- Sortable table with:
  - Property / Category
  - Budget Amount
  - Actual Spent
  - Committed
  - Variance ($)
  - Variance (%)
  - Status indicator
- Export to CSV

---

### Phase 7: Integration & Enhancements

#### Task 7.1: Update Cost Reporting Dashboard
**File:** `src/routes/app.maintenance.costs.tsx`

Add:
- Budget comparison section
- "View Budget" links
- Budget health widget

#### Task 7.2: Update Work Order Creation
**File:** `src/services/maintenance.api.ts`

When a work order is created/updated/completed:
- Check if category has an active budget
- Update budget spending calculations
- Trigger alerts if thresholds exceeded

#### Task 7.3: Add Budget Navigation
**File:** `src/routes/app.maintenance.tsx`

Add "Budgets" tab to maintenance navigation:
- Budgets list
- Budget comparison sub-route

#### Task 7.4: Budget Alert Notifications
**File:** `src/server/budget-notifications.ts` (new file)

- Email notifications when thresholds are reached
- In-app notification integration
- Daily digest of budget status (optional)

---

## File Summary

### New Files to Create

| File | Description |
|------|-------------|
| `src/services/maintenance-budget.schema.ts` | Zod validation schemas |
| `src/services/maintenance-budget.api.ts` | Server functions for CRUD |
| `src/services/maintenance-budget.query.ts` | React Query hooks |
| `src/routes/app.maintenance.budgets.tsx` | Budget list page |
| `src/routes/app.maintenance.budgets.$budgetId.tsx` | Budget detail page |
| `src/routes/app.maintenance.budgets.comparison.tsx` | Comparison dashboard |
| `src/components/maintenance/BudgetForm.tsx` | Create/edit form |
| `src/components/maintenance/BudgetProgress.tsx` | Progress bar component |
| `src/components/maintenance/BudgetHealthCard.tsx` | Summary card |
| `src/components/maintenance/BudgetCategoryComparison.tsx` | Category chart |
| `src/components/maintenance/BudgetPropertyComparison.tsx` | Property chart |
| `src/components/maintenance/BudgetTrendChart.tsx` | Trend line chart |
| `src/components/maintenance/BudgetVarianceTable.tsx` | Variance data table |
| `src/server/budget-notifications.ts` | Alert notifications |

### Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add MaintenanceBudget, BudgetAlert models, BudgetPeriod enum |
| `src/routes/app.maintenance.tsx` | Add Budgets navigation tab |
| `src/routes/app.maintenance.costs.tsx` | Add budget integration widgets |
| `src/services/maintenance.api.ts` | Trigger budget recalculation on cost changes |

---

## Implementation Order

1. **Phase 1: Database Schema** - Foundation for all other work
2. **Phase 2: Validation Schemas** - Required for API
3. **Phase 3: API Functions** - Core CRUD operations
4. **Phase 4: Query Hooks** - Client-side data fetching
5. **Phase 5: Budget Allocation UI** - Primary user interface
6. **Phase 6: Comparison View** - Reporting and analysis
7. **Phase 7: Integration** - Connect to existing features

---

## Testing Checklist

- [ ] Budget CRUD operations work correctly
- [ ] Spending calculations are accurate (match work order costs)
- [ ] Threshold alerts trigger at correct percentages
- [ ] Budget progress updates when work orders change
- [ ] Comparison charts display correct data
- [ ] Variance calculations are accurate
- [ ] Property ownership authorization works
- [ ] Unique constraint prevents duplicate budgets
- [ ] Soft delete preserves historical data
- [ ] Export functionality works

---

## Success Criteria

1. Property managers can create budgets per property and category
2. Budgets support monthly, quarterly, and annual periods
3. Spending automatically calculates from completed work orders
4. Visual progress indicators show budget health
5. Alerts notify when spending approaches/exceeds thresholds
6. Comparison views show budget vs actual clearly
7. Integration with existing cost reporting dashboard
