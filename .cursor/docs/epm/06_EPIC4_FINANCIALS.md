# Epic 4 — Financial Management (EPM-34 → EPM-38, EPM-72 → EPM-73)

**Updated:** 2026-01-02

## Shared domain spec (Epic 4)

### Core entities
- `Payment` (money in)
- `Expense` (money out)
- Lease stores terms that drive automation (late fees, deposit rules)

### Accounting stance (MVP)
- Not full double-entry accounting.
- Use category-based reporting with simple aggregates.

---

## EPM-34 — Record Rent Payments

### Goal
Record payments against tenant/lease, generate receipt, update balances.

### Current repo status
- Payments service exists (`src/services/payments.*`)
- UI routes exist but are prototype (`src/routes/app.financials.payments.tsx`)

### Data model
- Payment has: type, method, status, amount, paymentDate, leaseId (optional), tenantId

### Allocation spec (MVP)
Option A:
- `Payment.type` is single bucket (RENT/LATE_FEE/etc.)
Option B:
- `payment_allocations` table to split across rent/fees/utilities

### UI spec
- Select tenant/lease
- Amount + date + method + reference number
- Receipt preview + email (EPM-4)

### Test plan
- validation: amount > 0
- authorization: cannot post to other user’s tenants

### API endpoints (exact)
- **Server functions (TanStack Start)** — `src/services/payments.api.ts`
  - `getPayments` (`method: 'GET'`)
  - `getPayment` (`method: 'GET'`)
  - `createPayment` (`method: 'POST'`)
  - `updatePayment` (`method: 'POST'`)
  - `deletePayment` (`method: 'POST'`)

### Zod schemas (exact)
- **File**: `src/services/payments.schema.ts`
  - `paymentTypeEnum`, `paymentMethodEnum`, `paymentStatusEnum`
  - `createPaymentSchema`
  - `updatePaymentSchema`
  - `paymentFiltersSchema`
  - `paymentIdSchema`

### DB DDL/migrations (exact)
- **Existing (base)**: `supabase/migrations/001_initial_schema.sql`
  - `CREATE TABLE payments` (line ~623)
- **No new migrations required** for payment CRUD (MVP).

---

## EPM-35 — Rent Collection Dashboard

### Goal
Show expected vs collected, delinquency list, collection rate.

### KPIs
- expected = sum(active leases monthly rent) for period
- collected = sum(payments RENT for period)
- delinquent tenants = expected - collected > 0 after grace

Dependencies: lease + payment data wired and accurate.

### API endpoints (exact)
- **Server functions (TanStack Start)** — `src/services/payments.api.ts`
  - `getPaymentStats` (`method: 'GET'`) — expected vs collected + collection rate + pending + late counts
  - `getRentRoll` (`method: 'GET'`) — active leases + paid amount + balance for current month

### Zod schemas (exact)
- **N/A** (current dashboard endpoints take no input payload).

### DB DDL/migrations (exact)
- **Existing (base)**: `supabase/migrations/001_initial_schema.sql`
  - `leases` (line ~357) for “expected”
  - `payments` (line ~623) for “collected”
- **No new migrations required**.

---

## EPM-36 — Security Deposit Management

### Goal
Track deposits, compute interest, handle move-out deductions, enforce MN deadlines.

### Current model mismatch
Schema currently stores deposit fields on `Lease`, not a separate `security_deposits` table.

### Compliance (MN 504B.178)
- 1% simple interest annually
- disposition within 21 days

### Recommended data additions
- `deposit_transactions` (received, refund, deductions)
- `deposit_deductions` (line items)
- `deposit_disposition_letters` (generated + sent timestamps)

### API endpoints (exact)
- **Current**: deposit fields are on `Lease` (`src/services/leases.*`) and can be updated via:
  - `updateLease` (`method: 'POST'`) — `src/services/leases.api.ts`
- **Proposed (TanStack Start)**: `src/services/deposits.api.ts`
  - `recordDepositTransaction` (`method: 'POST'`)
  - `recordDepositDeductions` (`method: 'POST'`)
  - `generateDepositDispositionLetter` (`method: 'POST'`) (see also EPM-28)

### Zod schemas (exact)
- **Current**: `src/services/leases.schema.ts` includes:
  - `securityDeposit`, `depositPaidDate`, `depositInterestRate`, `depositBankName`, `depositAccountLast4`
- **Proposed**: `src/services/deposits.schema.ts` (deposit txn + deduction line items)

### DB DDL/migrations (exact)
- **Current (base)**: `supabase/migrations/001_initial_schema.sql`
  - deposit fields live on `leases` (line ~357 block)
