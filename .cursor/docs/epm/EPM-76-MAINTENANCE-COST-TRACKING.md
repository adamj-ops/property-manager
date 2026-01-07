# EPM-76: Maintenance Cost Tracking — Enhanced Implementation Plan

**Epic**: 3.8 — Maintenance Cost Tracking
**Status**: Enhancement Phase
**Last Updated**: 2026-01-05
**Author**: Claude

---

## Executive Summary

The current implementation provides basic cost reporting with summary statistics, breakdowns by property/category/vendor, time-series trends, and top expensive work orders. This plan proposes significant enhancements to create a comprehensive cost management system including budgeting, forecasting, parts/labor tracking, invoice management, and approval workflows.

---

## Current Implementation Analysis

### What Exists Today

| Component | Location | Status |
|-----------|----------|--------|
| Cost Summary API | `src/services/cost-reporting.api.ts` | ✅ Complete |
| Cost by Property/Category/Vendor | `src/services/cost-reporting.api.ts` | ✅ Complete |
| Cost by Time Period | `src/services/cost-reporting.api.ts` | ✅ Complete |
| Top Expensive Requests | `src/services/cost-reporting.api.ts` | ✅ Complete |
| Cost Dashboard UI | `src/routes/app.maintenance.costs.tsx` | ✅ Complete |
| React Query Hooks | `src/services/cost-reporting.query.ts` | ✅ Complete |
| Zod Schemas | `src/services/cost-reporting.schema.ts` | ✅ Complete |

### Current Data Model (MaintenanceRequest)

```prisma
estimatedCost  Decimal? @db.Decimal(10, 2)
actualCost     Decimal? @db.Decimal(10, 2)
tenantCharge   Decimal? @db.Decimal(10, 2)
```

### Current Metrics

- Total Estimated vs Actual Cost
- Net Cost (actual - tenant charges)
- Average Cost per Request
- Budget Variance (savings vs estimate)
- Costs grouped by: Property, Category, Vendor, Time Period

---

## Proposed Enhancements

### Phase 1: Cost Details & Line Items (Priority: High)

#### 1.1 Cost Line Items Model

**Goal**: Break down costs into granular line items (parts, labor, materials, permits, etc.)

**New Prisma Model**:

```prisma
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

  type        CostLineItemType
  description String
  quantity    Decimal          @db.Decimal(10, 2) @default(1)
  unitCost    Decimal          @db.Decimal(10, 2)
  totalCost   Decimal          @db.Decimal(10, 2) // quantity * unitCost

  // For parts tracking
  partNumber  String?
  supplier    String?
  warranty    Boolean          @default(false)
  warrantyExpiry DateTime?

  // For labor tracking
  laborHours  Decimal?         @db.Decimal(5, 2)
  laborRate   Decimal?         @db.Decimal(10, 2)
  workerId    String?          // Vendor employee or staff

  // Receipts/Documentation
  receiptUrl  String?

  // Tenant chargeable
  chargeToTenant Boolean       @default(false)
  tenantChargeAmount Decimal?  @db.Decimal(10, 2)

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([requestId])
  @@index([type])
  @@map("maintenance_cost_line_items")
}
```

