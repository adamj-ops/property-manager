# Agent Notes - Everyday Property Manager

**Last Updated:** January 2, 2026

---

## 🎯 Project Overview

**Everyday Properties** is a modern, AI-powered property management platform designed for small to mid-sized property managers. Built with TanStack Start and React 19.

### Quick Facts

| Attribute | Value |
|-----------|-------|
| Package Name | `everyday-property-manager` |
| Display Name | Set via `VITE_APP_NAME` environment variable |
| GitHub Repository | https://github.com/adamj-ops/property-manager |
| Framework | TanStack Start (TanStack Router + React Query) |
| Database | PostgreSQL with Prisma ORM |
| Auth | Better Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Target Users | Property managers (20-500 units) |

### Key Differentiators (vs Buildium/AppFolio)

1. **AI-Powered Inspections** - Photo analysis, violation detection, maintenance prediction
2. **Smart Document Engine** - Dynamic lease generation with compliance validation
3. **Predictive Maintenance** - ML-based forecasting of repairs and costs
4. **Proactive Compliance** - Real-time regulatory adherence (MN focus)
5. **Mobile-First Design** - Native mobile experience

---

## 📁 Project Structure

```
/Volumes/blackbox/tanstack-boilerplate/
├── .cursor/
│   ├── docs/                    # Technical documentation
│   │   ├── PROJECT_DOCUMENTATION.md  # Main project overview
│   │   ├── TECHNICAL_SPEC.md         # Database, API design
│   │   ├── FEATURE_ROADMAP.md        # Phased implementation
│   │   ├── DESIGN_SYSTEM.md          # Visual design spec
│   │   └── COLOR_TOKENS.md           # Color palette
│   ├── notes/                   # Development notes
│   │   ├── agentnotes.md             # This file
│   │   ├── project_checklist.md      # Feature tracking
│   │   └── notebook.md               # Miscellaneous notes
│   ├── reference/               # Reference materials
│   │   ├── EPICS_AND_USER_STORIES.md # Detailed user stories
│   │   └── property-management-prototype.md  # UI wireframes
│   ├── rules/                   # Agent guidelines
│   └── tools/                   # Agent tools
├── src/
│   ├── components/              # React components
│   │   ├── layout/              # App header, sidebar
│   │   └── ui/                  # shadcn/ui components
│   ├── routes/                  # TanStack Router file-based routes
│   ├── services/                # API services and React Query
│   ├── server/                  # Server-side code (auth, db, email)
│   ├── libs/                    # Utility libraries
│   ├── hooks/                   # React hooks
│   ├── styles/                  # Global CSS
│   ├── emails/                  # React Email templates
│   └── messages/                # i18n translations
├── prisma/
│   └── schema.prisma            # Database schema
└── plugins/
    └── tailwind/                # Tailwind plugins
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with React Compiler (automatic memoization)
- **TanStack Start** - Full-stack React framework
- **TanStack Router** - File-based routing
- **TanStack Query** - Server state management
- **TanStack Form** - Form management with Zod validation
- **Tailwind CSS 3.4** + **shadcn/ui** components
- **date-fns** - Date utilities

### Backend
- **TanStack Start server functions** - RPC-style API
- **Prisma 6** - ORM with PostgreSQL
- **Better Auth** - Authentication (email/password, 2FA)
- **Nodemailer** + **React Email** - Email delivery

### External Services
- **Supabase Storage** - File storage (documents + media buckets) ✅ Implemented
- **SendGrid** - Transactional email (planned)
- **Google Places API** - Address validation (planned)
- **OpenAI Vision/GPT-4** - AI features (Phase 2)
- **Twilio** - SMS notifications (Phase 2)

---

## 🎨 Design System

The UI is derived from **Rehab Planner Pro** for visual consistency.

### Key Design Decisions

| Aspect | Decision |
|--------|----------|
| Color Space | HSL (converted from OKLCH for Tailwind v3) |
| Primary Palette | Warm gray with soft green (#90c695) accent |
| Destructive | Soft coral (#ff6b6b) |
| Base Font Size | 14px (data-dense optimization) |
| Font Family | Inter Variable |
| Border Radius | 0.375rem (subtle, refined) |
| Theme | Dark mode first |

### Component Patterns
- All components use `data-slot` attributes for styling hooks
- Button variants: default, secondary, outline, ghost, destructive, link, high-contrast
- Card variants: default, accent
- Focus states: 3px ring with ring-ring/50 opacity

### Important Files
- `src/styles/global.css` - CSS variables and base styles
- `plugins/tailwind/shadcn-preset.ts` - Theme configuration
- `tailwind.config.ts` - Tailwind config
- `.cursor/docs/DESIGN_SYSTEM.md` - Full specification

---

## 📋 Development Phases

### Phase 1: MVP (16-20 weeks) - 256 story points
Core features for property management:
- Properties & Units (Epic 1)
- Tenants & Leasing (Epic 2)
- Maintenance & Work Orders (Epic 3)
- Financial Management (Epic 4)
- Communication Hub (Epic 6)
- Document Management (Epic 8)
- User Management & Security (Epic 11)

### Phase 2: Advanced (10-12 weeks) - 155 story points
AI and enhanced features:
- AI-Powered Inspections (Epic 5)
- Compliance & Legal (Epic 7)
- Reporting & Analytics (Epic 9)
- Mobile Experience (Epic 10)
- E-Signatures

### Phase 3: Expansion (8-10 weeks) - 100+ points
External portals and integrations:
- Tenant Portal
- Vendor Portal
- Payment Processing (Stripe)
- Accounting Integration (QuickBooks, Xero)
- Background Checks

---

## ⚖️ Compliance Requirements

### Minnesota State Law
- **Security Deposit Interest**: 1% annually (504B.178)
- **Late Fee Cap**: $50 maximum (504B.177)
- **Disposition**: 21-day deadline for security deposit return
- **Source of Income**: Protected class

### Federal
- **Fair Housing Act**: No discrimination
- **Lead Paint Disclosure**: Required for pre-1978 properties
- **ADA**: Accessibility requirements

### Local (Brooklyn Center)
- **Rental Licensing**: Annual renewal
- **Crime-Free Housing**: Addendum required
- **Property Maintenance**: Standards enforcement

---

## 🗄️ Database Schema Overview

### Core Tables
- `properties` - Property records with address, type, units
- `units` - Individual units with amenities, market rent
- `tenants` - Tenant profiles with encrypted PII
- `leases` - Lease agreements linking tenants to units
- `lease_tenants` - Junction table for co-tenants

### Financial Tables
- `payments` - Rent payments with allocations
- `security_deposits` - Deposits with interest tracking
- `expenses` - Operating expenses by category

### Operations Tables
- `work_orders` - Maintenance requests and assignments
- `vendors` - Vendor directory with specialties
- `inspections` - Unit inspections with photos
- `messages` - Communication log

### System Tables
- `users` - User accounts (Better Auth)
- `teams` - Multi-tenant organization
- `team_members` - User-team membership with roles
- `audit_log` - Change history

See `.cursor/docs/TECHNICAL_SPEC.md` for full schema.

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.development

# Push database schema
pnpm db:push:d

# Start development
pnpm dev
```

