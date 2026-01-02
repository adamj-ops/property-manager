# Everyday Property Manager - Project Checklist

**Last Updated:** January 2, 2026  
**Linked to:** [Linear Project - Property Management (EPM)](https://linear.app/everyday-co/project/property-management-bb1d88383bbb)  
**Team:** Property Management (EPM)

**Spec Pack (Detailed):** https://linear.app/everyday-co/document/epm-spec-pack-v1-detailed-technical-specs-diagrams-bbc31e71e753  
**Repo Specs:** `/.cursor/docs/epm/` (rendered on GitHub)

> **✅ All stories are linked to Linear issues (EPM-XXX). Check Linear for current status.**

---

## 📋 Table of Contents

1. [Infrastructure & DevOps](#infrastructure--devops)
2. [Phase 1: MVP Development](#phase-1-mvp-development)
3. [Phase 2: Advanced Features](#phase-2-advanced-features)
4. [Documentation Status](#documentation-status)

---

## Infrastructure & DevOps

### Critical/Blocker Issues

#### EPM-1: Database Schema Implementation - **URGENT**
- [ ] Create all core tables (properties, units, tenants, leases, lease_tenants)
- [ ] Create financial tables (payments, security_deposits, expenses)
- [ ] Create maintenance tables (work_orders, work_order_status_history, vendors)
- [ ] Create communication tables (messages, message_templates)
- [ ] Create document tables (documents)
- [ ] Create inspection tables (inspections)
- [ ] Create pet table
- [ ] Create audit_log table
- [ ] Create teams and team_members tables
- [ ] Add all indexes per spec
- [ ] Add foreign key constraints
- [ ] Create Prisma schema file
- [ ] Create initial migration
- [ ] Test migration on dev database

#### EPM-2: Supabase Storage Buckets (Documents & Media) - **URGENT**
- [ ] Create Supabase Storage buckets (`documents`, `media`)
- [ ] Configure Supabase credentials in environment variables (server-only service key)
- [x] Implement storage service (`src/server/storage.ts`)
- [x] Implement signed URL generation (upload + download)
- [ ] Finalize path convention (Option A user-scoped)
- [x] Add file size limits (25MB max)
- [x] Implement file deletion service
- [x] Add error handling for upload failures
- [ ] Configure Storage policies (RLS) and verify end-to-end upload/download/delete flows

#### EPM-4: SendGrid Email Setup - **URGENT**
- [ ] Create SendGrid account and API key
- [ ] Configure SendGrid credentials in environment variables
- [ ] Implement email service (`src/server/email.ts`)
- [ ] Create email templates (verification, notifications, receipts)
- [ ] Set up email sending for user verification, lease expiration, work orders, payments, late fees
- [ ] Implement email queue for bulk sending
- [ ] Add email delivery tracking
- [ ] Test email delivery in dev/staging

#### EPM-7: API Service Layer Architecture - **URGENT**
- [ ] Create service directory structure (`src/services/`)
- [ ] Implement service pattern (api.ts, query.ts, schema.ts)
- [ ] Set up authentication middleware
- [ ] Create authorization helpers (requireRole, requirePropertyAccess)
- [ ] Implement audit logging middleware
- [ ] Set up error handling patterns
- [ ] Create base service utilities
- [ ] Document service patterns for team

### High Priority Issues

#### EPM-3: Google Places API Setup
- [ ] Create Google Cloud project and enable Places API
- [ ] Configure API key in environment variables
- [ ] Implement address validation service
- [ ] Implement geocoding service (lat/lng)
- [ ] Add address autocomplete to property form
- [ ] Validate addresses before saving properties
- [ ] Store geocoded coordinates in properties table
- [ ] Handle API errors gracefully
- [ ] Add rate limiting for API calls

#### EPM-6: Background Jobs Setup (BullMQ/Redis)
- [ ] Set up Redis instance (local dev + production)
- [ ] Configure Redis connection
- [ ] Install and configure BullMQ
- [ ] Create job queues (email, notification, compliance, reports)
- [ ] Implement scheduled jobs (lease expiration, rent reminders, late fees, etc.)
- [ ] Create job workers
- [ ] Add job monitoring/retry logic
- [ ] Test job execution

#### EPM-8: CI/CD Pipeline Setup
- [ ] Create GitHub Actions workflow file
- [ ] Set up automated testing (unit, integration)
- [ ] Add linting and type checking
- [ ] Configure staging deployment (auto on PR merge)
- [ ] Configure production deployment (manual approval)
- [ ] Add database migration step to pipeline
- [ ] Set up environment variable management
- [ ] Add deployment notifications
- [ ] Test full pipeline end-to-end

#### EPM-9: Testing Framework Setup
- [ ] Choose testing libraries (Vitest, React Testing Library, Playwright)
- [ ] Configure test environment
- [ ] Set up test database for integration tests
- [ ] Create test utilities and helpers
- [ ] Write example unit tests for services
- [ ] Write example integration tests for API endpoints
- [ ] Set up E2E testing with Playwright
- [ ] Add test coverage reporting
- [ ] Integrate tests into CI/CD pipeline
- [ ] Document testing patterns and best practices

### Medium Priority Issues

#### EPM-5: Caching Layer Setup (Redis)
- [ ] Configure Redis connection for caching
- [ ] Implement cache service (`src/server/cache.ts`)
- [ ] Define cache keys structure
- [ ] Implement cache invalidation functions
- [ ] Add caching for portfolio metrics, property lists, search results, computed fields
- [ ] Add cache warming strategies
- [ ] Monitor cache hit rates
- [ ] Test cache invalidation on data updates

#### EPM-10: Monitoring & Observability Setup
- [ ] Set up Sentry for error tracking
- [ ] Configure error boundaries in React app
- [ ] Set up PostHog for product analytics
- [ ] Add performance monitoring (Vercel Analytics)
- [ ] Set up uptime monitoring
- [ ] Configure logging service
- [ ] Add application health checks
- [ ] Create monitoring dashboard
- [ ] Set up alerting for critical errors

#### EPM-12: API Documentation Generation
- [ ] Choose documentation tool (OpenAPI/Swagger or similar)
- [ ] Add API documentation annotations to server functions
- [ ] Generate API documentation automatically
- [ ] Host documentation (internal or public)
- [ ] Include request/response examples
- [ ] Document authentication requirements
- [ ] Keep documentation updated with code changes

#### EPM-11: User Guide & Help Documentation
- [ ] Create user guide structure
- [ ] Write getting started guide
- [ ] Document all major features
- [ ] Add screenshots and examples
- [ ] Create FAQ section
- [ ] Add video tutorials (optional)
- [ ] Host documentation (help center or in-app)

#### EPM-13: Deployment Guide
- [ ] Document environment setup
- [ ] Document database migration process
- [ ] Document environment variables
- [ ] Document deployment steps
- [ ] Document rollback procedures
- [ ] Document monitoring and alerting
- [ ] Document backup/restore procedures
- [ ] Document troubleshooting common issues

---

## Phase 1: MVP Development

### Epic 1: Core Property & Unit Management (34 points)

#### EPM-17: Story 1.1: Add New Property (5 pts) - P0
- [ ] Property form with name, address, type, year built, total units
- [ ] Google Places API integration for address validation
- [ ] Automatic geocoding for map display
- [ ] Property photos upload (up to 20 images)
- [ ] Save as draft or publish immediately
- [ ] Duplicate address validation

#### EPM-14: Story 1.2: View Property Portfolio Dashboard (3 pts) - P0
- [ ] Dashboard displays all properties with key metrics
- [ ] Metrics: total units, occupancy %, monthly revenue, # of issues
- [ ] Sortable by name, occupancy, revenue
- [ ] Filterable by property type, location, occupancy status
- [ ] Visual indicators for properties requiring attention
- [ ] Click navigation to property detail
- [ ] Load time < 2 seconds with 50+ properties

#### EPM-15: Story 1.3: Add Units to Property (8 pts) - P0
- [ ] Single unit creation form
- [ ] Bulk add with pattern-based creation (e.g., Units 101-110)
- [ ] Unit form: number, bedrooms, bathrooms, sq ft, floor, type
- [ ] Amenities checklist (dishwasher, A/C, balcony, etc.)
- [ ] Market rent setting per unit
- [ ] Unit-specific photo upload
- [ ] Duplicate unit number validation

#### EPM-16: Story 1.4: Edit Property/Unit Details (5 pts) - P0
- [ ] Edit button on property/unit detail pages
- [ ] Pre-populated form with current values
- [ ] Change tracking (show what changed)
- [ ] Audit log of all changes with timestamp and user
- [ ] Optimistic updates for instant UI feedback

#### EPM-19: Story 1.5: View Unit Availability Status (5 pts) - P0
- [ ] Visual status indicators (color-coded badges)
- [ ] Status types: Occupied, Vacant, Notice Given, Under Renovation, Offline
- [ ] Filterable by status
- [ ] Auto-update when lease starts/ends
- [ ] Manual override for special situations
- [ ] Vacancy duration calculation

#### EPM-18: Story 1.6: Property Detail Page (8 pts) - P0
- [ ] Overview section with property details and key metrics
- [ ] List of all units with current status
- [ ] Active tenants summary
- [ ] Recent maintenance activity
- [ ] Financial summary (revenue, expenses)
- [ ] Upcoming lease expirations
- [ ] Quick action buttons (add unit, create lease, message tenants)
- [ ] Responsive design for mobile

---

### Epic 2: Tenant Management & Leasing (55 points)

#### EPM-21: Story 2.1: Tenant Profile Creation (8 pts) - P0
- [ ] Form: full name, email, phone, emergency contact
- [ ] Multiple contact methods per tenant
- [ ] Employment information (employer, income)
- [ ] Previous address history
- [ ] Co-tenants/roommates linkage
- [ ] Vehicle information for parking
- [ ] Photo upload for tenant identification
- [ ] SSN/ID encrypted at rest
- [ ] Email verification workflow

#### EPM-20: Story 2.2: Create New Lease Agreement (13 pts) - P0
- [ ] Unit and tenant selection
- [ ] Lease dates (start, end)
- [ ] Monthly rent and security deposit amounts
- [ ] Security deposit interest calculation (MN requirement)
- [ ] Co-tenant addition to same lease
- [ ] Applicable addenda selection (pet, parking, etc.)
- [ ] Lease preview before finalizing
- [ ] PDF generation for signing
- [ ] No overlapping leases validation

#### EPM-22: Story 2.3: Lease Expiration Tracking (8 pts) - P0
- [ ] Dashboard shows leases expiring in next 90 days
- [ ] Color-coded urgency (red < 30 days, yellow < 60 days)
- [ ] Automated email notifications at 90, 60, 30 days
- [ ] Quick action to start renewal process
- [ ] Filter tenant list by expiration date
- [ ] Batch operations for multiple renewals

#### EPM-23: Story 2.4: Lease Renewal Workflow (8 pts) - P0
- [ ] "Renew Lease" button on tenant detail page
- [ ] Pre-populate with current lease terms
- [ ] Rent amount adjustment (show % increase/decrease)
- [ ] Lease duration adjustment
- [ ] Update addenda if needed
- [ ] Generate renewal letter/agreement
- [ ] Track renewal status (offered, accepted, declined)
- [ ] Auto-extend lease if accepted
- [ ] Convert to month-to-month option

#### EPM-24: Story 2.5: Tenant List & Search (5 pts) - P0
- [ ] Paginated list of all tenants
- [ ] Search by name, unit number, email, phone
- [ ] Filter by property, lease status, payment status
- [ ] Sort by name, unit, lease end date, rent amount
- [ ] Quick view of key info (unit, rent, lease dates)
- [ ] Status badges (current, past due, expiring soon)
- [ ] Bulk selection for batch operations
- [ ] Export to CSV

#### EPM-25: Story 2.6: Tenant Detail Page (8 pts) - P0
- [ ] Overview section with contact info and lease summary
- [ ] Payment history and current balance
- [ ] Active lease details and documents
- [ ] Maintenance request history
- [ ] Communication log (all messages/emails)
- [ ] Document repository (lease, addenda, notices)
- [ ] Recent inspections and violations
- [ ] Pet information if applicable
- [ ] Quick actions (message, create work order, process payment)

#### EPM-26: Story 2.7: Pet Application & Approval (8 pts) - P0
- [ ] Pet application form (name, type, breed, weight, age)
- [ ] Photo upload for pet
- [ ] Vaccination records upload
- [ ] License number and authority
- [ ] Approval workflow (pending, approved, denied)
- [ ] Pet rent and/or pet deposit setting
- [ ] Pet addendum generation upon approval
- [ ] Email notification on approval/denial
- [ ] Weight limit enforcement (80 lbs)

#### EPM-27: Story 2.8: Move-In Inspection (8 pts) - P0
- [ ] Digital inspection form with room-by-room checklist
- [ ] Photo upload for each area
- [ ] Condition ratings (excellent, good, fair, poor)
- [ ] Notes field for detailed observations
- [ ] Pre-existing damage documentation
- [ ] Tenant digital signature
- [ ] PDF inspection report generation
- [ ] Report attached to tenant profile

#### EPM-28: Story 2.9: Move-Out Process (13 pts) - P0
- [ ] Initiate move-out when tenant gives notice
- [ ] Schedule move-out inspection
- [ ] Move-out inspection form (same format as move-in)
- [ ] Compare move-out to move-in condition
- [ ] Calculate damages beyond normal wear
- [ ] Security deposit deduction itemization
- [ ] Generate security deposit disposition letter (MN requirement)
- [ ] Process deposit refund or send invoice for damages
- [ ] Update unit status to "vacant"
- [ ] Create turnover work order if needed
- [ ] 21-day disposition deadline tracking

---

### Epic 3: Maintenance & Work Orders (25 MVP points)

#### EPM-29: Story 3.1: Tenant Submit Maintenance Request (5 pts) - P0
- [ ] Simple form with issue description
- [ ] Category selection (plumbing, electrical, HVAC, etc.)
- [ ] Priority selection (emergency, urgent, normal, low)
- [ ] Photo upload (up to 5 images)
- [ ] Preferred access times
- [ ] Entry permission (yes/no)
- [ ] Automatic email confirmation to tenant
- [ ] Request appears in manager's queue
- [ ] Mobile-friendly interface

#### EPM-30: Story 3.2: Property Manager View Work Orders (5 pts) - P0
- [ ] List view of all work orders
- [ ] Filter by status (open, in progress, scheduled, completed)
- [ ] Filter by property, priority, category
- [ ] Sort by date created, priority, unit number
- [ ] Color-coded priority indicators
- [ ] Search by unit number, tenant name, description
- [ ] Quick stats (# open, # overdue, avg completion time)
- [ ] Overdue work orders highlighted

#### EPM-31: Story 3.3: Assign Work Order to Vendor (5 pts) - P0
- [ ] Dropdown list of vendors/staff
- [ ] Filter vendors by category specialty
- [ ] Set estimated cost
- [ ] Set scheduled date/time
- [ ] Add notes/instructions for vendor
- [ ] Automated email notification to assigned vendor
- [ ] Vendor contact info easily accessible
- [ ] Track assignment history
- [ ] Reassign capability

#### EPM-32: Story 3.4: Update Work Order Status (5 pts) - P0
- [ ] Status options: Open, Scheduled, In Progress, Completed, Cancelled
- [ ] Status update notes
- [ ] Completion photos upload
- [ ] Record actual cost
- [ ] Record completion date/time
- [ ] Tenant automatically notified when completed
- [ ] Status history tracked with timestamps

#### EPM-33: Story 3.5: Vendor Management (5 pts) - P0
- [ ] Add vendor: company name, contact person, phone, email
- [ ] Vendor categories/specialties
- [ ] Service area (which properties they serve)
- [ ] Rate information
- [ ] Insurance info and expiration tracking
- [ ] Active/inactive status
- [ ] Preferred vendor designation

---

### Epic 4: Financial Management (42 MVP points)

#### EPM-34: Story 4.1: Record Rent Payments (8 pts) - P0
- [ ] Select tenant/lease
- [ ] Enter payment amount, date, method (check, ACH, cash, card)
- [ ] Allocate payment (rent, late fee, pet rent, utilities)
- [ ] Partial payment handling
- [ ] Generate receipt
- [ ] Email receipt to tenant
- [ ] Update tenant balance immediately
- [ ] Record check number if applicable
- [ ] Flag bounced payments

#### EPM-35: Story 4.2: Rent Collection Dashboard (8 pts) - P0
- [ ] Monthly expected revenue vs collected
- [ ] List of tenants who haven't paid (past due)
- [ ] Days past due for each delinquent tenant
- [ ] Late fee calculations (MN $50 cap)
- [ ] Outstanding balance per tenant
- [ ] Payment history per tenant
- [ ] Quick action to send payment reminder
- [ ] Filter by property, payment status
- [ ] Collection rate percentage

#### EPM-36: Story 4.3: Security Deposit Management (13 pts) - P0
- [ ] Record security deposit on lease creation
- [ ] Track deposit amount and received date
- [ ] Auto-calculate interest (1% annually for MN)
- [ ] Interest accrual shown monthly
- [ ] Generate interest payment at lease end or annually
- [ ] Deduction tracking on move-out
- [ ] Generate disposition letter (itemized deductions)
- [ ] Track refund payment
- [ ] 21-day disposition alert (MN requirement)
- [ ] Separate account tracking for deposits

#### EPM-37: Story 4.4: Late Fee Automation (5 pts) - P0
- [ ] Late fee amount set in lease
- [ ] Grace period set in lease (e.g., 5 days)
- [ ] Auto-calculate late fee after grace period
- [ ] Add late fee to tenant balance
- [ ] Email notification to tenant about late fee
- [ ] Waive late fee option (manager override)
- [ ] Track late fee revenue separately
- [ ] Comply with Minnesota $50 cap
- [ ] Late fee waiver reason tracking

#### EPM-38: Story 4.5: Expense Tracking (8 pts) - P0
- [ ] Add expense: date, amount, category, vendor, property
- [ ] Categories: maintenance, utilities, insurance, taxes, management fees
- [ ] Link expense to work order if applicable
- [ ] Upload receipt/invoice
- [ ] Recurring expenses (monthly insurance, annual taxes)
- [ ] Allocate expense across multiple properties
- [ ] Tag as capital improvement vs operating expense
- [ ] Export for accounting/tax purposes
- [ ] Monthly expense totals by category

---

### Epic 6: Communication Hub (20 MVP points)

#### EPM-39: Story 6.1: Send Message to Tenant (5 pts) - P0
- [ ] Compose message to single or multiple tenants
- [ ] Rich text editor (bold, italics, lists)
- [ ] Attach files (PDFs, images)
- [ ] Subject line
- [ ] Send via email notification to tenant
- [ ] Message appears in communication log
- [ ] Read receipts
- [ ] Reply tracking (threaded conversations)
- [ ] Search message history
- [ ] Filter by tenant, date, keyword

#### EPM-40: Story 6.2: Message Templates (5 pts) - P0
- [ ] Pre-defined templates: late rent, maintenance update, lease renewal
- [ ] Template variables (tenant name, unit number, amount due)
- [ ] Auto-populate variables when sending
- [ ] Create custom templates
- [ ] Edit existing templates
- [ ] Category organization
- [ ] Preview before sending
- [ ] Template usage tracking

#### EPM-41: Story 6.3: Bulk Messaging (5 pts) - P0
- [ ] Select multiple tenants (all in property, all in building, custom)
- [ ] Compose message once, send to many
- [ ] Personalization with variables
- [ ] Schedule send time
- [ ] Delivery tracking (sent, delivered, read)
- [ ] Failed delivery alerts
- [ ] Bulk message history

#### EPM-42: Story 6.6: Communication Dashboard (5 pts) - P0
- [ ] Unified inbox (all incoming messages)
- [ ] Unread count badge
- [ ] Filter by: unread, flagged, tenant, property
- [ ] Sort by date, priority, tenant
- [ ] Quick reply from inbox
- [ ] Mark as read/unread
- [ ] Star/flag important messages
- [ ] Archive old conversations
- [ ] Search across all messages

---

### Epic 8: Document Management (21 MVP points)

#### EPM-44: Story 8.1: Document Upload & Storage (8 pts) - P0
- [ ] Upload multiple file types (PDF, JPG, PNG, DOCX, XLSX)
- [ ] Drag-and-drop upload
- [ ] Organize by property, unit, tenant, vendor
- [ ] Create folders and subfolders
- [ ] Tag documents with categories
- [ ] Search by filename, tags, content (OCR)
- [ ] Version control (track document revisions)
- [ ] Access control (who can view each document)
- [ ] Preview without downloading

#### EPM-43: Story 8.2: Lease Document Generation (13 pts) - P0
- [ ] Lease template with all articles
- [ ] Auto-populate tenant, property, financial terms
- [ ] Select applicable addenda
- [ ] Generate compliant PDF
- [ ] Include all signature blocks
- [ ] Preview before generating
- [ ] Edit generated document before sending
- [ ] Version control for lease templates
- [ ] Minnesota-compliant default clauses

---

### Epic 11: User Management & Security (16 MVP points)

#### EPM-46: Story 11.1: User Registration & Authentication (8 pts) - P0
- [ ] Email + password registration
- [ ] Email verification required
- [ ] Password strength requirements
- [ ] Login with email + password
- [ ] "Remember me" option
- [ ] Password reset flow
- [ ] Two-factor authentication (optional)
- [ ] Social login (Google, Microsoft) - optional
- [ ] Session management (auto-logout after inactivity)

#### EPM-45: Story 11.2: Role-Based Access Control (8 pts) - P0
- [ ] Roles: Admin, Property Manager, Maintenance, Accountant, Viewer
- [ ] Granular permissions per role
- [ ] Admin: full access
- [ ] Property Manager: manage tenants, leases, work orders
- [ ] Maintenance: view and update work orders only
- [ ] Accountant: view financial data, record payments
- [ ] Viewer: read-only access
- [ ] Assign multiple roles to one user
- [ ] Property-level access control

---

## Phase 2: Advanced Features

### Epic 5: AI-Powered Inspections (34 points)

#### EPM-48: Story 5.1: AI Photo Analysis for Inspections (13 pts) - P1
- [ ] Upload multiple photos (up to 50 per inspection)
- [ ] AI analyzes each photo for common issues
- [ ] Detection: water damage, mold, pest evidence, cleanliness, damage
- [ ] Confidence score for each detection
- [ ] Highlighted areas showing where issue was detected
- [ ] AI-generated description of issue
- [ ] Suggested action for each issue
- [ ] Cost estimation for repairs
- [ ] False positive dismissal
- [ ] Manual override/correction

#### EPM-47: Story 5.2: Automated Violation Detection (13 pts) - P1
- [ ] Detect unauthorized pets
- [ ] Detect excessive clutter/hoarding
- [ ] Detect unsanitary conditions
- [ ] Detect unauthorized occupants
- [ ] Detect prohibited items (grills on balconies)
- [ ] Auto-generate violation notice draft
- [ ] Link to specific lease clause violated
- [ ] Recommended fee based on lease
- [ ] Escalation path if repeated violations

#### EPM-49: Story 5.3: Predictive Maintenance Alerts (13 pts) - P1
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

#### EPM-50: Story 5.4: AI Inspection Report Generation (8 pts) - P1
- [ ] AI creates structured report from photos
- [ ] Report sections: summary, issues found, recommendations
- [ ] Natural language descriptions
- [ ] Categorize issues by severity
- [ ] Include annotated photos in report
- [ ] Comparison to previous inspection
- [ ] Pass/fail determination
- [ ] Export to PDF
- [ ] Email to tenant option
- [ ] Editable before finalizing

---

### Epic 3: Maintenance - Phase 2 Additions

#### EPM-74: Story 3.6: Recurring Maintenance Schedules (8 pts) - P1
- [ ] Create maintenance schedule templates
- [ ] Schedule types: HVAC filter changes, fire extinguisher checks, etc.
- [ ] Recurrence patterns (monthly, quarterly, annually)
- [ ] Auto-generate work orders based on schedule
- [ ] Assign to specific vendor
- [ ] Apply to specific units or all units
- [ ] Email notifications when work order created
- [ ] Track completion of scheduled maintenance
- [ ] Skip/postpone individual occurrences

#### EPM-75: Story 3.7: Emergency Work Order Handling (8 pts) - P1
- [ ] Emergency priority flag
- [ ] Push notifications for emergency requests (if mobile app)
- [ ] SMS notification to on-call person
- [ ] 24/7 emergency contact info displayed to tenants
- [ ] Emergency work orders appear at top of queue
- [ ] Auto-escalation if not acknowledged within 30 minutes
- [ ] Track emergency response times
- [ ] After-hours vendor contacts

#### EPM-76: Story 3.8: Maintenance Cost Tracking (5 pts) - P1
- [ ] Record actual cost on work order completion
- [ ] Categorize costs (labor, materials, permit)
- [ ] Track cost per unit over time
- [ ] Track cost per property
- [ ] Compare to budgeted maintenance costs
- [ ] Identify high-cost units
- [ ] Maintenance cost trends (monthly, yearly)
- [ ] Export cost reports

---

### Epic 4: Financial Management - Phase 2 Additions

#### EPM-72: Story 4.6: Financial Reports (13 pts) - P1
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

#### EPM-73: Story 4.7: Budget vs Actual Tracking (8 pts) - P1
- [ ] Set annual budget by category
- [ ] Monthly budget allocation
- [ ] Compare actual to budget monthly
- [ ] Variance reporting ($ and %)
- [ ] Alerts when over budget
- [ ] Budget forecasting for remainder of year
- [ ] Adjust budget mid-year if needed
- [ ] Historical budget performance

---

### Epic 6: Communication Hub - Phase 2 Additions

#### EPM-66: Story 6.4: Automated Notifications (8 pts) - P1
- [ ] Trigger types: rent due, lease expiring, maintenance scheduled, etc.
- [ ] Configurable timing (e.g., 3 days before rent due)
- [ ] Select template for each trigger
- [ ] Enable/disable triggers globally or per property
- [ ] Log of all automated messages
- [ ] Tenant preferences (opt-out of certain notifications)
- [ ] SMS option for critical notifications
- [ ] Delivery confirmation

#### EPM-65: Story 6.5: AI Message Assistant (8 pts) - P1
- [ ] AI analyzes incoming message context
- [ ] Suggests 2-3 response options
- [ ] Appropriate tone (professional, empathetic, firm)
- [ ] References relevant lease terms if applicable
- [ ] Includes action items (create work order, schedule inspection)
- [ ] Edit suggested response before sending
- [ ] Learn from manager's edits over time
- [ ] Works for common scenarios (maintenance, late rent, complaints)

---

### Epic 7: Compliance & Legal (38 points)

#### EPM-51: Story 7.1: Compliance Dashboard (8 pts) - P1
- [ ] Three sections: Federal, State (MN), Local (Brooklyn Center)
- [ ] Status for each requirement (compliant, action needed, overdue)
- [ ] Overall compliance score (0-100)
- [ ] Color-coded urgency
- [ ] Filter by jurisdiction, property, status
- [ ] Quick link to take required action
- [ ] Upcoming deadlines calendar
- [ ] Compliance history log

#### EPM-53: Story 7.2: Security Deposit Interest Compliance (8 pts) - P1
- [ ] Auto-calculate 1% simple interest annually
- [ ] Track interest accrual monthly
- [ ] Alert 30 days before interest payment due
- [ ] Generate interest payment letters
- [ ] Track payment of interest to tenants
- [ ] 21-day disposition letter generation
- [ ] Alert if disposition not sent within deadline
- [ ] Audit trail of all interest payments

#### EPM-52: Story 7.3: Lead Paint Disclosure Compliance (5 pts) - P1
- [ ] Flag properties built before 1978
- [ ] Mandatory disclosure on all leases for flagged properties
- [ ] Generate EPA-compliant disclosure form
- [ ] Track tenant acknowledgment (signature)
- [ ] Attach EPA pamphlet to disclosure
- [ ] Block lease finalization without disclosure
- [ ] Store disclosure records for 3 years (federal requirement)
- [ ] Audit log of all disclosures

#### EPM-55: Story 7.4: Rental License Tracking (5 pts) - P1
- [ ] Record license number, issue date, expiration per property
- [ ] Alert 90, 60, 30 days before expiration
- [ ] Link to online renewal portal
- [ ] Track renewal fee payment
- [ ] Upload renewed license document
- [ ] Multi-jurisdiction support (Brooklyn Center, Minneapolis, etc.)
- [ ] Calendar of all license expirations

#### EPM-54: Story 7.5: Crime-Free Housing Compliance (8 pts) - P1
- [ ] Crime-free addendum included in all leases (Brooklyn Center)
- [ ] Track manager certification status
- [ ] Track required property certifications
- [ ] Schedule annual Crime-Free meetings
- [ ] Log criminal activity reports to police
- [ ] Track lease terminations for criminal activity
- [ ] Generate quarterly compliance reports
- [ ] Alerts for missing certifications

#### EPM-56: Story 7.6: Fair Housing Compliance Checks (8 pts) - P1
- [ ] Screening criteria review (no discriminatory questions)
- [ ] Application form compliance check
- [ ] Lease terms review (no discriminatory clauses)
- [ ] Communication monitoring for discriminatory language (flagging)
- [ ] Reasonable accommodation request tracking
- [ ] Service animal vs pet distinction
- [ ] Training module for staff
- [ ] Audit trail of all application decisions

---

### Epic 8: Document Management - Phase 2 Additions

#### EPM-68: Story 8.3: E-Signature Integration (13 pts) - P1
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

#### EPM-67: Story 8.4: Document Templates (8 pts) - P1
- [ ] Template library (notices, letters, forms)
- [ ] Templates: late rent notice, lease violation, move-out letter, etc.
- [ ] Variable placeholders (tenant name, date, amount, etc.)
- [ ] Rich text editor for template creation
- [ ] Template categories
- [ ] Preview with sample data
- [ ] Generate document from template
- [ ] Share templates across team
- [ ] Import/export templates

#### EPM-69: Story 8.5: Document Expiration Tracking (5 pts) - P1
- [ ] Set expiration date on documents (insurance, licenses, certifications)
- [ ] Alert 90, 60, 30 days before expiration
- [ ] Dashboard of expiring documents
- [ ] Upload renewal document
- [ ] Link renewal to original document (version chain)
- [ ] Expired document flag
- [ ] Auto-archive expired documents
- [ ] Calendar view of expirations

---

### Epic 9: Reporting & Analytics (31 points)

#### EPM-57: Story 9.1: Property Performance Dashboard (8 pts) - P1
- [ ] KPIs: occupancy rate, collection rate, NOI, maintenance cost ratio
- [ ] Compare current vs previous period
- [ ] Trend charts (6 months, 12 months)
- [ ] Property comparison (best/worst performers)
- [ ] Customizable dashboard widgets
- [ ] Export dashboard as PDF
- [ ] Schedule automated email delivery
- [ ] Real-time data updates

#### EPM-58: Story 9.2: Custom Report Builder (13 pts) - P1
- [ ] Select data fields (rent, expenses, occupancy)
- [ ] Set filters (property, date range, tenant type)
- [ ] Choose grouping (by property, by month, by category)
- [ ] Select chart type (bar, line, pie, table)
- [ ] Save custom reports for reuse
- [ ] Schedule recurring report generation
- [ ] Export to PDF, CSV, Excel
- [ ] Share reports with stakeholders

#### EPM-59: Story 9.3: Tenant Analytics (8 pts) - P1
- [ ] Average lease duration
- [ ] Renewal rate by property
- [ ] Early termination rate
- [ ] Payment history analysis (on-time %)
- [ ] Maintenance request frequency per tenant
- [ ] Tenant satisfaction scores (if surveys implemented)
- [ ] Demographics (age range, household size) - anonymized
- [ ] Segment tenants (excellent, good, problematic)

#### EPM-60: Story 9.4: Maintenance Analytics (8 pts) - P1
- [ ] Most common maintenance categories
- [ ] Average cost per category
- [ ] Average completion time by priority
- [ ] Vendor performance comparison
- [ ] Maintenance cost per unit
- [ ] Seasonal patterns (HVAC in summer, heating in winter)
- [ ] Identify problematic units (high maintenance frequency)
- [ ] Preventive vs reactive maintenance ratio

---

### Epic 10: Mobile Experience (26 points)

#### EPM-61: Story 10.1: Mobile Dashboard (8 pts) - P1
- [ ] Mobile-optimized dashboard layout
- [ ] Key metrics displayed (occupancy, revenue, urgent items)
- [ ] Quick actions (create work order, message tenant)
- [ ] Pull-to-refresh
- [ ] Offline mode for viewing cached data
- [ ] Push notifications for urgent items
- [ ] Fast load time (< 3 seconds)

#### EPM-62: Story 10.2: Mobile Photo Upload for Inspections (8 pts) - P1
- [ ] Camera access from app
- [ ] Take multiple photos in sequence
- [ ] Auto-tag with location (GPS)
- [ ] Auto-tag with timestamp
- [ ] Compress images before upload
- [ ] Upload in background
- [ ] Works offline (queue for later upload)

#### EPM-63: Story 10.3: Mobile Work Order Management (8 pts) - P1
- [ ] Create work order with simplified form
- [ ] Voice-to-text for description
- [ ] Take photo and attach
- [ ] Assign to vendor with one tap
- [ ] Update status from list view
- [ ] Filter and search work orders
- [ ] View work order details
- [ ] Call tenant or vendor directly from app
- [ ] Navigation to property (Google Maps integration)

#### EPM-64: Story 10.4: Mobile Messaging (5 pts) - P1
- [ ] Inbox view with unread count
- [ ] Push notifications for new messages
- [ ] Quick reply with templates
- [ ] Voice message recording
- [ ] Attach photos to messages
- [ ] Read/unread status
- [ ] Search messages
- [ ] Offline message draft

---

### Epic 11: User Management - Phase 2 Additions

#### EPM-70: Story 11.3: Team Collaboration (8 pts) - P1
- [ ] Invite team members by email
- [ ] Pending invitation management
- [ ] User list with roles
- [ ] Edit user roles
- [ ] Deactivate users
- [ ] Activity log (who did what)
- [ ] @mention in messages
- [ ] Assign tasks to team members
- [ ] Notification preferences per user

#### EPM-71: Story 11.4: Audit Trail (5 pts) - P1
- [ ] Log all create, update, delete actions
- [ ] Record: user, action, timestamp, entity, old value, new value
- [ ] Filter by user, action type, date range, entity
- [ ] Search audit log
- [ ] Export audit log
- [ ] Retention policy (keep for 7 years)
- [ ] Immutable log
- [ ] Critical actions flagged (lease deletions, payment refunds)

---

## Documentation Status

### Created ✅
- [x] `.cursor/docs/PROJECT_DOCUMENTATION.md` - Main project overview
- [x] `.cursor/docs/TECHNICAL_SPEC.md` - Database schema, API design
- [x] `.cursor/docs/FEATURE_ROADMAP.md` - Phased implementation plan
- [x] `.cursor/docs/DESIGN_SYSTEM.md` - Visual design specification
- [x] `.cursor/docs/COLOR_TOKENS.md` - Color palette documentation
- [x] `.cursor/notes/agentnotes.md` - Development context
- [x] `.cursor/notes/project_checklist.md` - This file
- [x] `.cursor/notes/linear_issues_checklist.md` - Linear issues reference
- [x] `.cursor/reference/EPICS_AND_USER_STORIES.md` - Detailed user stories
- [x] `.cursor/reference/property-management-prototype.md` - UI wireframes

### To Create (Linked to Linear Issues)
- [ ] **EPM-12:** API documentation (auto-generated)
- [ ] **EPM-11:** User guide / help documentation
- [ ] **EPM-13:** Deployment guide
- [ ] Testing strategy document (covered in EPM-9)

---

**Last Updated:** January 2, 2026  
**Next Review:** Weekly during active development  
**Linear Project:** [Property Management (EPM)](https://linear.app/everyday-co/project/property-management-bb1d88383bbb)  
**Team:** [Property Management](https://linear.app/everyday-co/team/Property-Management/all)
