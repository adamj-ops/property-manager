# Everyday Property Manager - Project Checklist

**Last Updated:** December 31, 2024

---

## 📋 Table of Contents

1. [Phase 1: MVP Development](#phase-1-mvp-development)
2. [Phase 2: Advanced Features](#phase-2-advanced-features)
3. [Phase 3: Expansion](#phase-3-expansion)
4. [Infrastructure & DevOps](#infrastructure--devops)
5. [Documentation Status](#documentation-status)

---

## Phase 1: MVP Development

### Epic 1: Core Property & Unit Management (34 points)

#### Story 1.1: Add New Property (5 pts) - P0
- [ ] Property form with name, address, type, year built, total units
- [ ] Google Places API integration for address validation
- [ ] Automatic geocoding for map display
- [ ] Property photos upload (up to 20 images)
- [ ] Save as draft or publish immediately
- [ ] Duplicate address validation

#### Story 1.2: View Property Portfolio Dashboard (3 pts) - P0
- [ ] Dashboard displays all properties with key metrics
- [ ] Metrics: total units, occupancy %, monthly revenue, # of issues
- [ ] Sortable by name, occupancy, revenue
- [ ] Filterable by property type, location, occupancy status
- [ ] Visual indicators for properties requiring attention
- [ ] Click navigation to property detail
- [ ] Load time < 2 seconds with 50+ properties

#### Story 1.3: Add Units to Property (8 pts) - P0
- [ ] Single unit creation form
- [ ] Bulk add with pattern-based creation (e.g., Units 101-110)
- [ ] Unit form: number, bedrooms, bathrooms, sq ft, floor, type
- [ ] Amenities checklist (dishwasher, A/C, balcony, etc.)
- [ ] Market rent setting per unit
- [ ] Unit-specific photo upload
- [ ] Duplicate unit number validation

#### Story 1.4: Edit Property/Unit Details (5 pts) - P0
- [ ] Edit button on property/unit detail pages
- [ ] Pre-populated form with current values
- [ ] Change tracking (show what changed)
- [ ] Audit log of all changes with timestamp and user
- [ ] Optimistic updates for instant UI feedback

#### Story 1.5: View Unit Availability Status (5 pts) - P0
- [ ] Visual status indicators (color-coded badges)
- [ ] Status types: Occupied, Vacant, Notice Given, Under Renovation, Offline
- [ ] Filterable by status
- [ ] Auto-update when lease starts/ends
- [ ] Manual override for special situations
- [ ] Vacancy duration calculation

#### Story 1.6: Property Detail Page (8 pts) - P0
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

#### Story 2.1: Tenant Profile Creation (8 pts) - P0
- [ ] Form: full name, email, phone, emergency contact
- [ ] Multiple contact methods per tenant
- [ ] Employment information (employer, income)
- [ ] Previous address history
- [ ] Co-tenants/roommates linkage
- [ ] Vehicle information for parking
- [ ] Photo upload for tenant identification
- [ ] SSN/ID encrypted at rest
- [ ] Email verification workflow

#### Story 2.2: Create New Lease Agreement (13 pts) - P0
- [ ] Unit and tenant selection
- [ ] Lease dates (start, end)
- [ ] Monthly rent and security deposit amounts
- [ ] Security deposit interest calculation (MN requirement)
- [ ] Co-tenant addition to same lease
- [ ] Applicable addenda selection (pet, parking, etc.)
- [ ] Lease preview before finalizing
- [ ] PDF generation for signing
- [ ] No overlapping leases validation

#### Story 2.3: Lease Expiration Tracking (8 pts) - P0
- [ ] Dashboard shows leases expiring in next 90 days
- [ ] Color-coded urgency (red < 30 days, yellow < 60 days)
- [ ] Automated email notifications at 90, 60, 30 days
- [ ] Quick action to start renewal process
- [ ] Filter tenant list by expiration date
- [ ] Batch operations for multiple renewals

#### Story 2.4: Lease Renewal Workflow (8 pts) - P0
- [ ] "Renew Lease" button on tenant detail page
- [ ] Pre-populate with current lease terms
- [ ] Rent amount adjustment (show % increase/decrease)
- [ ] Lease duration adjustment
- [ ] Update addenda if needed
- [ ] Generate renewal letter/agreement
- [ ] Track renewal status (offered, accepted, declined)
- [ ] Auto-extend lease if accepted
- [ ] Convert to month-to-month option

#### Story 2.5: Tenant List & Search (5 pts) - P0
- [ ] Paginated list of all tenants
- [ ] Search by name, unit number, email, phone
- [ ] Filter by property, lease status, payment status
- [ ] Sort by name, unit, lease end date, rent amount
- [ ] Quick view of key info (unit, rent, lease dates)
- [ ] Status badges (current, past due, expiring soon)
- [ ] Bulk selection for batch operations
- [ ] Export to CSV

#### Story 2.6: Tenant Detail Page (8 pts) - P0
- [ ] Overview section with contact info and lease summary
- [ ] Payment history and current balance
- [ ] Active lease details and documents
- [ ] Maintenance request history
- [ ] Communication log (all messages/emails)
- [ ] Document repository (lease, addenda, notices)
- [ ] Recent inspections and violations
- [ ] Pet information if applicable
- [ ] Quick actions (message, create work order, process payment)

#### Story 2.7: Pet Application & Approval (8 pts) - P0
- [ ] Pet application form (name, type, breed, weight, age)
- [ ] Photo upload for pet
- [ ] Vaccination records upload
- [ ] License number and authority
- [ ] Approval workflow (pending, approved, denied)
- [ ] Pet rent and/or pet deposit setting
- [ ] Pet addendum generation upon approval
- [ ] Email notification on approval/denial
- [ ] Weight limit enforcement (80 lbs)

#### Story 2.8: Move-In Inspection (8 pts) - P0
- [ ] Digital inspection form with room-by-room checklist
- [ ] Photo upload for each area
- [ ] Condition ratings (excellent, good, fair, poor)
- [ ] Notes field for detailed observations
- [ ] Pre-existing damage documentation
- [ ] Tenant digital signature
- [ ] PDF inspection report generation
- [ ] Report attached to tenant profile

#### Story 2.9: Move-Out Process (13 pts) - P0
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

### Epic 3: Maintenance & Work Orders (42 points)

#### Story 3.1: Tenant Submit Maintenance Request (5 pts) - P0
- [ ] Simple form with issue description
- [ ] Category selection (plumbing, electrical, HVAC, etc.)
- [ ] Priority selection (emergency, urgent, normal, low)
- [ ] Photo upload (up to 5 images)
- [ ] Preferred access times
- [ ] Entry permission (yes/no)
- [ ] Automatic email confirmation to tenant
- [ ] Request appears in manager's queue
- [ ] Mobile-friendly interface

#### Story 3.2: Property Manager View Work Orders (5 pts) - P0
- [ ] List view of all work orders
- [ ] Filter by status (open, in progress, scheduled, completed)
- [ ] Filter by property, priority, category
- [ ] Sort by date created, priority, unit number
- [ ] Color-coded priority indicators
- [ ] Search by unit number, tenant name, description
- [ ] Quick stats (# open, # overdue, avg completion time)
- [ ] Overdue work orders highlighted

#### Story 3.3: Assign Work Order to Vendor (5 pts) - P0
- [ ] Dropdown list of vendors/staff
- [ ] Filter vendors by category specialty
- [ ] Set estimated cost
- [ ] Set scheduled date/time
- [ ] Add notes/instructions for vendor
- [ ] Automated email notification to assigned vendor
- [ ] Vendor contact info easily accessible
- [ ] Track assignment history
- [ ] Reassign capability

#### Story 3.4: Update Work Order Status (5 pts) - P0
- [ ] Status options: Open, Scheduled, In Progress, Completed, Cancelled
- [ ] Status update notes
- [ ] Completion photos upload
- [ ] Record actual cost
- [ ] Record completion date/time
- [ ] Tenant automatically notified when completed
- [ ] Status history tracked with timestamps

#### Story 3.5: Vendor Management (5 pts) - P0
- [ ] Add vendor: company name, contact person, phone, email
- [ ] Vendor categories/specialties
- [ ] Service area (which properties they serve)
- [ ] Rate information
- [ ] Insurance info and expiration tracking
- [ ] Active/inactive status
- [ ] Preferred vendor designation

---

### Epic 4: Financial Management (47 points)

#### Story 4.1: Record Rent Payments (8 pts) - P0
- [ ] Select tenant/lease
- [ ] Enter payment amount, date, method (check, ACH, cash, card)
- [ ] Allocate payment (rent, late fee, pet rent, utilities)
- [ ] Partial payment handling
- [ ] Generate receipt
- [ ] Email receipt to tenant
- [ ] Update tenant balance immediately
- [ ] Record check number if applicable
- [ ] Flag bounced payments

#### Story 4.2: Rent Collection Dashboard (8 pts) - P0
- [ ] Monthly expected revenue vs collected
- [ ] List of tenants who haven't paid (past due)
- [ ] Days past due for each delinquent tenant
- [ ] Late fee calculations (MN $50 cap)
- [ ] Outstanding balance per tenant
- [ ] Payment history per tenant
- [ ] Quick action to send payment reminder
- [ ] Filter by property, payment status
- [ ] Collection rate percentage

#### Story 4.3: Security Deposit Management (13 pts) - P0
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

#### Story 4.4: Late Fee Automation (5 pts) - P0
- [ ] Late fee amount set in lease
- [ ] Grace period set in lease (e.g., 5 days)
- [ ] Auto-calculate late fee after grace period
- [ ] Add late fee to tenant balance
- [ ] Email notification to tenant about late fee
- [ ] Waive late fee option (manager override)
- [ ] Track late fee revenue separately
- [ ] Comply with Minnesota $50 cap
- [ ] Late fee waiver reason tracking

#### Story 4.5: Expense Tracking (8 pts) - P0
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

### Epic 6: Communication Hub (28 points)

#### Story 6.1: Send Message to Tenant (5 pts) - P0
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

#### Story 6.2: Message Templates (5 pts) - P0
- [ ] Pre-defined templates: late rent, maintenance update, lease renewal
- [ ] Template variables (tenant name, unit number, amount due)
- [ ] Auto-populate variables when sending
- [ ] Create custom templates
- [ ] Edit existing templates
- [ ] Category organization
- [ ] Preview before sending
- [ ] Template usage tracking

#### Story 6.3: Bulk Messaging (5 pts) - P0
- [ ] Select multiple tenants (all in property, all in building, custom)
- [ ] Compose message once, send to many
- [ ] Personalization with variables
- [ ] Schedule send time
- [ ] Delivery tracking (sent, delivered, read)
- [ ] Failed delivery alerts
- [ ] Bulk message history

#### Story 6.6: Communication Dashboard (5 pts) - P0
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

### Epic 8: Document Management (21 points)

#### Story 8.1: Document Upload & Storage (8 pts) - P0
- [ ] Upload multiple file types (PDF, JPG, PNG, DOCX, XLSX)
- [ ] Drag-and-drop upload
- [ ] Organize by property, unit, tenant, vendor
- [ ] Create folders and subfolders
- [ ] Tag documents with categories
- [ ] Search by filename, tags, content (OCR)
- [ ] Version control (track document revisions)
- [ ] Access control (who can view each document)
- [ ] Preview without downloading

#### Story 8.2: Lease Document Generation (13 pts) - P0
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

### Epic 11: User Management & Security (29 points)

#### Story 11.1: User Registration & Authentication (8 pts) - P0
- [ ] Email + password registration
- [ ] Email verification required
- [ ] Password strength requirements
- [ ] Login with email + password
- [ ] "Remember me" option
- [ ] Password reset flow
- [ ] Two-factor authentication (optional)
- [ ] Social login (Google, Microsoft) - optional
- [ ] Session management (auto-logout after inactivity)

#### Story 11.2: Role-Based Access Control (8 pts) - P0
- [ ] Roles: Admin, Property Manager, Maintenance, Accountant, Viewer
- [ ] Granular permissions per role
- [ ] Admin: full access
- [ ] Property Manager: manage tenants, leases, work orders
- [ ] Maintenance: view and update work orders only
- [ ] Accountant: view financial data, record payments
- [ ] Viewer: read-only access
- [ ] Assign multiple roles to one user
- [ ] Property-level access control

#### Story 11.4: Audit Trail (5 pts) - P1
- [ ] Log all create, update, delete actions
- [ ] Record: user, action, timestamp, entity, old value, new value
- [ ] Filter by user, action type, date range, entity
- [ ] Search audit log
- [ ] Export audit log
- [ ] Retention policy (keep for 7 years)
- [ ] Immutable log

---

## Phase 2: Advanced Features

### Epic 5: AI-Powered Inspections (34 points)

#### Story 5.1: AI Photo Analysis for Inspections (13 pts) - P1
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

#### Story 5.2: Automated Violation Detection (13 pts) - P1
- [ ] Detect unauthorized pets
- [ ] Detect excessive clutter/hoarding
- [ ] Detect unsanitary conditions
- [ ] Detect unauthorized occupants
- [ ] Detect prohibited items (grills on balconies)
- [ ] Auto-generate violation notice draft
- [ ] Link to specific lease clause violated
- [ ] Recommended fee based on lease
- [ ] Escalation path if repeated violations

#### Story 5.4: AI Inspection Report Generation (8 pts) - P1
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

### Epic 7: Compliance & Legal (38 points)

#### Story 7.1: Compliance Dashboard (8 pts) - P1
- [ ] Three sections: Federal, State (MN), Local (Brooklyn Center)
- [ ] Status for each requirement (compliant, action needed, overdue)
- [ ] Overall compliance score (0-100)
- [ ] Color-coded urgency
- [ ] Filter by jurisdiction, property, status
- [ ] Quick link to take required action
- [ ] Upcoming deadlines calendar

#### Story 7.2: Security Deposit Interest Compliance (8 pts) - P1
- [ ] Auto-calculate 1% simple interest annually
- [ ] Track interest accrual monthly
- [ ] Alert 30 days before interest payment due
- [ ] Generate interest payment letters
- [ ] Track payment of interest to tenants
- [ ] 21-day disposition letter generation
- [ ] Alert if disposition not sent within deadline

#### Story 7.3: Lead Paint Disclosure Compliance (5 pts) - P1
- [ ] Flag properties built before 1978
- [ ] Mandatory disclosure on all leases for flagged properties
- [ ] Generate EPA-compliant disclosure form
- [ ] Track tenant acknowledgment (signature)
- [ ] Attach EPA pamphlet to disclosure
- [ ] Block lease finalization without disclosure

#### Story 7.4: Rental License Tracking (5 pts) - P1
- [ ] Record license number, issue date, expiration per property
- [ ] Alert 90, 60, 30 days before expiration
- [ ] Link to online renewal portal
- [ ] Track renewal fee payment
- [ ] Upload renewed license document
- [ ] Multi-jurisdiction support

---

### Epic 9: Reporting & Analytics (31 points)

#### Story 9.1: Property Performance Dashboard (8 pts) - P1
- [ ] KPIs: occupancy rate, collection rate, NOI, maintenance cost ratio
- [ ] Compare current vs previous period
- [ ] Trend charts (6 months, 12 months)
- [ ] Property comparison (best/worst performers)
- [ ] Customizable dashboard widgets
- [ ] Export dashboard as PDF
- [ ] Schedule automated email delivery

#### Story 9.2: Custom Report Builder (13 pts) - P1
- [ ] Select data fields (rent, expenses, occupancy)
- [ ] Set filters (property, date range, tenant type)
- [ ] Choose grouping (by property, by month, by category)
- [ ] Select chart type (bar, line, pie, table)
- [ ] Save custom reports for reuse
- [ ] Schedule recurring report generation
- [ ] Export to PDF, CSV, Excel

---

### Epic 10: Mobile Experience (26 points)

#### Story 10.1: Mobile Dashboard (8 pts) - P1
- [ ] Mobile-optimized dashboard layout
- [ ] Key metrics displayed (occupancy, revenue, urgent items)
- [ ] Quick actions (create work order, message tenant)
- [ ] Pull-to-refresh
- [ ] Offline mode for viewing cached data
- [ ] Push notifications for urgent items
- [ ] Fast load time (< 3 seconds)

#### Story 10.2: Mobile Photo Upload for Inspections (8 pts) - P1
- [ ] Camera access from app
- [ ] Take multiple photos in sequence
- [ ] Auto-tag with location (GPS)
- [ ] Auto-tag with timestamp
- [ ] Compress images before upload
- [ ] Upload in background
- [ ] Works offline (queue for later upload)

---

## Infrastructure & DevOps

### Database Setup
- [ ] PostgreSQL schema design
- [ ] Core tables created (properties, units, tenants, leases)
- [ ] Financial tables (payments, deposits, expenses)
- [ ] Maintenance tables (work_orders, vendors)
- [ ] Communication tables (messages, templates)
- [ ] Document tables
- [ ] Audit log table
- [ ] Indexes optimized
- [ ] Migrations tracked

### External Services
- [ ] Cloudflare R2 for file storage
- [ ] SendGrid for email
- [ ] Google Places API for address validation
- [ ] Redis for caching/jobs (Phase 2)
- [ ] OpenAI API for AI features (Phase 2)
- [ ] Twilio for SMS (Phase 2)

### CI/CD
- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Database migrations in pipeline

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog)
- [ ] Performance monitoring
- [ ] Uptime monitoring

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
- [x] `.cursor/reference/EPICS_AND_USER_STORIES.md` - Detailed user stories
- [x] `.cursor/reference/property-management-prototype.md` - UI wireframes

### To Create
- [ ] API documentation (auto-generated)
- [ ] User guide / help documentation
- [ ] Deployment guide
- [ ] Testing strategy document

---

**Last Updated:** December 31, 2024  
**Next Review:** Weekly during active development
