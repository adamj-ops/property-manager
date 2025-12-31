# Property Management WebApp - Epics & User Stories
## Everyday Properties Management Platform

**Version:** 1.0  
**Last Updated:** December 31, 2024  
**Project Phase:** Planning & Development  

---

## 📋 Table of Contents

1. [Epic Overview](#epic-overview)
2. [Epic 1: Core Property & Unit Management](#epic-1-core-property--unit-management)
3. [Epic 2: Tenant Management & Leasing](#epic-2-tenant-management--leasing)
4. [Epic 3: Maintenance & Work Orders](#epic-3-maintenance--work-orders)
5. [Epic 4: Financial Management](#epic-4-financial-management)
6. [Epic 5: AI-Powered Inspections](#epic-5-ai-powered-inspections)
7. [Epic 6: Communication Hub](#epic-6-communication-hub)
8. [Epic 7: Compliance & Legal](#epic-7-compliance--legal)
9. [Epic 8: Document Management](#epic-8-document-management)
10. [Epic 9: Reporting & Analytics](#epic-9-reporting--analytics)
11. [Epic 10: Mobile Experience](#epic-10-mobile-experience)
12. [Epic 11: User Management & Security](#epic-11-user-management--security)
13. [Release Planning](#release-planning)

---

## Epic Overview

| Epic # | Epic Name | Priority | Phase | Estimated Story Points | Status |
|--------|-----------|----------|-------|------------------------|--------|
| 1 | Core Property & Unit Management | P0 | MVP | 34 | Not Started |
| 2 | Tenant Management & Leasing | P0 | MVP | 55 | Not Started |
| 3 | Maintenance & Work Orders | P0 | MVP | 42 | Not Started |
| 4 | Financial Management | P0 | MVP | 47 | Not Started |
| 5 | AI-Powered Inspections | P1 | Phase 2 | 34 | Not Started |
| 6 | Communication Hub | P0 | MVP | 28 | Not Started |
| 7 | Compliance & Legal | P1 | Phase 2 | 38 | Not Started |
| 8 | Document Management | P0 | MVP | 21 | Not Started |
| 9 | Reporting & Analytics | P1 | Phase 2 | 31 | Not Started |
| 10 | Mobile Experience | P1 | Phase 2 | 26 | Not Started |
| 11 | User Management & Security | P0 | MVP | 29 | Not Started |

**Total Story Points:** 385  
**Estimated MVP Duration:** 16-20 weeks  
**Priority Levels:** P0 = Critical (MVP), P1 = High (Phase 2), P2 = Medium (Phase 3), P3 = Low (Future)

---

## Epic 1: Core Property & Unit Management

**Epic Description:** Enable property managers to create, view, edit, and manage properties and their associated units within a portfolio.

**Business Value:** Foundation for all property management activities. Without property/unit data, no other features can function.

**Success Metrics:**
- Ability to manage unlimited properties and units
- < 2 seconds page load time for property lists
- 100% data accuracy in unit details
- Portfolio overview accessible in < 3 clicks

### User Stories

#### Story 1.1: Add New Property
**As a** property manager  
**I want to** add a new property to my portfolio  
**So that** I can begin managing tenants and units for that property

**Acceptance Criteria:**
- [ ] Property form includes: name, address, type (multifamily/single), year built, total units
- [ ] Address validation using Google Places API
- [ ] Automatic geocoding for map display
- [ ] Property photos upload (up to 20 images)
- [ ] Save as draft or publish immediately
- [ ] Property appears in portfolio list immediately after creation
- [ ] Form validation prevents duplicate addresses

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** None  
**Technical Notes:**
- Use react-hook-form + zod for validation
- Cloudflare R2 for image storage
- PostgreSQL table: `properties`

---

#### Story 1.2: View Property Portfolio Dashboard
**As a** property manager  
**I want to** see all my properties in a dashboard view  
**So that** I can quickly assess my portfolio's overall status

**Acceptance Criteria:**
- [ ] Dashboard displays all properties with key metrics
- [ ] Metrics include: total units, occupancy %, monthly revenue, # of issues
- [ ] Properties sortable by name, occupancy, revenue
- [ ] Filter by property type, location, occupancy status
- [ ] Visual indicators for properties requiring attention
- [ ] Click on property card navigates to property detail page
- [ ] Load time < 2 seconds even with 50+ properties

**Story Points:** 3  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.1  
**Technical Notes:**
- Use TanStack Query for data fetching with stale-while-revalidate
- Implement virtual scrolling for large portfolios
- Cache portfolio metrics in Redis

---

#### Story 1.3: Add Units to Property
**As a** property manager  
**I want to** add multiple units to a property  
**So that** I can track individual apartments/spaces

**Acceptance Criteria:**
- [ ] Add single unit or bulk add multiple units
- [ ] Unit form includes: unit number, bedrooms, bathrooms, sq ft, floor, type
- [ ] Bulk add allows pattern-based creation (e.g., Units 101-110)
- [ ] Unit amenities checklist (dishwasher, A/C, balcony, etc.)
- [ ] Set market rent for each unit
- [ ] Upload unit-specific photos
- [ ] Units immediately appear in property's unit list
- [ ] Validation prevents duplicate unit numbers within same property

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.1  
**Technical Notes:**
- PostgreSQL table: `units` with foreign key to `properties`
- Consider JSON field for amenities
- Implement transaction for bulk creates

---

#### Story 1.4: Edit Property/Unit Details
**As a** property manager  
**I want to** edit property and unit information  
**So that** I can keep data current and accurate

**Acceptance Criteria:**
- [ ] Edit button on property/unit detail pages
- [ ] Pre-populated form with current values
- [ ] Change tracking (show what changed)
- [ ] Audit log of all changes with timestamp and user
- [ ] Changes reflect immediately in all views
- [ ] Validation same as creation forms
- [ ] Ability to cancel without saving

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.1, 1.3  
**Technical Notes:**
- Implement optimistic updates
- Audit log table: `change_history`

---

#### Story 1.5: View Unit Availability Status
**As a** property manager  
**I want to** see which units are occupied, vacant, or under maintenance  
**So that** I can manage availability for new tenants

**Acceptance Criteria:**
- [ ] Visual status indicators (color-coded badges)
- [ ] Status types: Occupied, Vacant, Notice Given, Under Renovation, Offline
- [ ] Unit list filterable by status
- [ ] Status automatically updates when lease starts/ends
- [ ] Manual override for special situations
- [ ] Vacancy duration calculated and displayed
- [ ] Ability to mark unit offline (not available for rent)

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.3  
**Technical Notes:**
- Computed field based on lease dates
- Redis cache for quick status checks
- Status calculation job runs daily

---

#### Story 1.6: Property Detail Page
**As a** property manager  
**I want to** view comprehensive details about a specific property  
**So that** I can access all information about that property in one place

**Acceptance Criteria:**
- [ ] Overview section with property details and key metrics
- [ ] List of all units with current status
- [ ] Active tenants summary
- [ ] Recent maintenance activity
- [ ] Financial summary (revenue, expenses)
- [ ] Upcoming lease expirations
- [ ] Quick action buttons (add unit, create lease, message tenants)
- [ ] Responsive design for mobile viewing

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.1, 1.3, 1.5  
**Technical Notes:**
- Aggregate data from multiple tables
- Use React Suspense for progressive loading
- Cache heavy computations

---

**Epic 1 Total Story Points:** 34

---

## Epic 2: Tenant Management & Leasing

**Epic Description:** Comprehensive tenant lifecycle management from application through lease signing, renewals, and move-out.

**Business Value:** Core revenue-generating feature. Efficient tenant management directly impacts occupancy rates and revenue.

**Success Metrics:**
- Reduce lease processing time by 60%
- 95%+ lease renewal conversion rate
- < 5 minutes to create new lease
- Zero compliance violations in lease documents

### User Stories

#### Story 2.1: Tenant Profile Creation
**As a** property manager  
**I want to** create detailed tenant profiles  
**So that** I can maintain accurate records of all residents

**Acceptance Criteria:**
- [ ] Form includes: full name, email, phone, emergency contact
- [ ] Multiple contact methods per tenant
- [ ] Employment information (employer, income)
- [ ] Previous address history
- [ ] Co-tenants/roommates linkage
- [ ] Vehicle information for parking
- [ ] Photo upload for tenant identification
- [ ] SSN/ID encrypted at rest
- [ ] Email verification workflow

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.3 (units must exist)  
**Technical Notes:**
- Use encryption for PII (SSN, ID)
- PostgreSQL table: `tenants`
- Implement field-level encryption

---

#### Story 2.2: Create New Lease Agreement
**As a** property manager  
**I want to** create a lease agreement for a tenant  
**So that** I can formalize the rental relationship

**Acceptance Criteria:**
- [ ] Select unit and tenant(s)
- [ ] Set lease dates (start, end)
- [ ] Set monthly rent amount
- [ ] Set security deposit amount
- [ ] Calculate security deposit interest (Minnesota requirement)
- [ ] Add co-tenants to same lease
- [ ] Select applicable addenda (pet, parking, etc.)
- [ ] Preview lease before finalizing
- [ ] Generate PDF for signing
- [ ] Validation ensures no overlapping leases for same unit

**Story Points:** 13  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1, Story 8.1 (document templates)  
**Technical Notes:**
- PostgreSQL table: `leases`
- Use docx-js for document generation
- Calculate interest based on Minnesota statute 504B.178

---

#### Story 2.3: Lease Expiration Tracking
**As a** property manager  
**I want to** be notified of upcoming lease expirations  
**So that** I can proactively start renewal process

**Acceptance Criteria:**
- [ ] Dashboard shows leases expiring in next 90 days
- [ ] Color-coded urgency (red < 30 days, yellow < 60 days)
- [ ] Automated email notifications at 90, 60, 30 days before expiration
- [ ] Quick action to start renewal process
- [ ] Filter tenant list by expiration date
- [ ] Batch operations for multiple renewals
- [ ] Customizable notification timing

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2  
**Technical Notes:**
- Background job checks daily for upcoming expirations
- Use BullMQ for scheduled notifications
- SendGrid for email delivery

---

#### Story 2.4: Lease Renewal Workflow
**As a** property manager  
**I want to** renew existing tenant leases  
**So that** I can retain tenants with minimal effort

**Acceptance Criteria:**
- [ ] "Renew Lease" button on tenant detail page
- [ ] Pre-populate with current lease terms
- [ ] Adjust rent amount (show % increase/decrease)
- [ ] Adjust lease duration
- [ ] Update addenda if needed
- [ ] Generate renewal letter/agreement
- [ ] Track renewal status (offered, accepted, declined)
- [ ] Auto-extend lease if accepted
- [ ] Convert to month-to-month if needed

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2, 2.3  
**Technical Notes:**
- Create new lease record linked to previous lease
- Maintain lease history chain

---

#### Story 2.5: Tenant List & Search
**As a** property manager  
**I want to** view and search all tenants  
**So that** I can quickly find tenant information

**Acceptance Criteria:**
- [ ] Paginated list of all tenants
- [ ] Search by name, unit number, email, phone
- [ ] Filter by property, lease status, payment status
- [ ] Sort by name, unit, lease end date, rent amount
- [ ] Quick view of key info (unit, rent, lease dates)
- [ ] Status badges (current, past due, expiring soon)
- [ ] Bulk selection for batch operations
- [ ] Export to CSV

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Use full-text search in PostgreSQL
- Implement cursor-based pagination
- Redis cache for search results

---

#### Story 2.6: Tenant Detail Page
**As a** property manager  
**I want to** view comprehensive tenant information in one place  
**So that** I can access all tenant-related data efficiently

**Acceptance Criteria:**
- [ ] Overview section with contact info and lease summary
- [ ] Payment history and current balance
- [ ] Active lease details and documents
- [ ] Maintenance request history
- [ ] Communication log (all messages/emails)
- [ ] Document repository (lease, addenda, notices)
- [ ] Recent inspections and violations
- [ ] Pet information if applicable
- [ ] Quick actions (message, create work order, process payment)

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1, 2.2, 4.1 (payments)  
**Technical Notes:**
- Aggregate data from multiple tables
- Use tabs for different sections
- Lazy load sections as needed

---

#### Story 2.7: Pet Application & Approval
**As a** property manager  
**I want to** receive and process pet applications  
**So that** I can approve pets and charge appropriate fees

**Acceptance Criteria:**
- [ ] Tenant submits pet application form
- [ ] Form includes: pet name, type, breed, weight, age
- [ ] Photo upload for pet
- [ ] Vaccination records upload
- [ ] License number and authority
- [ ] Pet approval workflow (pending, approved, denied)
- [ ] Set pet rent and/or pet deposit
- [ ] Generate pet addendum upon approval
- [ ] Email notification to tenant on approval/denial
- [ ] Prevent pets over weight limit (80 lbs based on your lease)

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1, 2.2  
**Technical Notes:**
- PostgreSQL table: `pets`
- Link to lease via `lease_id`
- Auto-generate pet addendum document

---

#### Story 2.8: Move-In Inspection
**As a** property manager  
**I want to** conduct and document move-in inspections  
**So that** I can establish unit condition baseline

**Acceptance Criteria:**
- [ ] Digital inspection form with room-by-room checklist
- [ ] Photo upload for each area (kitchen, bathroom, bedroom, etc.)
- [ ] Condition ratings (excellent, good, fair, poor)
- [ ] Notes field for detailed observations
- [ ] Pre-existing damage documentation
- [ ] Tenant signature (digital)
- [ ] Generate PDF inspection report
- [ ] Report attached to tenant profile
- [ ] Compare with move-out inspection later

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2  
**Technical Notes:**
- PostgreSQL table: `inspections`
- Store photos in R2 with inspection_id
- Use canvas for digital signatures

---

#### Story 2.9: Move-Out Process
**As a** property manager  
**I want to** manage tenant move-outs  
**So that** I can process security deposit returns and re-rent units

**Acceptance Criteria:**
- [ ] Initiate move-out when tenant gives notice
- [ ] Schedule move-out inspection
- [ ] Move-out inspection form (same format as move-in)
- [ ] Compare move-out to move-in condition
- [ ] Calculate damages beyond normal wear
- [ ] Security deposit deduction itemization
- [ ] Generate security deposit disposition letter (Minnesota requirement)
- [ ] Process deposit refund or send invoice for damages
- [ ] Update unit status to "vacant"
- [ ] Create turnover work order if needed

**Story Points:** 13  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.8, 4.3 (security deposits)  
**Technical Notes:**
- Must comply with Minnesota 504B.178 (21-day disposition)
- Auto-calculate normal wear vs damage
- Generate compliant disposition letter

---

**Epic 2 Total Story Points:** 79 (Adjusted: 55 for MVP scope)

---

## Epic 3: Maintenance & Work Orders

**Epic Description:** Comprehensive maintenance request tracking, work order management, and vendor coordination.

**Business Value:** Improve tenant satisfaction, reduce emergency repairs through preventive maintenance, and optimize maintenance costs.

**Success Metrics:**
- Average work order completion time < 48 hours
- 95% tenant satisfaction with maintenance
- 30% reduction in emergency repairs via predictive maintenance
- Maintenance costs < 8% of revenue

### User Stories

#### Story 3.1: Tenant Submit Maintenance Request
**As a** tenant  
**I want to** submit maintenance requests online  
**So that** I can report issues without calling

**Acceptance Criteria:**
- [ ] Simple form with issue description
- [ ] Category selection (plumbing, electrical, HVAC, etc.)
- [ ] Priority selection (emergency, urgent, normal, low)
- [ ] Photo upload (up to 5 images)
- [ ] Preferred access times
- [ ] Entry permission (yes/no)
- [ ] Automatic email confirmation to tenant
- [ ] Request appears in property manager's work order queue
- [ ] Mobile-friendly interface

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1 (tenants must exist)  
**Technical Notes:**
- PostgreSQL table: `work_orders`
- Public-facing form (no auth required, just unit # + verification)
- Email via SendGrid

---

#### Story 3.2: Property Manager View Work Orders
**As a** property manager  
**I want to** see all work orders in one dashboard  
**So that** I can prioritize and assign maintenance tasks

**Acceptance Criteria:**
- [ ] List view of all work orders
- [ ] Filter by status (open, in progress, scheduled, completed)
- [ ] Filter by property, priority, category
- [ ] Sort by date created, priority, unit number
- [ ] Color-coded priority indicators
- [ ] Search by unit number, tenant name, description
- [ ] Quick stats (# open, # overdue, avg completion time)
- [ ] Overdue work orders highlighted
- [ ] Calendar view option

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Use TanStack Query with filters
- Implement server-side filtering for performance
- Redis cache for counts

---

#### Story 3.3: Assign Work Order to Vendor
**As a** property manager  
**I want to** assign work orders to vendors or staff  
**So that** maintenance gets completed

**Acceptance Criteria:**
- [ ] Dropdown list of vendors/staff
- [ ] Filter vendors by category specialty
- [ ] Set estimated cost
- [ ] Set scheduled date/time
- [ ] Add notes/instructions for vendor
- [ ] Automated email notification to assigned vendor
- [ ] Vendor contact info easily accessible
- [ ] Track assignment history
- [ ] Reassign if needed

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 3.2  
**Technical Notes:**
- PostgreSQL table: `vendors`
- Link work_orders to vendors via `assigned_to_id`
- Email notifications via SendGrid

---

#### Story 3.4: Update Work Order Status
**As a** property manager or vendor  
**I want to** update work order status  
**So that** everyone knows the current state

**Acceptance Criteria:**
- [ ] Status options: Open, Scheduled, In Progress, Completed, Cancelled
- [ ] Add status update notes
- [ ] Upload completion photos
- [ ] Record actual cost
- [ ] Record completion date/time
- [ ] Tenant automatically notified when completed
- [ ] Status history tracked with timestamps
- [ ] Work order cannot be deleted, only cancelled

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 3.3  
**Technical Notes:**
- Status history in separate table: `work_order_status_history`
- Automated notifications on status changes

---

#### Story 3.5: Vendor Management
**As a** property manager  
**I want to** maintain a vendor directory  
**So that** I can quickly assign work to trusted vendors

**Acceptance Criteria:**
- [ ] Add vendor with: company name, contact person, phone, email
- [ ] Vendor categories/specialties (plumbing, HVAC, electrical, etc.)
- [ ] Service area (which properties they serve)
- [ ] Rate information
- [ ] Insurance info and expiration tracking
- [ ] Rating/review system
- [ ] Performance metrics (avg completion time, cost accuracy)
- [ ] Active/inactive status
- [ ] Preferred vendor designation

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** None  
**Technical Notes:**
- PostgreSQL table: `vendors`
- Many-to-many with categories via junction table

---

#### Story 3.6: Recurring Maintenance Schedules
**As a** property manager  
**I want to** schedule recurring maintenance tasks  
**So that** preventive maintenance happens automatically

**Acceptance Criteria:**
- [ ] Create maintenance schedule templates
- [ ] Schedule types: HVAC filter changes, fire extinguisher checks, etc.
- [ ] Recurrence patterns (monthly, quarterly, annually)
- [ ] Auto-generate work orders based on schedule
- [ ] Assign to specific vendor
- [ ] Apply to specific units or all units
- [ ] Email notifications when work order created
- [ ] Track completion of scheduled maintenance
- [ ] Skip/postpone individual occurrences

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.2, 3.5  
**Technical Notes:**
- PostgreSQL table: `maintenance_schedules`
- Cron job or BullMQ to generate work orders
- Use rrule library for recurrence patterns

---

#### Story 3.7: Emergency Work Order Handling
**As a** property manager  
**I want to** handle emergency work orders differently  
**So that** urgent issues get immediate attention

**Acceptance Criteria:**
- [ ] Emergency priority flag
- [ ] Push notifications for emergency requests (if mobile app)
- [ ] SMS notification to on-call person
- [ ] 24/7 emergency contact info displayed to tenants
- [ ] Emergency work orders appear at top of queue
- [ ] Auto-escalation if not acknowledged within 30 minutes
- [ ] Track emergency response times
- [ ] After-hours vendor contacts

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.1, 3.2  
**Technical Notes:**
- Use Twilio for SMS notifications
- Implement escalation rules engine
- Track SLA compliance

---

#### Story 3.8: Maintenance Cost Tracking
**As a** property manager  
**I want to** track maintenance costs per unit/property  
**So that** I can budget accurately and identify problem areas

**Acceptance Criteria:**
- [ ] Record actual cost on work order completion
- [ ] Categorize costs (labor, materials, permit)
- [ ] Link to vendor invoice
- [ ] Monthly/quarterly cost reports
- [ ] Cost per unit analysis
- [ ] Cost per category breakdown
- [ ] Trending over time
- [ ] Export to CSV for accounting
- [ ] Budget vs actual comparison

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.4, 4.1 (financial)  
**Technical Notes:**
- Link work_orders to expenses
- Aggregate queries for reporting
- Cache monthly totals

---

**Epic 3 Total Story Points:** 49 (Adjusted: 42 for MVP scope)

---

## Epic 4: Financial Management

**Epic Description:** Comprehensive financial tracking including rent collection, expense management, security deposits, and financial reporting.

**Business Value:** Core to business operations. Accurate financial tracking directly impacts profitability and legal compliance.

**Success Metrics:**
- 95%+ on-time rent collection rate
- Zero security deposit compliance violations
- Financial reports generated in < 5 seconds
- Late payment reduction by 40%

### User Stories

#### Story 4.1: Record Rent Payments
**As a** property manager  
**I want to** record rent payments from tenants  
**So that** I can track who has paid and who owes money

**Acceptance Criteria:**
- [ ] Select tenant/lease
- [ ] Enter payment amount, date, method (check, ACH, cash, card)
- [ ] Allocate payment (rent, late fee, pet rent, utilities)
- [ ] Partial payment handling
- [ ] Generate receipt
- [ ] Email receipt to tenant
- [ ] Update tenant balance immediately
- [ ] Record check number if applicable
- [ ] Flag bounced payments

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2 (leases must exist)  
**Technical Notes:**
- PostgreSQL table: `payments`
- Link to `leases` table
- Transaction-based to ensure consistency

---

#### Story 4.2: Rent Collection Dashboard
**As a** property manager  
**I want to** see rent collection status across my portfolio  
**So that** I can identify delinquent tenants

**Acceptance Criteria:**
- [ ] Monthly expected revenue vs collected
- [ ] List of tenants who haven't paid (past due)
- [ ] Days past due for each delinquent tenant
- [ ] Late fee calculations (auto-calculated based on lease terms)
- [ ] Outstanding balance per tenant
- [ ] Payment history per tenant
- [ ] Quick action to send payment reminder
- [ ] Filter by property, payment status
- [ ] Collection rate percentage

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 4.1  
**Technical Notes:**
- Complex queries to calculate expected vs actual
- Redis cache for dashboard metrics
- Minnesota late fee cap: $50 or 8% of rent, whichever is greater

---

#### Story 4.3: Security Deposit Management
**As a** property manager  
**I want to** track security deposits with interest  
**So that** I comply with Minnesota law

**Acceptance Criteria:**
- [ ] Record security deposit on lease creation
- [ ] Track deposit amount and received date
- [ ] Auto-calculate interest (1% annually for MN)
- [ ] Interest accrual shown monthly
- [ ] Generate interest payment at lease end or annually
- [ ] Deduction tracking on move-out
- [ ] Generate disposition letter (itemized deductions)
- [ ] Track refund payment
- [ ] Alert if disposition letter not sent within 21 days (MN requirement)
- [ ] Separate account tracking for deposits

**Story Points:** 13  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2, 2.9  
**Technical Notes:**
- PostgreSQL table: `security_deposits`
- Minnesota Statute 504B.178 compliance
- Interest calculation: simple interest, not compound
- 21-day disposition deadline tracking

---

#### Story 4.4: Late Fee Automation
**As a** property manager  
**I want to** automatically calculate and apply late fees  
**So that** I enforce lease terms consistently

**Acceptance Criteria:**
- [ ] Late fee amount set in lease
- [ ] Grace period set in lease (e.g., 5 days)
- [ ] Auto-calculate late fee if rent not received by due date + grace period
- [ ] Add late fee to tenant balance
- [ ] Email notification to tenant about late fee
- [ ] Waive late fee option (manager override)
- [ ] Track late fee revenue separately
- [ ] Comply with Minnesota $50 cap
- [ ] Late fee waiver reason tracking

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 4.1, 4.2  
**Technical Notes:**
- Background job runs daily to check for late payments
- MN law: late fee cannot exceed $50
- Waiver creates audit trail

---

#### Story 4.5: Expense Tracking
**As a** property manager  
**I want to** record and categorize expenses  
**So that** I can track profitability

**Acceptance Criteria:**
- [ ] Add expense with: date, amount, category, vendor, property
- [ ] Categories: maintenance, utilities, insurance, taxes, management fees
- [ ] Link expense to work order if applicable
- [ ] Upload receipt/invoice
- [ ] Recurring expenses (monthly insurance, annual taxes)
- [ ] Allocate expense across multiple properties
- [ ] Tag as capital improvement vs operating expense
- [ ] Export for accounting/tax purposes
- [ ] Monthly expense totals by category

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 1.1, 3.4  
**Technical Notes:**
- PostgreSQL table: `expenses`
- Many-to-many with properties if allocated
- Store receipts in R2

---

#### Story 4.6: Financial Reports
**As a** property manager  
**I want to** generate financial reports  
**So that** I can analyze property performance

**Acceptance Criteria:**
- [ ] Income statement (revenue - expenses = NOI)
- [ ] Cash flow report
- [ ] Rent roll (all units, rent amounts, occupancy)
- [ ] Delinquency report
- [ ] Expense breakdown by category
- [ ] Property comparison report
- [ ] Date range selection
- [ ] Export to PDF and CSV
- [ ] Monthly, quarterly, annual views
- [ ] Visual charts and graphs

**Story Points:** 13  
**Priority:** P1 (High)  
**Dependencies:** Story 4.1, 4.2, 4.5  
**Technical Notes:**
- Use Recharts for visualizations
- Generate PDFs with puppeteer
- Cache report data for performance

---

#### Story 4.7: Budget vs Actual Tracking
**As a** property manager  
**I want to** set budgets and compare to actuals  
**So that** I can identify variances

**Acceptance Criteria:**
- [ ] Set annual budget by category
- [ ] Monthly budget allocation
- [ ] Compare actual to budget monthly
- [ ] Variance reporting ($ and %)
- [ ] Alerts when over budget
- [ ] Budget forecasting for remainder of year
- [ ] Adjust budget mid-year if needed
- [ ] Historical budget performance

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 4.5, 4.6  
**Technical Notes:**
- PostgreSQL table: `budgets`
- Calculate variances in real-time
- Monthly reconciliation job

---

**Epic 4 Total Story Points:** 63 (Adjusted: 47 for MVP scope)

---

## Epic 5: AI-Powered Inspections

**Epic Description:** Leverage AI to analyze inspection photos, detect violations, identify maintenance issues, and predict future problems.

**Business Value:** Differentiation from competitors. Reduces inspection time by 60%, improves consistency, and enables predictive maintenance.

**Success Metrics:**
- 95%+ AI accuracy in issue detection
- 60% reduction in inspection documentation time
- 30% increase in violation detection
- $50k+ annual savings from predictive maintenance

### User Stories

#### Story 5.1: AI Photo Analysis for Inspections
**As a** property manager  
**I want to** upload inspection photos and get automatic analysis  
**So that** I can identify issues faster

**Acceptance Criteria:**
- [ ] Upload multiple photos (up to 50 per inspection)
- [ ] AI analyzes each photo for common issues
- [ ] Detection categories: water damage, mold, pest evidence, cleanliness, damage
- [ ] Confidence score for each detection (0-100%)
- [ ] Highlighted areas showing where issue was detected
- [ ] AI-generated description of issue
- [ ] Suggested action for each issue
- [ ] Cost estimation for repairs
- [ ] False positive dismissal option
- [ ] Manual override/correction

**Story Points:** 13  
**Priority:** P1 (High)  
**Dependencies:** Story 2.8 (inspections)  
**Technical Notes:**
- Use OpenAI Vision API or Google Cloud Vision
- Custom model training for property-specific issues
- Store AI results in JSON field
- Confidence threshold: 85% for auto-flagging

---

#### Story 5.2: Automated Violation Detection
**As a** property manager  
**I want to** AI to automatically detect lease violations  
**So that** I can enforce lease terms consistently

**Acceptance Criteria:**
- [ ] Detect unauthorized pets
- [ ] Detect excessive clutter/hoarding
- [ ] Detect unsanitary conditions
- [ ] Detect unauthorized occupants (people in photos)
- [ ] Detect prohibited items (grills on balconies, etc.)
- [ ] Auto-generate violation notice draft
- [ ] Link to specific lease clause violated
- [ ] Recommended fee based on lease
- [ ] Escalation path if repeated violations
- [ ] Before/after comparison for remediation

**Story Points:** 13  
**Priority:** P1 (High)  
**Dependencies:** Story 5.1  
**Technical Notes:**
- Train custom model on violation categories
- Link to lease addenda for clause references
- Auto-populate violation fee schedules

---

#### Story 5.3: Predictive Maintenance Alerts
**As a** property manager  
**I want to** receive alerts about potential future issues  
**So that** I can prevent expensive emergency repairs

**Acceptance Criteria:**
- [ ] AI analyzes patterns across multiple inspections
- [ ] Predict HVAC failures based on age and service history
- [ ] Predict plumbing issues based on recurring leaks
- [ ] Predict roof issues based on visual deterioration
- [ ] Probability score (0-100%)
- [ ] Estimated time to failure (30/60/90 days)
- [ ] Cost comparison: preventive vs emergency repair
- [ ] Recommended action and timeline
- [ ] Historical accuracy tracking
- [ ] Integration with maintenance schedules

**Story Points:** 13  
**Priority:** P1 (High)  
**Dependencies:** Story 5.1, 3.6  
**Technical Notes:**
- Machine learning model using scikit-learn
- Features: equipment age, service frequency, past issues
- Python microservice for ML predictions
- Update model monthly with new data

---

#### Story 5.4: AI Inspection Report Generation
**As a** property manager  
**I want to** AI to generate inspection reports automatically  
**So that** I can save time on documentation

**Acceptance Criteria:**
- [ ] AI creates structured report from photos
- [ ] Report sections: summary, issues found, recommendations
- [ ] Natural language descriptions
- [ ] Automatically categorize issues by severity
- [ ] Include annotated photos in report
- [ ] Comparison to previous inspection
- [ ] Pass/fail determination
- [ ] Export to PDF
- [ ] Email to tenant option
- [ ] Editable before finalizing

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 5.1  
**Technical Notes:**
- Use GPT-4 for natural language report generation
- Template-based with AI-filled sections
- PDF generation with photos inline

---

**Epic 5 Total Story Points:** 47 (Adjusted: 34 for Phase 2)

---

## Epic 6: Communication Hub

**Epic Description:** Centralized communication platform for all tenant, vendor, and staff interactions with message templates, automation, and full history.

**Business Value:** Improved response times, better tenant satisfaction, audit trail for legal purposes, reduced repetitive communication.

**Success Metrics:**
- 90% of messages sent via platform (vs phone/email)
- < 2 hour average response time
- 50% reduction in communication time via templates
- 100% message history retention

### User Stories

#### Story 6.1: Send Message to Tenant
**As a** property manager  
**I want to** send messages to tenants within the platform  
**So that** I have a record of all communications

**Acceptance Criteria:**
- [ ] Compose message to single tenant or multiple tenants
- [ ] Rich text editor (bold, italics, lists)
- [ ] Attach files (PDFs, images)
- [ ] Subject line
- [ ] Send via email notification to tenant
- [ ] Message appears in communication log
- [ ] Read receipts
- [ ] Reply tracking (threaded conversations)
- [ ] Search message history
- [ ] Filter by tenant, date, keyword

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.1  
**Technical Notes:**
- PostgreSQL table: `messages`
- SendGrid for email notifications
- Store in app database for history

---

#### Story 6.2: Message Templates
**As a** property manager  
**I want to** use pre-written message templates  
**So that** I can communicate efficiently

**Acceptance Criteria:**
- [ ] Pre-defined templates: late rent, maintenance update, lease renewal, etc.
- [ ] Template variables (tenant name, unit number, amount due, etc.)
- [ ] Auto-populate variables when sending
- [ ] Create custom templates
- [ ] Edit existing templates
- [ ] Category organization
- [ ] Preview before sending
- [ ] Template usage tracking
- [ ] Share templates across team

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 6.1  
**Technical Notes:**
- PostgreSQL table: `message_templates`
- Use handlebars for variable substitution
- Template library in shared workspace

---

#### Story 6.3: Bulk Messaging
**As a** property manager  
**I want to** send messages to multiple tenants at once  
**So that** I can make announcements efficiently

**Acceptance Criteria:**
- [ ] Select multiple tenants (all in property, all in building, custom selection)
- [ ] Compose message once, send to many
- [ ] Personalization with variables
- [ ] Schedule send time
- [ ] Delivery tracking (sent, delivered, read)
- [ ] Failed delivery alerts
- [ ] Unsubscribe option for non-critical messages
- [ ] Bulk message history

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 6.1, 6.2  
**Technical Notes:**
- Queue messages with BullMQ
- Rate limiting to avoid spam filters
- Batch processing

---

#### Story 6.4: Automated Notifications
**As a** property manager  
**I want to** automatically send messages based on triggers  
**So that** tenants receive timely information

**Acceptance Criteria:**
- [ ] Trigger types: rent due, lease expiring, maintenance scheduled, etc.
- [ ] Configurable timing (e.g., 3 days before rent due)
- [ ] Select template for each trigger
- [ ] Enable/disable triggers globally or per property
- [ ] Log of all automated messages
- [ ] Tenant preferences (opt-out of certain notifications)
- [ ] SMS option for critical notifications
- [ ] Delivery confirmation

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 6.2  
**Technical Notes:**
- Background jobs for scheduled notifications
- Twilio for SMS
- Tenant preferences table

---

#### Story 6.5: AI Message Assistant
**As a** property manager  
**I want to** get AI-suggested responses  
**So that** I can reply faster with appropriate tone

**Acceptance Criteria:**
- [ ] AI analyzes incoming message context
- [ ] Suggests 2-3 response options
- [ ] Appropriate tone (professional, empathetic, firm)
- [ ] References relevant lease terms if applicable
- [ ] Includes action items (create work order, schedule inspection)
- [ ] Edit suggested response before sending
- [ ] Learn from manager's edits over time
- [ ] Works for common scenarios (maintenance, late rent, complaints)

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 6.1  
**Technical Notes:**
- Use GPT-4 for response generation
- Context: message history, tenant info, lease details
- Feedback loop for improvement

---

#### Story 6.6: Communication Dashboard
**As a** property manager  
**I want to** see all recent communications in one place  
**So that** I don't miss important messages

**Acceptance Criteria:**
- [ ] Unified inbox (all incoming messages)
- [ ] Unread count badge
- [ ] Filter by: unread, flagged, tenant, property
- [ ] Sort by date, priority, tenant
- [ ] Quick reply from inbox
- [ ] Mark as read/unread
- [ ] Star/flag important messages
- [ ] Archive old conversations
- [ ] Search across all messages
- [ ] Export message history

**Story Points:** 5  
**Priority:** P0 (Critical)  
**Dependencies:** Story 6.1  
**Technical Notes:**
- Real-time updates with WebSocket
- Pagination for performance
- Full-text search in PostgreSQL

---

**Epic 6 Total Story Points:** 36 (Adjusted: 28 for MVP)

---

## Epic 7: Compliance & Legal

**Epic Description:** Automated compliance tracking for federal, state, and local regulations with deadline reminders and document generation.

**Business Value:** Avoid fines, lawsuits, and legal issues. Ensure all properties meet regulatory requirements.

**Success Metrics:**
- Zero compliance violations
- 100% on-time compliance task completion
- Reduce legal consultation needs by 40%
- Automated compliance checks before every lease

### User Stories

#### Story 7.1: Compliance Dashboard
**As a** property manager  
**I want to** see all compliance requirements in one place  
**So that** I can ensure I'm meeting all obligations

**Acceptance Criteria:**
- [ ] Three sections: Federal, State (MN), Local (Brooklyn Center)
- [ ] Status for each requirement (compliant, action needed, overdue)
- [ ] Overall compliance score (0-100)
- [ ] Color-coded urgency
- [ ] Filter by jurisdiction, property, status
- [ ] Quick link to take required action
- [ ] Upcoming deadlines calendar
- [ ] Compliance history log

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** None  
**Technical Notes:**
- PostgreSQL table: `compliance_items`
- Configurable rules engine
- Minnesota-specific initially, expandable

---

#### Story 7.2: Security Deposit Interest Compliance
**As a** property manager  
**I want to** automated security deposit interest tracking  
**So that** I comply with Minnesota Statute 504B.178

**Acceptance Criteria:**
- [ ] Auto-calculate 1% simple interest annually
- [ ] Track interest accrual monthly
- [ ] Alert 30 days before interest payment due
- [ ] Generate interest payment letters
- [ ] Track payment of interest to tenants
- [ ] 21-day disposition letter generation on move-out
- [ ] Alert if disposition not sent within deadline
- [ ] Audit trail of all interest payments

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 4.3  
**Technical Notes:**
- Background job calculates interest monthly
- Minnesota: interest due annually or at lease end
- 21-day disposition after move-out

---

#### Story 7.3: Lead Paint Disclosure Compliance
**As a** property manager  
**I want to** automatic lead paint disclosure for pre-1978 properties  
**So that** I comply with federal law

**Acceptance Criteria:**
- [ ] Flag properties built before 1978
- [ ] Mandatory disclosure on all leases for flagged properties
- [ ] Generate EPA-compliant disclosure form
- [ ] Track tenant acknowledgment (signature)
- [ ] Attach EPA pamphlet to disclosure
- [ ] Block lease finalization without disclosure
- [ ] Store disclosure records for 3 years (federal requirement)
- [ ] Audit log of all disclosures

**Story Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** Story 2.2  
**Technical Notes:**
- Federal: 42 USC § 4851-4856
- EPA pamphlet: "Protect Your Family from Lead"
- Auto-attach to leases for pre-1978 properties

---

#### Story 7.4: Rental License Tracking
**As a** property manager  
**I want to** track rental license renewals  
**So that** I don't operate with expired licenses

**Acceptance Criteria:**
- [ ] Record license number, issue date, expiration per property
- [ ] Alert 90 days before expiration
- [ ] Alert 60 days before expiration
- [ ] Alert 30 days before expiration
- [ ] Link to online renewal portal
- [ ] Track renewal fee payment
- [ ] Upload renewed license document
- [ ] Multi-jurisdiction support (Brooklyn Center, Minneapolis, etc.)
- [ ] Calendar of all license expirations

**Story Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** Story 1.1  
**Technical Notes:**
- PostgreSQL table: `licenses`
- Configurable reminder timing
- Brooklyn Center: annual renewal

---

#### Story 7.5: Crime-Free Housing Compliance
**As a** property manager  
**I want to** track Crime-Free Housing Program requirements  
**So that** I comply with Brooklyn Center ordinances

**Acceptance Criteria:**
- [ ] Crime-free addendum included in all leases (Brooklyn Center)
- [ ] Track manager certification status
- [ ] Track required property certifications
- [ ] Schedule annual Crime-Free meetings
- [ ] Log criminal activity reports to police
- [ ] Track lease terminations for criminal activity
- [ ] Generate quarterly compliance reports
- [ ] Alerts for missing certifications

**Story Points:** 8  
**Priority:** P1 (High - if in Brooklyn Center)  
**Dependencies:** Story 2.2  
**Technical Notes:**
- Specific to Brooklyn Center, MN
- May need to expand for other jurisdictions
- Link to police department reporting

---

#### Story 7.6: Fair Housing Compliance Checks
**As a** property manager  
**I want to** automated fair housing compliance checks  
**So that** I avoid discrimination claims

**Acceptance Criteria:**
- [ ] Screening criteria review (no discriminatory questions)
- [ ] Application form compliance check
- [ ] Lease terms review (no discriminatory clauses)
- [ ] Communication monitoring for discriminatory language (flagging)
- [ ] Reasonable accommodation request tracking
- [ ] Service animal vs pet distinction
- [ ] Training module for staff
- [ ] Audit trail of all application decisions

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Federal Fair Housing Act
- Minnesota source of income protection
- AI flagging of potential violations
- Disclaimer: not legal advice

---

**Epic 7 Total Story Points:** 42 (Adjusted: 38 for Phase 2)

---

## Epic 8: Document Management

**Epic Description:** Centralized document storage, generation, version control, and e-signature capabilities.

**Business Value:** Reduce paperwork, improve organization, enable remote operations, legal protection through proper documentation.

**Success Metrics:**
- 100% paperless operations
- < 30 seconds to find any document
- 95% e-signature adoption
- Zero lost documents

### User Stories

#### Story 8.1: Document Upload & Storage
**As a** property manager  
**I want to** upload and organize documents  
**So that** I can access them anytime

**Acceptance Criteria:**
- [ ] Upload multiple file types (PDF, JPG, PNG, DOCX, XLSX)
- [ ] Drag-and-drop upload
- [ ] Organize by property, unit, tenant, vendor
- [ ] Create folders and subfolders
- [ ] Tag documents with categories (lease, inspection, invoice, etc.)
- [ ] Search by filename, tags, content (OCR)
- [ ] Version control (track document revisions)
- [ ] Access control (who can view each document)
- [ ] Preview without downloading

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** None  
**Technical Notes:**
- Store files in Cloudflare R2
- PostgreSQL for metadata
- OCR with Tesseract for searchability
- Max file size: 25MB

---

#### Story 8.2: Lease Document Generation
**As a** property manager  
**I want to** generate lease documents automatically  
**So that** I don't manually create each lease

**Acceptance Criteria:**
- [ ] Lease template with all articles from Humboldt Court lease
- [ ] Auto-populate tenant, property, financial terms
- [ ] Select applicable addenda (pet, parking, crime-free, etc.)
- [ ] Generate compliant PDF
- [ ] Include all signatures blocks
- [ ] Preview before generating
- [ ] Edit generated document before sending
- [ ] Version control for lease templates
- [ ] Minnesota-compliant default clauses

**Story Points:** 13  
**Priority:** P0 (Critical)  
**Dependencies:** Story 2.2  
**Technical Notes:**
- Use docx template + docx-js library
- Template stored in DB or file system
- Compliance checks before generation
- Based on your actual Humboldt Court lease

---

#### Story 8.3: E-Signature Integration
**As a** property manager  
**I want to** collect signatures electronically  
**So that** tenants can sign remotely

**Acceptance Criteria:**
- [ ] Send document for signature
- [ ] Multiple signers (co-tenants)
- [ ] Signing order (manager first, then tenants)
- [ ] Email notification to signers
- [ ] Mobile-friendly signing experience
- [ ] Track signature status (pending, completed)
- [ ] Automatic reminders for unsigned documents
- [ ] Store fully executed documents
- [ ] Audit trail (who signed when)
- [ ] Certificate of completion

**Story Points:** 13  
**Priority:** P0 (Critical)  
**Dependencies:** Story 8.2  
**Technical Notes:**
- Consider DocuSign, HelloSign, or PandaDoc integration
- Or build custom with canvas signatures
- Store audit trail in DB
- ESIGN Act compliance

---

#### Story 8.4: Document Templates
**As a** property manager  
**I want to** create and use document templates  
**So that** I can quickly generate common documents

**Acceptance Criteria:**
- [ ] Template library (notices, letters, forms)
- [ ] Templates: late rent notice, lease violation, move-out letter, etc.
- [ ] Variable placeholders (tenant name, date, amount, etc.)
- [ ] Rich text editor for template creation
- [ ] Template categories
- [ ] Preview with sample data
- [ ] Generate document from template
- [ ] Share templates across team
- [ ] Import/export templates

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Similar to message templates
- Use handlebars or mustache for variables
- Store as docx templates

---

#### Story 8.5: Document Expiration Tracking
**As a** property manager  
**I want to** track document expiration dates  
**So that** I renew important documents on time

**Acceptance Criteria:**
- [ ] Set expiration date on documents (insurance, licenses, certifications)
- [ ] Alert 90, 60, 30 days before expiration
- [ ] Dashboard of expiring documents
- [ ] Upload renewal document
- [ ] Link renewal to original document (version chain)
- [ ] Expired document flag
- [ ] Auto-archive expired documents
- [ ] Calendar view of expirations

**Story Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Background job checks daily for expirations
- Email alerts at specified intervals
- Insurance, vendor certs most common

---

**Epic 8 Total Story Points:** 47 (Adjusted: 21 for MVP - defer e-sign to Phase 2)

---

## Epic 9: Reporting & Analytics

**Epic Description:** Advanced reporting, data visualization, and business intelligence for property performance analysis.

**Business Value:** Data-driven decision making, identify trends, optimize operations, investor reporting.

**Success Metrics:**
- 100% of decisions backed by data
- Reports generated in < 10 seconds
- 50% reduction in manual reporting time
- 95% stakeholder satisfaction with insights

### User Stories

#### Story 9.1: Property Performance Dashboard
**As a** property manager  
**I want to** see key performance metrics at a glance  
**So that** I can quickly assess property health

**Acceptance Criteria:**
- [ ] KPIs: occupancy rate, collection rate, NOI, maintenance cost ratio
- [ ] Compare current vs previous period
- [ ] Trend charts (6 months, 12 months)
- [ ] Property comparison (best/worst performers)
- [ ] Customizable dashboard widgets
- [ ] Export dashboard as PDF
- [ ] Schedule automated email delivery
- [ ] Real-time data updates

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 4.1, 4.5  
**Technical Notes:**
- Use Recharts for visualizations
- Redis cache for metrics
- Pre-compute daily aggregates

---

#### Story 9.2: Custom Report Builder
**As a** property manager  
**I want to** create custom reports  
**So that** I can analyze specific aspects of my business

**Acceptance Criteria:**
- [ ] Select data fields (rent, expenses, occupancy, etc.)
- [ ] Set filters (property, date range, tenant type)
- [ ] Choose grouping (by property, by month, by category)
- [ ] Select chart type (bar, line, pie, table)
- [ ] Save custom reports for reuse
- [ ] Schedule recurring report generation
- [ ] Export to PDF, CSV, Excel
- [ ] Share reports with stakeholders

**Story Points:** 13  
**Priority:** P1 (High)  
**Dependencies:** Story 4.6  
**Technical Notes:**
- Query builder interface
- Store report definitions in DB
- Generate on-demand or scheduled
- Use puppeteer for PDF generation

---

#### Story 9.3: Tenant Analytics
**As a** property manager  
**I want to** analyze tenant behavior and demographics  
**So that** I can improve tenant selection and retention

**Acceptance Criteria:**
- [ ] Average lease duration
- [ ] Renewal rate by property
- [ ] Early termination rate
- [ ] Payment history analysis (on-time %)
- [ ] Maintenance request frequency per tenant
- [ ] Tenant satisfaction scores (if surveys implemented)
- [ ] Demographics (age range, household size) - anonymized
- [ ] Segment tenants (excellent, good, problematic)

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 2.1, 4.1  
**Technical Notes:**
- Privacy considerations for demographic data
- Aggregate data only
- Identify retention strategies

---

#### Story 9.4: Maintenance Analytics
**As a** property manager  
**I want to** analyze maintenance trends  
**So that** I can identify recurring issues and optimize costs

**Acceptance Criteria:**
- [ ] Most common maintenance categories
- [ ] Average cost per category
- [ ] Average completion time by priority
- [ ] Vendor performance comparison
- [ ] Maintenance cost per unit
- [ ] Seasonal patterns (HVAC in summer, heating in winter)
- [ ] Identify problematic units (high maintenance frequency)
- [ ] Preventive vs reactive maintenance ratio

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.8  
**Technical Notes:**
- Time-series analysis
- Identify anomalies
- Feed into predictive maintenance

---

**Epic 9 Total Story Points:** 37 (Adjusted: 31 for Phase 2)

---

## Epic 10: Mobile Experience

**Epic Description:** Native mobile apps (iOS/Android) and progressive web app for on-the-go property management.

**Business Value:** Enable mobile property management, improve response times, appeal to modern property managers.

**Success Metrics:**
- 70% of actions completed on mobile
- App store rating > 4.5 stars
- < 3 second mobile load time
- 90% feature parity with web

### User Stories

#### Story 10.1: Mobile Dashboard
**As a** property manager  
**I want to** access dashboard on my phone  
**So that** I can check property status anywhere

**Acceptance Criteria:**
- [ ] Mobile-optimized dashboard layout
- [ ] Key metrics displayed (occupancy, revenue, urgent items)
- [ ] Quick actions (create work order, message tenant)
- [ ] Pull-to-refresh
- [ ] Offline mode for viewing cached data
- [ ] Push notifications for urgent items
- [ ] Touch-optimized navigation
- [ ] Fast load time (< 3 seconds)

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Dashboard (Story 1.2)  
**Technical Notes:**
- Progressive Web App (PWA)
- Service worker for offline
- IndexedDB for local storage
- Push API for notifications

---

#### Story 10.2: Mobile Photo Upload for Inspections
**As a** property manager  
**I want to** take photos during inspections and upload directly  
**So that** I can document issues immediately

**Acceptance Criteria:**
- [ ] Camera access from app
- [ ] Take multiple photos in sequence
- [ ] Auto-tag with location (GPS)
- [ ] Auto-tag with timestamp
- [ ] Compress images before upload
- [ ] Upload in background
- [ ] Attach to work order or inspection
- [ ] Works offline (queue for later upload)

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.1, 5.1  
**Technical Notes:**
- Camera API
- Image compression library
- Background sync API
- Queue uploads in IndexedDB

---

#### Story 10.3: Mobile Work Order Management
**As a** property manager  
**I want to** create and update work orders on mobile  
**So that** I can respond to issues immediately

**Acceptance Criteria:**
- [ ] Create work order with simplified form
- [ ] Voice-to-text for description
- [ ] Take photo and attach
- [ ] Assign to vendor with one tap
- [ ] Update status from list view
- [ ] Filter and search work orders
- [ ] View work order details
- [ ] Call tenant or vendor directly from app
- [ ] Navigation to property (Google Maps integration)

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 3.2, 3.3  
**Technical Notes:**
- Web Speech API for voice input
- Tel: links for phone calls
- Google Maps API for directions

---

#### Story 10.4: Mobile Messaging
**As a** property manager  
**I want to** send and receive messages on mobile  
**So that** I can communicate with tenants from anywhere

**Acceptance Criteria:**
- [ ] Inbox view with unread count
- [ ] Push notifications for new messages
- [ ] Quick reply with templates
- [ ] Voice message recording
- [ ] Attach photos to messages
- [ ] Read/unread status
- [ ] Search messages
- [ ] Offline message draft

**Story Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** Story 6.1  
**Technical Notes:**
- Real-time with WebSocket
- Push notifications via service worker
- Web Audio API for voice recording

---

**Epic 10 Total Story Points:** 29 (Adjusted: 26 for Phase 2)

---

## Epic 11: User Management & Security

**Epic Description:** User authentication, authorization, team collaboration, and security features.

**Business Value:** Multi-user access, role-based permissions, security compliance, team collaboration.

**Success Metrics:**
- Zero security breaches
- < 30 seconds user onboarding
- 100% RBAC coverage
- SOC 2 compliance ready

### User Stories

#### Story 11.1: User Registration & Authentication
**As a** new user  
**I want to** create an account and log in securely  
**So that** I can access the platform

**Acceptance Criteria:**
- [ ] Email + password registration
- [ ] Email verification required
- [ ] Password strength requirements (8+ chars, uppercase, number, symbol)
- [ ] Login with email + password
- [ ] "Remember me" option
- [ ] Password reset flow
- [ ] Two-factor authentication (optional)
- [ ] Social login (Google, Microsoft) - optional
- [ ] Session management (auto-logout after inactivity)

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** None  
**Technical Notes:**
- Use Auth0, Clerk, or Supabase Auth
- JWT tokens for sessions
- Bcrypt for password hashing
- HTTPS only

---

#### Story 11.2: Role-Based Access Control
**As an** admin  
**I want to** assign roles to team members  
**So that** they only access what they need

**Acceptance Criteria:**
- [ ] Roles: Admin, Property Manager, Maintenance, Accountant, Viewer
- [ ] Granular permissions per role
- [ ] Admin: full access
- [ ] Property Manager: manage tenants, leases, work orders
- [ ] Maintenance: view and update work orders only
- [ ] Accountant: view financial data, record payments
- [ ] Viewer: read-only access
- [ ] Assign multiple roles to one user
- [ ] Property-level access control (user can only see assigned properties)

**Story Points:** 8  
**Priority:** P0 (Critical)  
**Dependencies:** Story 11.1  
**Technical Notes:**
- PostgreSQL tables: `users`, `roles`, `permissions`, `user_roles`
- Middleware checks on every API endpoint
- Frontend route guards

---

#### Story 11.3: Team Collaboration
**As a** team member  
**I want to** collaborate with other team members  
**So that** we can work together efficiently

**Acceptance Criteria:**
- [ ] Invite team members by email
- [ ] Pending invitation management
- [ ] User list with roles
- [ ] Edit user roles
- [ ] Deactivate users
- [ ] Activity log (who did what)
- [ ] @mention in messages
- [ ] Assign tasks to team members
- [ ] Notification preferences per user

**Story Points:** 8  
**Priority:** P1 (High)  
**Dependencies:** Story 11.2  
**Technical Notes:**
- Email invitations via SendGrid
- Activity log table: `audit_log`
- Real-time collaboration features in Phase 3

---

#### Story 11.4: Audit Trail
**As an** admin  
**I want to** see a log of all system actions  
**So that** I can track changes for security and compliance

**Acceptance Criteria:**
- [ ] Log all create, update, delete actions
- [ ] Record: user, action, timestamp, entity, old value, new value
- [ ] Filter by user, action type, date range, entity
- [ ] Search audit log
- [ ] Export audit log
- [ ] Retention policy (keep for 7 years for legal)
- [ ] Immutable log (cannot be deleted or edited)
- [ ] Critical actions flagged (lease deletions, payment refunds)

**Story Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** Story 11.1  
**Technical Notes:**
- PostgreSQL table: `audit_log`
- Middleware logs all mutations
- Separate database or write-once storage
- Indexed for fast queries

---

**Epic 11 Total Story Points:** 29

---

## Release Planning

### Phase 1: MVP (Weeks 1-16)

**Goal:** Launch functional property management system with core features

**Epics Included:**
- Epic 1: Core Property & Unit Management (34 pts)
- Epic 2: Tenant Management & Leasing (55 pts)
- Epic 3: Maintenance & Work Orders (42 pts)
- Epic 4: Financial Management (47 pts)
- Epic 6: Communication Hub (28 pts)
- Epic 8: Document Management (21 pts - basic)
- Epic 11: User Management & Security (29 pts)

**Total MVP Story Points:** 256  
**Estimated Duration:** 16-20 weeks (assuming 15-20 pts/week)

**Sprint Breakdown (2-week sprints):**
1. **Sprint 1-2:** User auth, property/unit management
2. **Sprint 3-4:** Tenant profiles, lease creation
3. **Sprint 5-6:** Maintenance & work orders
4. **Sprint 7-8:** Financial tracking, rent collection
5. **Sprint 9-10:** Communication hub, messaging
6. **Sprint 11-12:** Document storage, basic templates
7. **Sprint 13-14:** Security deposits, compliance basics
8. **Sprint 15-16:** Bug fixes, polish, testing

---

### Phase 2: Advanced Features (Weeks 17-28)

**Goal:** Differentiate with AI and advanced features

**Epics Included:**
- Epic 5: AI-Powered Inspections (34 pts)
- Epic 7: Compliance & Legal (38 pts)
- Epic 9: Reporting & Analytics (31 pts)
- Epic 10: Mobile Experience (26 pts)
- Epic 8: E-Signature (26 pts additional)

**Total Phase 2 Story Points:** 155  
**Estimated Duration:** 10-12 weeks

---

### Phase 3: Optimization & Expansion (Weeks 29+)

**Goal:** Scale, optimize, and add nice-to-have features

**Features:**
- Tenant portal
- Vendor portal
- API for integrations
- Accounting software sync (QuickBooks, Xero)
- Background checks integration
- Rent collection processing (Stripe, ACH)
- Advanced AI features
- White-label options

---

## Prioritization Framework

### Priority Levels

**P0 (Critical):** Must-have for MVP. Product cannot function without these.

**P1 (High):** Important for competitive differentiation. Include in Phase 2.

**P2 (Medium):** Nice-to-have features. Include in Phase 3 or later.

**P3 (Low):** Future enhancements. Parking lot for now.

---

## Story Point Estimation Guide

**1-2 Points:** Simple changes, minor features (< 1 day)  
**3-5 Points:** Small features, straightforward implementation (1-3 days)  
**8 Points:** Medium complexity, some unknowns (3-5 days)  
**13 Points:** Large features, multiple dependencies (5-8 days)  
**21+ Points:** Epic-sized, should be broken down further

---

## Success Criteria for MVP Launch

✅ Property managers can:
- Add properties and units
- Create and manage tenant leases
- Track rent payments and balances
- Create and assign work orders
- Send messages to tenants
- Generate basic financial reports
- Store and organize documents
- Invite team members with role-based access

✅ Technical requirements:
- < 2 second page load time
- Mobile responsive (works on phones)
- 99.9% uptime
- Data encrypted at rest and in transit
- Daily backups
- SOC 2 compliance ready

✅ User experience:
- Intuitive navigation (< 3 clicks to any feature)
- Clear error messages
- Helpful onboarding flow
- Contextual help/tooltips

---

## Next Steps

1. **Validate with stakeholders:** Review epics and priorities
2. **Technical architecture:** Database schema, API design, tech stack finalization
3. **Design system:** Create UI component library, design mockups
4. **Sprint planning:** Break down first sprint into tasks
5. **Development kickoff:** Begin Sprint 1

---

**Document Version:** 1.0  
**Maintained by:** Product Team  
**Last Review:** December 31, 2024  
**Next Review:** Quarterly or as needed