### Key Commands
- `pnpm dev` - Start dev server
- `pnpm typecheck` - Type checking
- `pnpm lint` / `pnpm lint:fix` - Linting
- `pnpm db:push:d` - Push schema (development)
- `pnpm db:studio:d` - Open Prisma Studio
- `pnpm email` - Email preview server

---

## 🚨 IMPORTANT: Linear Workflow

**ALWAYS check Linear before starting work on any feature or bug fix.**

1. **Review the issue** in Linear: `https://linear.app/everyday-co/project/property-management-bb1d88383bbb`
2. **Check acceptance criteria** - Linear issues contain detailed ACs
3. **Update issue status** to "In Progress" when starting
4. **Update issue description** with implementation notes as you work
5. **Mark "Done"** when complete with brief summary

### Linear Tools Available
- `user-linear-get_issue` - Get issue details by ID
- `user-linear-list_issues` - List issues with filters
- `user-linear-update_issue` - Update status/description
- `user-linear-list_comments` - View discussion

### Quick Reference
- **Team:** Property Management (EPM)
- **Project ID:** `9c543d53-a83b-4a1e-9348-f5b0c0b257c3`
- **Issue Prefix:** `EPM-*`

---

## 📝 Session History

### January 2, 2026 (Session 4 - Blockers Sprint)

**Completed EPM-7 (API Service Layer) remaining items:**
- Created `src/server/authorization.ts` - RBAC and resource access helpers
  - `requireRole(role)` - Role-based middleware factory
  - `requirePropertyAccess()` - Property ownership check
  - `requireUnitAccess()`, `requireTenantAccess()`, `requireLeaseAccess()` - Resource access
  - `requireResourceAccess(type, idField)` - Generic resource access
- Created `src/server/errors.ts` - Standardized error handling
  - `ApiError` class with factory methods (notFound, badRequest, forbidden, etc.)
  - `ErrorCode` constants for consistent error codes
  - `success()` / `error()` envelope helpers
  - `toApiError()` - Converts any error to ApiError
- Created `src/server/pagination.ts` - Pagination utilities
  - `paginationSchema`, `cursorPaginationSchema`, `sortingSchema` - Zod schemas
  - `paginatedResponse()` - Creates paginated response envelope
  - `toPrismaArgs()`, `toPrismaOrderBy()` - Prisma query helpers
- Created `src/server/audit.ts` - Audit logging
  - `auditLog()` - Core logging function
  - `auditCreate()`, `auditUpdate()`, `auditDelete()` - Convenience wrappers
  - `queryAuditLogs()`, `getEntityAuditHistory()` - Query helpers
  - Sensitive field sanitization
- Created `src/server/index.ts` - Central exports for all server utilities

**Completed EPM-1 (Database Schema) remaining items:**
- Added `Team` and `TeamMember` models to Prisma schema (multi-tenancy)
- Added `WorkOrderStatusHistory` model for maintenance request tracking
- Applied Supabase migration `add_teams_and_status_history`
- Updated Property model with optional `teamId` reference