- **Additive tables recommended** (new migrations, not yet applied):

```sql
-- 00X_deposit_transactions.sql
CREATE TABLE IF NOT EXISTS deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- RECEIVED|REFUND|INTEREST|DEDUCTION
  amount DECIMAL(10, 2) NOT NULL,
  occurred_at DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_transactions_lease
  ON deposit_transactions(lease_id);
```

---

## EPM-37 — Late Fee Automation

### Goal
Automatically apply late fees after grace period, cap at $50 (MN).

### Dependencies
- Background jobs (EPM-6)

### Algorithm
- daily job:
  - find leases where today > dueDay + graceDays
  - compute late fee if not already applied for that period
  - create a `Payment` record or `Charge` record (recommended)

### API endpoints (exact)
- **Proposed background job (BullMQ)** — EPM-6
  - generates a `Payment` of type `LATE_FEE` via `createPayment` (server fn) OR creates a new `charges` table (future)

### Zod schemas (exact)
- **Payment type enum includes late fees** — `src/services/payments.schema.ts`
  - `paymentTypeEnum` contains `LATE_FEE`

### DB DDL/migrations (exact)
- **Existing (base)**: `supabase/migrations/001_initial_schema.sql`
  - `payments.type` supports late fees via enum `payment_type` (part of `payments` table, line ~623)
- **No new migrations required** if using `Payment` records for late fees (MVP).

---

## EPM-38 — Expense Tracking

### Goal
Record expenses, attach receipts, categorize, export.

### Current status
- DB table exists; UI route exists; no `expenses` service yet.

### API surface (required)
- `expenses.*` service (CRUD + filters)

### Receipt uploads
Depend on storage (EPM-2/EPM-44).

### API endpoints (exact)
- **Proposed (TanStack Start)**: `src/services/expenses.api.ts`
  - `getExpenses` (`method: 'GET'`)
  - `getExpense` (`method: 'GET'`)
  - `createExpense` (`method: 'POST'`)
  - `updateExpense` (`method: 'POST'`)
  - `deleteExpense` (`method: 'POST'`)

### Zod schemas (exact)
- **Proposed**: `src/services/expenses.schema.ts`

```ts
import { z } from 'zod'

export const createExpenseSchema = z.object({
  propertyId: z.string().uuid(),
  category: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.coerce.date(),
  vendorId: z.string().uuid().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
})
```

### DB DDL/migrations (exact)
- **Existing (base)**: `supabase/migrations/001_initial_schema.sql`
  - `CREATE TABLE expenses` (line ~675)
- **No new migrations required** for expense CRUD (MVP).

---

## EPM-72 — Financial Reports

### Goal
Generate income statement, cash flow, rent roll, delinquency, expense breakdown.

### Export
- CSV and PDF

### Performance
Use caching (EPM-5) for large aggregations.

### API endpoints (exact)
- **Proposed (TanStack Start)**: `src/services/reports-financial.api.ts`
  - `getIncomeStatement` (`method: 'GET'`)
  - `getCashFlow` (`method: 'GET'`)
  - `getRentRollReport` (`method: 'GET'`)
  - `getDelinquencyReport` (`method: 'GET'`)
  - `exportFinancialReportCsv` (`method: 'GET'`)

### Zod schemas (exact)
- **Proposed**: `src/services/reports-financial.schema.ts`
  - date range + grouping + filters

### DB DDL/migrations (exact)
- **Existing tables**: `payments` (line ~623), `expenses` (line ~675), `leases` (line ~357), `properties` (line ~191)
- **No new migrations required** (reports are aggregates).

---

## EPM-73 — Budget vs Actual Tracking

### Goal
Create budgets per category/property and compare to actual expenses.

### Data model (recommended)
- `budgets` table:
  - year, category, propertyId (nullable for portfolio), monthly targets

### Alerts
If over budget, raise notifications (EPM-66).

### API endpoints (exact)
- **Proposed (TanStack Start)**: `src/services/budgets.api.ts`
  - `getBudgets` (`method: 'GET'`)
  - `upsertBudget` (`method: 'POST'`)

### Zod schemas (exact)
- **Proposed**: `src/services/budgets.schema.ts`

```ts
import { z } from 'zod'

export const upsertBudgetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  propertyId: z.string().uuid().nullable().optional(),
  category: z.string().min(1),
  monthlyTargets: z.array(z.number().min(0)).length(12),
})
```

### DB DDL/migrations (exact)
- **Additive table required** (new migration, not yet applied):

```sql
-- 00X_budgets.sql
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  monthly_targets DECIMAL(10, 2)[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, category, property_id)
);
```