**API Endpoints** (`src/services/cost-line-items.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getCostLineItems` | GET | List line items for a work order |
| `addCostLineItem` | POST | Add new line item |
| `updateCostLineItem` | POST | Update existing line item |
| `deleteCostLineItem` | POST | Remove line item |
| `bulkAddCostLineItems` | POST | Add multiple line items at once |

**Zod Schemas** (`src/services/cost-line-items.schema.ts`):

```typescript
export const costLineItemTypeEnum = z.enum([
  'LABOR', 'PARTS', 'MATERIALS', 'PERMITS',
  'TRAVEL', 'EMERGENCY_FEE', 'DISPOSAL', 'SUBCONTRACTOR', 'OTHER'
])

export const createCostLineItemSchema = z.object({
  requestId: z.string().uuid(),
  type: costLineItemTypeEnum,
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitCost: z.number().nonnegative(),
  partNumber: z.string().optional(),
  supplier: z.string().optional(),
  warranty: z.boolean().default(false),
  warrantyExpiry: z.coerce.date().optional(),
  laborHours: z.number().positive().optional(),
  laborRate: z.number().positive().optional(),
  workerId: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  chargeToTenant: z.boolean().default(false),
  tenantChargeAmount: z.number().nonnegative().optional(),
})
```

**UI Components**:

- `src/components/maintenance/cost-line-items-table.tsx` — Editable table of line items
- `src/components/maintenance/add-cost-line-item-dialog.tsx` — Modal form for adding items
- `src/components/maintenance/cost-breakdown-summary.tsx` — Visual breakdown (labor vs parts pie chart)

---

#### 1.2 Invoice & Receipt Management

**Goal**: Attach and manage vendor invoices with approval tracking

**New Prisma Model**:

```prisma
enum InvoiceStatus {
  PENDING
  APPROVED
  DISPUTED
  PAID
  CANCELLED
}

model MaintenanceInvoice {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoiceNumber String
  requestId     String         @db.Uuid
  request       MaintenanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  vendorId      String?        @db.Uuid
  vendor        Vendor?        @relation(fields: [vendorId], references: [id])

  // Amounts
  subtotal      Decimal        @db.Decimal(10, 2)
  taxAmount     Decimal        @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal        @db.Decimal(10, 2)

  // Dates
  invoiceDate   DateTime
  dueDate       DateTime?
  paidDate      DateTime?

  // Status & Approval
  status        InvoiceStatus  @default(PENDING)
  approvedById  String?        @db.Uuid
  approvedBy    User?          @relation(fields: [approvedById], references: [id])
  approvedAt    DateTime?
  disputeReason String?

  // Documents
  invoiceUrl    String         // PDF or image

  // Payment tracking
  paymentMethod String?
  paymentReference String?

  // Link to expense system
  expenseId     String?        @unique @db.Uuid
  expense       Expense?       @relation(fields: [expenseId], references: [id])

  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([requestId])
  @@index([vendorId])
  @@index([status])
  @@index([dueDate])
  @@map("maintenance_invoices")
}
```

**API Endpoints** (`src/services/maintenance-invoices.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getInvoices` | GET | List invoices with filters |
| `getInvoice` | GET | Get single invoice details |
| `uploadInvoice` | POST | Upload and create invoice record |
| `approveInvoice` | POST | Approve invoice for payment |
| `disputeInvoice` | POST | Mark invoice as disputed |
| `markInvoicePaid` | POST | Record payment |
| `linkInvoiceToExpense` | POST | Connect to expense system |
| `getUnpaidInvoices` | GET | Dashboard: invoices due soon |
| `getInvoiceSummary` | GET | Total pending/paid amounts |

**UI Components**:

- `src/components/maintenance/invoice-upload.tsx` — Drag-drop invoice upload
- `src/components/maintenance/invoice-approval-card.tsx` — Approve/dispute actions
- `src/components/maintenance/invoices-due-widget.tsx` — Dashboard widget
- `src/routes/app.maintenance.invoices.tsx` — Invoice management page

---

### Phase 2: Budget Management (Priority: High)

#### 2.1 Maintenance Budgets

**Goal**: Set and track budgets at property, category, and time period levels

**New Prisma Model**:

```prisma
enum BudgetPeriod {
  MONTHLY
  QUARTERLY
  ANNUALLY
}

model MaintenanceBudget {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Scope
  propertyId  String?      @db.Uuid
  property    Property?    @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  category    MaintenanceCategory?

  // Budget details
  period      BudgetPeriod @default(MONTHLY)
  year        Int
  month       Int?         // 1-12 for monthly, null for annual
  quarter     Int?         // 1-4 for quarterly

  // Amounts
  budgetAmount    Decimal  @db.Decimal(12, 2)
  alertThreshold  Int      @default(80)  // Percentage to trigger warning
  criticalThreshold Int    @default(100) // Percentage to trigger critical alert

  // Tracking (denormalized for performance)
  spentAmount     Decimal  @db.Decimal(12, 2) @default(0)
  remainingAmount Decimal  @db.Decimal(12, 2) // budgetAmount - spentAmount
  percentUsed     Decimal  @db.Decimal(5, 2)  @default(0)

  // Alerts
  alertSentAt     DateTime?
  criticalSentAt  DateTime?

  notes       String?
  createdById String       @db.Uuid
  createdBy   User         @relation(fields: [createdById], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([propertyId, category, year, month])
  @@unique([propertyId, category, year, quarter])
  @@index([propertyId])
  @@index([year, month])
  @@index([percentUsed])
  @@map("maintenance_budgets")
}
```

**API Endpoints** (`src/services/maintenance-budgets.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getBudgets` | GET | List budgets with filters |
| `getBudget` | GET | Get single budget |
| `createBudget` | POST | Create new budget |
| `updateBudget` | POST | Update budget amount/thresholds |
| `deleteBudget` | POST | Remove budget |
| `getBudgetStatus` | GET | Current spend vs budget |
| `getBudgetAlerts` | GET | Budgets over threshold |
| `recalculateBudgetSpend` | POST | Refresh spent amounts |
| `copyBudgetsToNextPeriod` | POST | Clone budgets for new period |

**Zod Schemas** (`src/services/maintenance-budgets.schema.ts`):

```typescript
export const budgetPeriodEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'])

export const createBudgetSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  period: budgetPeriodEnum.default('MONTHLY'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  budgetAmount: z.number().positive(),
  alertThreshold: z.number().int().min(0).max(100).default(80),
  criticalThreshold: z.number().int().min(0).max(200).default(100),
  notes: z.string().optional(),
})

export const budgetFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: maintenanceCategoryEnum.optional(),
  year: z.number().int().optional(),
  period: budgetPeriodEnum.optional(),
  overThreshold: z.boolean().optional(), // Only show over-budget
})
```

**UI Components**:

- `src/components/maintenance/budget-card.tsx` — Budget progress with gauge
- `src/components/maintenance/budget-form.tsx` — Create/edit budget form
- `src/components/maintenance/budget-alerts-banner.tsx` — Over-budget warnings
- `src/routes/app.maintenance.budgets.tsx` — Budget management page

**Background Jobs**:

- `checkBudgetThresholds` — Run daily, send alerts when thresholds crossed
- `recalculateMonthlyBudgets` — Run on 1st of month, reset/rollover

---

#### 2.2 Budget vs Actual Reporting

**Goal**: Compare budgets to actual spending with variance analysis

**New API Endpoints** (`src/services/cost-reporting.api.ts` — extend existing):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getBudgetVsActual` | GET | Compare budget to spending |
| `getBudgetVarianceByProperty` | GET | Variance breakdown by property |
| `getBudgetVarianceByCategory` | GET | Variance breakdown by category |
| `getBudgetTrend` | GET | Historical budget performance |

**Response Types**:

```typescript
interface BudgetVsActualSummary {
  period: string
  totalBudget: number
  totalActual: number
  variance: number
  variancePercent: number
  status: 'under' | 'on-track' | 'over' | 'critical'
  byProperty: BudgetVsActualItem[]
  byCategory: BudgetVsActualItem[]
}

interface BudgetVsActualItem {
  id: string
  name: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
  trend: 'improving' | 'stable' | 'worsening'
}
```

**UI Enhancements**:

- Add budget comparison toggle to existing cost dashboard
- Add variance column to property/category tables
- Color-code rows based on variance (green under, yellow near, red over)

---

### Phase 3: Cost Forecasting & Analytics (Priority: Medium)

#### 3.1 Cost Forecasting

**Goal**: Predict future maintenance costs based on historical patterns

**New API Endpoints** (`src/services/cost-forecasting.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getForecast` | GET | Predict next N months costs |
| `getForecastByProperty` | GET | Property-level predictions |
| `getForecastByCategory` | GET | Category-level predictions |
| `getSeasonalPatterns` | GET | Identify seasonal trends |
| `getAnomalyDetection` | GET | Flag unusual spending |

**Forecasting Algorithm**:

```typescript
interface ForecastParams {
  propertyId?: string
  category?: string
  forecastMonths: number  // 1-12
  confidenceLevel: number // 0.80, 0.90, 0.95
}

interface ForecastResult {
  predictions: MonthlyPrediction[]
  methodology: 'moving_average' | 'exponential_smoothing' | 'linear_regression'
  accuracy: number // Based on backtesting
  seasonalFactors: Record<number, number> // Month -> multiplier
}

interface MonthlyPrediction {
  month: string
  predicted: number
  lowerBound: number
  upperBound: number
  confidence: number
}
```

**Implementation Approach**:

1. **Moving Average** (baseline): 3-month rolling average with seasonal adjustment
2. **Exponential Smoothing**: Weight recent data more heavily
3. **Linear Regression**: For properties with clear trends

**UI Components**:

- `src/components/maintenance/cost-forecast-chart.tsx` — Prediction visualization
- `src/components/maintenance/seasonal-heatmap.tsx` — Monthly pattern analysis
- `src/components/maintenance/anomaly-alerts.tsx` — Unusual spending warnings

---

#### 3.2 Vendor Performance Analytics

**Goal**: Compare vendor costs, efficiency, and value

**New API Endpoints** (`src/services/vendor-analytics.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getVendorPerformance` | GET | Comprehensive vendor metrics |
| `getVendorComparison` | GET | Side-by-side vendor comparison |
| `getVendorCostTrend` | GET | Vendor pricing over time |
| `getVendorEfficiency` | GET | Time-to-complete, first-time-fix rate |
| `getVendorROI` | GET | Value score based on quality + cost |

**Metrics Tracked**:

```typescript
interface VendorPerformanceMetrics {
  vendorId: string
  vendorName: string

  // Cost metrics
  totalSpend: number
  avgCostPerJob: number
  costTrend: 'decreasing' | 'stable' | 'increasing'
  priceVariance: number // Compared to category average

  // Efficiency metrics
  avgCompletionDays: number
  onTimeRate: number      // Completed within SLA
  firstTimeFixRate: number // No callbacks within 30 days
  callbackRate: number

  // Quality metrics
  avgRating: number
  tenantSatisfaction: number
  warrantyClaimRate: number

  // Composite score
  valueScore: number // 0-100, weighted combination
  recommendation: 'preferred' | 'acceptable' | 'review' | 'avoid'
}
```

**UI Components**:

- `src/components/maintenance/vendor-scorecard.tsx` — Individual vendor performance
- `src/components/maintenance/vendor-comparison-table.tsx` — Side-by-side comparison
- `src/components/maintenance/vendor-leaderboard.tsx` — Ranked vendor list
- `src/routes/app.maintenance.vendors.analytics.tsx` — Vendor analytics page

---

### Phase 4: Approval Workflows (Priority: Medium)

#### 4.1 Cost Approval Workflow

**Goal**: Require approval for costs above thresholds

**New Prisma Model**:

```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}

model CostApprovalRule {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String

  // Conditions
  propertyId     String?  @db.Uuid
  property       Property? @relation(fields: [propertyId], references: [id])
  category       MaintenanceCategory?
  minAmount      Decimal  @db.Decimal(10, 2)
  maxAmount      Decimal? @db.Decimal(10, 2)

  // Approvers
  approverIds    String[] @db.Uuid
  requireAll     Boolean  @default(false) // All approvers or any one
  escalateAfterHours Int  @default(48)
  escalateToId   String?  @db.Uuid

  isActive       Boolean  @default(true)
  priority       Int      @default(0) // Higher = checked first

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([isActive])
  @@map("cost_approval_rules")
}

model CostApproval {
  id          String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  requestId   String         @db.Uuid
  request     MaintenanceRequest @relation(fields: [requestId], references: [id])
  ruleId      String         @db.Uuid
  rule        CostApprovalRule @relation(fields: [ruleId], references: [id])

  amount      Decimal        @db.Decimal(10, 2)
  status      ApprovalStatus @default(PENDING)

  // Approval details
  approverId  String?        @db.Uuid
  approver    User?          @relation(fields: [approverId], references: [id])
  approvedAt  DateTime?
  rejectedAt  DateTime?
  reason      String?

  // Escalation
  escalatedAt    DateTime?
  escalatedToId  String?     @db.Uuid

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([requestId])
  @@index([status])
  @@index([approverId])
  @@map("cost_approvals")
}
```

**API Endpoints** (`src/services/cost-approvals.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getApprovalRules` | GET | List approval rules |
| `createApprovalRule` | POST | Create new rule |
| `updateApprovalRule` | POST | Update rule |
| `deleteApprovalRule` | POST | Remove rule |
| `getPendingApprovals` | GET | My pending approvals |
| `approveRequest` | POST | Approve cost |
| `rejectRequest` | POST | Reject with reason |
| `getApprovalHistory` | GET | Audit trail |

**UI Components**:

- `src/components/maintenance/approval-rules-table.tsx` — Manage rules
- `src/components/maintenance/pending-approvals-list.tsx` — Approver dashboard
- `src/components/maintenance/approval-status-badge.tsx` — Status indicator
- `src/routes/app.maintenance.approvals.tsx` — Approval center

---

### Phase 5: Reporting & Export Enhancements (Priority: Low)

#### 5.1 Advanced Reports

**New Report Types**:

| Report | Description |
|--------|-------------|
| Cost Summary Report | Executive summary with KPIs |
| Budget Variance Report | Detailed budget vs actual |
| Vendor Spend Report | Vendor-by-vendor breakdown |
| Category Analysis Report | Deep dive by category |
| Property Comparison Report | Cross-property analysis |
| Tax Deduction Report | Year-end tax preparation |
| Warranty Tracking Report | Parts under warranty |

**API Endpoints** (`src/services/cost-reports.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `generateReport` | POST | Create report with options |
| `getReportTemplates` | GET | Available report types |
| `scheduleReport` | POST | Auto-generate reports |
| `getScheduledReports` | GET | List scheduled reports |

**Export Formats**:

- PDF (formatted report)
- Excel (detailed data with charts)
- CSV (raw data)
- JSON (API integration)

**UI Components**:

- `src/components/maintenance/report-builder.tsx` — Report configuration
- `src/components/maintenance/scheduled-reports.tsx` — Manage schedules
- `src/routes/app.maintenance.reports.tsx` — Report center

---

#### 5.2 Dashboard Enhancements

**New Dashboard Widgets**:

| Widget | Description |
|--------|-------------|
| Budget Health | All budgets with status indicators |
| Upcoming Invoices | Due within 7/14/30 days |
| Cost Anomalies | Unusual spending flagged |
| Vendor Performance | Top/bottom performers |
| Category Trends | 3-month trend arrows |
| Forecast Preview | Next month prediction |

**API Endpoints** (add to `cost-reporting.api.ts`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getDashboardWidgets` | GET | All widget data in one call |
| `getQuickStats` | GET | Key metrics for header |

---

## Database Migration Plan

### Migration 1: Cost Line Items

```sql
-- 20260105_001_cost_line_items.sql

CREATE TYPE cost_line_item_type AS ENUM (
  'LABOR', 'PARTS', 'MATERIALS', 'PERMITS',
  'TRAVEL', 'EMERGENCY_FEE', 'DISPOSAL', 'SUBCONTRACTOR', 'OTHER'
);

CREATE TABLE maintenance_cost_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES pm_maintenance_requests(id) ON DELETE CASCADE,
  type cost_line_item_type NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  part_number TEXT,
  supplier TEXT,
  warranty BOOLEAN DEFAULT FALSE,
  warranty_expiry TIMESTAMPTZ,
  labor_hours DECIMAL(5,2),
  labor_rate DECIMAL(10,2),
  worker_id TEXT,
  receipt_url TEXT,
  charge_to_tenant BOOLEAN DEFAULT FALSE,
  tenant_charge_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_line_items_request ON maintenance_cost_line_items(request_id);
CREATE INDEX idx_cost_line_items_type ON maintenance_cost_line_items(type);

-- Trigger to auto-update total_cost
CREATE OR REPLACE FUNCTION update_line_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := NEW.quantity * NEW.unit_cost;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_line_item_total
  BEFORE INSERT OR UPDATE ON maintenance_cost_line_items
  FOR EACH ROW EXECUTE FUNCTION update_line_item_total();
```

### Migration 2: Invoices

```sql
-- 20260105_002_maintenance_invoices.sql

CREATE TYPE invoice_status AS ENUM (
  'PENDING', 'APPROVED', 'DISPUTED', 'PAID', 'CANCELLED'
);

CREATE TABLE maintenance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  request_id UUID NOT NULL REFERENCES pm_maintenance_requests(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES pm_vendors(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  status invoice_status DEFAULT 'PENDING',
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  dispute_reason TEXT,
  invoice_url TEXT NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  expense_id UUID UNIQUE REFERENCES expenses(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_request ON maintenance_invoices(request_id);
CREATE INDEX idx_invoices_vendor ON maintenance_invoices(vendor_id);
CREATE INDEX idx_invoices_status ON maintenance_invoices(status);
CREATE INDEX idx_invoices_due_date ON maintenance_invoices(due_date);
```

### Migration 3: Budgets

```sql
-- 20260105_003_maintenance_budgets.sql

CREATE TYPE budget_period AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUALLY');

CREATE TABLE maintenance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES pm_properties(id) ON DELETE CASCADE,
  category maintenance_category,
  period budget_period DEFAULT 'MONTHLY',
  year INT NOT NULL,
  month INT CHECK (month >= 1 AND month <= 12),
  quarter INT CHECK (quarter >= 1 AND quarter <= 4),
  budget_amount DECIMAL(12,2) NOT NULL,
  alert_threshold INT DEFAULT 80,
  critical_threshold INT DEFAULT 100,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2),
  percent_used DECIMAL(5,2) DEFAULT 0,
  alert_sent_at TIMESTAMPTZ,
  critical_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, category, year, month),
  UNIQUE(property_id, category, year, quarter)
);

CREATE INDEX idx_budgets_property ON maintenance_budgets(property_id);
CREATE INDEX idx_budgets_year_month ON maintenance_budgets(year, month);
CREATE INDEX idx_budgets_percent_used ON maintenance_budgets(percent_used);

-- Trigger to calculate remaining_amount
CREATE OR REPLACE FUNCTION update_budget_remaining()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount := NEW.budget_amount - NEW.spent_amount;
  NEW.percent_used := CASE
    WHEN NEW.budget_amount > 0 THEN (NEW.spent_amount / NEW.budget_amount) * 100
    ELSE 0
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_remaining
  BEFORE INSERT OR UPDATE ON maintenance_budgets
  FOR EACH ROW EXECUTE FUNCTION update_budget_remaining();
```

### Migration 4: Approval Workflow

```sql
-- 20260105_004_cost_approvals.sql

CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

CREATE TABLE cost_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  property_id UUID REFERENCES pm_properties(id),
  category maintenance_category,
  min_amount DECIMAL(10,2) NOT NULL,
  max_amount DECIMAL(10,2),
  approver_ids UUID[] NOT NULL,
  require_all BOOLEAN DEFAULT FALSE,
  escalate_after_hours INT DEFAULT 48,
  escalate_to_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_rules_active ON cost_approval_rules(is_active);

CREATE TABLE cost_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES pm_maintenance_requests(id),
  rule_id UUID NOT NULL REFERENCES cost_approval_rules(id),
  amount DECIMAL(10,2) NOT NULL,
  status approval_status DEFAULT 'PENDING',
  approver_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  reason TEXT,
  escalated_at TIMESTAMPTZ,
  escalated_to_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approvals_request ON cost_approvals(request_id);
CREATE INDEX idx_approvals_status ON cost_approvals(status);
CREATE INDEX idx_approvals_approver ON cost_approvals(approver_id);
```

---

## Implementation Roadmap

### Sprint 1 (Week 1-2): Cost Line Items & Invoices

**Tasks**:
1. [ ] Create database migrations for line items and invoices
2. [ ] Implement `cost-line-items.api.ts` with full CRUD
3. [ ] Implement `maintenance-invoices.api.ts` with approval workflow
4. [ ] Build `cost-line-items-table.tsx` component
5. [ ] Build `invoice-upload.tsx` component
6. [ ] Update work order detail page with cost breakdown section
7. [ ] Add invoice management to work order detail
8. [ ] Write unit tests for new APIs

**Deliverables**:
- Line item entry on work orders
- Invoice upload and tracking
- Cost breakdown visualization

### Sprint 2 (Week 3-4): Budget Management

**Tasks**:
1. [ ] Create database migration for budgets
2. [ ] Implement `maintenance-budgets.api.ts`
3. [ ] Build budget management UI (`/app/maintenance/budgets`)
4. [ ] Add budget widgets to cost dashboard
5. [ ] Implement budget threshold email notifications
6. [ ] Add budget vs actual comparison to reports
7. [ ] Create budget rollover functionality
8. [ ] Write tests

**Deliverables**:
- Budget CRUD
- Threshold alerts
- Budget dashboard

### Sprint 3 (Week 5-6): Forecasting & Vendor Analytics

**Tasks**:
1. [ ] Implement `cost-forecasting.api.ts` with prediction algorithms
2. [ ] Build forecast visualization components
3. [ ] Implement `vendor-analytics.api.ts`
4. [ ] Build vendor scorecard and comparison UI
5. [ ] Add vendor performance to vendor detail page
6. [ ] Create anomaly detection logic
7. [ ] Write tests

**Deliverables**:
- Cost predictions
- Vendor performance metrics
- Anomaly alerts

### Sprint 4 (Week 7-8): Approval Workflows & Reports

**Tasks**:
1. [ ] Create database migrations for approvals
2. [ ] Implement `cost-approvals.api.ts`
3. [ ] Build approval management UI
4. [ ] Add approval step to work order completion
5. [ ] Implement advanced report generation
6. [ ] Build report scheduling
7. [ ] Add export in PDF/Excel formats
8. [ ] Final testing and polish

**Deliverables**:
- Approval workflow
- Report generation
- Export functionality

---

## File Structure

```
src/
├── services/
│   ├── cost-reporting.api.ts        # Enhanced (existing)
│   ├── cost-reporting.query.ts      # Enhanced (existing)
│   ├── cost-reporting.schema.ts     # Enhanced (existing)
│   ├── cost-line-items.api.ts       # NEW
│   ├── cost-line-items.query.ts     # NEW
│   ├── cost-line-items.schema.ts    # NEW
│   ├── maintenance-invoices.api.ts  # NEW
│   ├── maintenance-invoices.query.ts # NEW
│   ├── maintenance-invoices.schema.ts # NEW
│   ├── maintenance-budgets.api.ts   # NEW
│   ├── maintenance-budgets.query.ts # NEW
│   ├── maintenance-budgets.schema.ts # NEW
│   ├── cost-forecasting.api.ts      # NEW
│   ├── cost-forecasting.query.ts    # NEW
│   ├── cost-forecasting.schema.ts   # NEW
│   ├── vendor-analytics.api.ts      # NEW
│   ├── vendor-analytics.query.ts    # NEW
│   ├── vendor-analytics.schema.ts   # NEW
│   ├── cost-approvals.api.ts        # NEW
│   ├── cost-approvals.query.ts      # NEW
│   └── cost-approvals.schema.ts     # NEW
├── components/
│   └── maintenance/
│       ├── cost-line-items-table.tsx    # NEW
│       ├── add-cost-line-item-dialog.tsx # NEW
│       ├── cost-breakdown-summary.tsx   # NEW
│       ├── invoice-upload.tsx           # NEW
│       ├── invoice-approval-card.tsx    # NEW
│       ├── invoices-due-widget.tsx      # NEW
│       ├── budget-card.tsx              # NEW
│       ├── budget-form.tsx              # NEW
│       ├── budget-alerts-banner.tsx     # NEW
│       ├── cost-forecast-chart.tsx      # NEW
│       ├── seasonal-heatmap.tsx         # NEW
│       ├── anomaly-alerts.tsx           # NEW
│       ├── vendor-scorecard.tsx         # NEW
│       ├── vendor-comparison-table.tsx  # NEW
│       ├── vendor-leaderboard.tsx       # NEW
│       ├── approval-rules-table.tsx     # NEW
│       ├── pending-approvals-list.tsx   # NEW
│       ├── approval-status-badge.tsx    # NEW
│       ├── report-builder.tsx           # NEW
│       └── scheduled-reports.tsx        # NEW
├── routes/
│   ├── app.maintenance.costs.tsx        # Enhanced (existing)
│   ├── app.maintenance.invoices.tsx     # NEW
│   ├── app.maintenance.budgets.tsx      # NEW
│   ├── app.maintenance.vendors.analytics.tsx # NEW
│   ├── app.maintenance.approvals.tsx    # NEW
│   └── app.maintenance.reports.tsx      # NEW
└── server/
    └── budget-notifications.ts          # NEW - Background job
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Budget Accuracy | Within 10% variance | Monthly comparison |
| Forecast Accuracy | 85%+ for 3-month | Backtesting |
| Invoice Processing Time | < 24 hours | Approval latency |
| Vendor Cost Savings | 5% YoY reduction | Annual comparison |
| User Adoption | 80% use budgets | Feature usage analytics |

---

## Testing Strategy

### Unit Tests

- All API endpoints
- Zod schema validation
- Calculation functions (forecasting, budgets)
- Approval workflow state machine

### Integration Tests

- Budget threshold triggers
- Invoice → Expense linking
- Cost aggregation accuracy
- Approval escalation timing

### E2E Tests

- Create work order → Add line items → Complete → Invoice → Approve
- Budget setup → Track spending → Alert triggers
- Report generation → Export download

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Existing cost-reporting service | Foundation | ✅ Ready |
| Expense service | Invoice linking | ✅ Ready |
| Vendor service | Performance data | ✅ Ready |
| Email notifications (Resend) | Budget alerts | ✅ Ready |
| Background jobs | Threshold checks | 🟡 EPM-6 pending |
| PDF generation | Reports | 🟡 Need library (react-pdf) |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex forecasting | Inaccurate predictions | Start with simple moving average, iterate |
| Budget calculation perf | Slow dashboards | Denormalize spent_amount, use triggers |
| Approval bottlenecks | Delayed completions | Auto-approve below thresholds, escalation |
| Data migration | Incorrect historical data | Backfill script with validation |

---

## Open Questions

1. Should budgets support multi-currency for international properties?
2. Should approval rules support approval chains (Level 1 → Level 2)?
3. What PDF template should reports use (branded vs standard)?
4. Should vendors be able to submit invoices directly (vendor portal)?

---

## Appendix: UI Mockups

### Cost Line Items Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Cost Breakdown                                            [+ Add Item]  │
├──────────┬────────────────────┬─────────┬──────────┬──────────┬────────┤
│ Type     │ Description        │ Qty     │ Unit $   │ Total    │ Tenant │
├──────────┼────────────────────┼─────────┼──────────┼──────────┼────────┤
│ 🔧 Labor │ Emergency call-out │ 2 hrs   │ $85.00   │ $170.00  │ ☐      │
│ 🔩 Parts │ Faucet cartridge   │ 1       │ $45.00   │ $45.00   │ ☐      │
│ 🔩 Parts │ Supply lines       │ 2       │ $12.50   │ $25.00   │ ☐      │
│ 🚗 Travel│ Service call       │ 1       │ $35.00   │ $35.00   │ ☐      │
├──────────┴────────────────────┴─────────┴──────────┼──────────┼────────┤
│                                           Subtotal │ $275.00  │        │
│                                      Tenant Charge │ $0.00    │        │
│                                          Net Cost  │ $275.00  │        │
└────────────────────────────────────────────────────┴──────────┴────────┘
```

### Budget Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Maintenance Budgets                     January 2026    [+ New]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │ All Properties    │  │ Sunset Apartments │  │ Oak Street Duplex │   │
│  │ ████████░░ 78%    │  │ ██████████ 95% ⚠️ │  │ ██████░░░░ 62%    │   │
│  │ $15,600 / $20,000 │  │ $4,750 / $5,000   │  │ $3,100 / $5,000   │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                         │
│  By Category                                                            │
│  ┌──────────┬────────────┬──────────┬──────────┬────────────┐          │
│  │ Category │ Budget     │ Spent    │ Remain   │ Status     │          │
│  ├──────────┼────────────┼──────────┼──────────┼────────────┤          │
│  │ HVAC     │ $5,000     │ $4,200   │ $800     │ 🟡 84%     │          │
│  │ Plumbing │ $4,000     │ $3,800   │ $200     │ 🔴 95%     │          │
│  │ Electric │ $3,000     │ $1,500   │ $1,500   │ 🟢 50%     │          │
│  └──────────┴────────────┴──────────┴──────────┴────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Created: 2026-01-05*
*Next Review: After Sprint 1 completion*