**Linear Issues Updated:**
- EPM-1: Most criteria now complete (security_deposits deferred, test verification pending)
- EPM-7: Most criteria now complete (team documentation pending)

**Files Created:**
- `src/server/authorization.ts`
- `src/server/errors.ts`
- `src/server/pagination.ts`
- `src/server/audit.ts`
- `src/server/index.ts`

**Database Note:**
- Supabase tables use `pm_` prefix (e.g., `pm_properties`, `pm_maintenance_requests`)
- New tables don't use prefix (e.g., `teams`, `team_members`, `work_order_status_history`)
- Prisma schema mappings may need sync with actual table names

### January 1, 2026 (Session 3 - Storage Implementation)
**Completed:**
- ✅ EPM-2: Supabase Storage implementation (documents + media buckets)
- ✅ EPM-44: Document upload UI with drag-drop, progress, validation
- ✅ Fixed RBAC middleware bug (`Role.Admin` → defined Role const)
- ✅ Created `src/server/storage.ts` with signed URL helpers
- ✅ Created `src/services/documents.*` (schema, api, query)
- ✅ Wired `/app/documents` route to real API data
- ✅ Created test plan: `.cursor/notes/test_plan_storage.md`

**Intentionally Deferred:**
- Team-scoped storage paths (user-scoped for now)
- OCR/document search
- Advanced folder hierarchy
- RLS policies (using service-role-only access due to Better Auth)

**Follow-up Tickets Needed:**
- Audit logging for document access
- Wire property photos to media bucket
- Document versioning
- Bulk download (zip)

### December 31, 2024 (Session 2)
- Created comprehensive project documentation:
  - `PROJECT_DOCUMENTATION.md` - Main project overview
  - `TECHNICAL_SPEC.md` - Database schema, API design
  - `FEATURE_ROADMAP.md` - Phased implementation plan
- Updated `project_checklist.md` with full feature tracking
- Updated `agentnotes.md` with comprehensive context

### December 31, 2024 (Session 1)
- Cloned rehab-planner-pro-reference to analyze design patterns
- Created `.cursor` folder structure
- Created `DESIGN_SYSTEM.md` specification
- Updated `global.css` with new theme
- Updated `shadcn-preset.ts` with property management theme

---

## 🔗 Important Links

### Documentation
- Project Overview: `.cursor/docs/PROJECT_DOCUMENTATION.md`
- Technical Spec: `.cursor/docs/TECHNICAL_SPEC.md`
- Feature Roadmap: `.cursor/docs/FEATURE_ROADMAP.md`
- Design System: `.cursor/docs/DESIGN_SYSTEM.md`
- User Stories: `.cursor/reference/EPICS_AND_USER_STORIES.md`
- UI Wireframes: `.cursor/reference/property-management-prototype.md`

### Tracking
- **Linear Project:** https://linear.app/everyday-co/project/property-management-bb1d88383bbb
- Linear Reference: `.cursor/notes/linear_issues_checklist.md` (snapshot only)
- Test Plans: `.cursor/notes/test_plan_*.md`
- Notes: `.cursor/notes/notebook.md`

### EPM Documentation (New)
- Master Index: `.cursor/docs/epm/00_MASTER_INDEX.md`
- Foundations: `.cursor/docs/epm/01_FOUNDATIONS.md`
- Infrastructure: `.cursor/docs/epm/02_INFRA.md`

---

## ⚠️ Development Notes

### Current State (Jan 2, 2026)
- **Auth**: Better Auth working (email/password, sessions)
- **Storage**: Supabase Storage working (documents + media buckets)
- **Documents**: Full CRUD with upload/download/delete
- **Database**: Prisma schema has all core tables + teams + status history
- **API Layer**: Authorization, error handling, pagination, audit logging utilities ready

### Linear Status (Jan 2, 2026)
- EPM-1: Database Schema - **95% complete** (security_deposits deferred)
- EPM-2: Supabase Storage - **In Review**
- EPM-7: API Service Layer - **95% complete** (docs pending)
- EPM-44: Document Upload - **In Review**
- EPM-46: User Registration & Auth - **In Progress**

### Architecture Decisions
- **Storage Paths**: User-scoped (`{userId}/{folder}/{type}/{filename}`)
- **No RLS on Storage**: Service-role-only access (Better Auth IDs ≠ Supabase auth.uid())
- **Auth Bridge**: `src/server/user-lookup.ts` maps Better Auth email → Supabase user ID
- **Error Handling**: `ApiError` class with factory methods, consistent error envelope
- **Authorization**: Middleware-based RBAC + resource access checks
- **Multi-tenancy**: Teams table ready, properties can be team-scoped

### Future Considerations
- Consider Tailwind v4 migration when stable
- OKLCH colors can be used directly when browser support improves
- Plate.js editor patterns from Rehab Planner Pro may be useful for rich text
- Integrate audit logging into existing services
- Sync Prisma schema table mappings with database (pm_ prefix issue)

---

**Maintained by:** Development Team  
**Last Review:** January 2, 2026
