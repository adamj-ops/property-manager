# Agent Notes - Everyday Property Manager

**Last Updated:** December 31, 2024

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

### External Services (Planned)
- **Cloudflare R2** - File storage
- **SendGrid** - Transactional email
- **Google Places API** - Address validation
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

## 📝 Session History

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
- Feature Checklist: `.cursor/notes/project_checklist.md`
- Notes: `.cursor/notes/notebook.md`

---

## ⚠️ Development Notes

### Current Database Schema
The current Prisma schema only has auth-related tables (User, Session, Account, Preference, Verification). Property management tables need to be added per the TECHNICAL_SPEC.md.

### Next Steps
1. Database schema implementation (properties, units, tenants, leases)
2. Core API services (property CRUD, tenant CRUD)
3. Dashboard components
4. File upload infrastructure (Cloudflare R2)
5. Email service configuration (SendGrid)

### Future Considerations
- Consider Tailwind v4 migration when stable
- OKLCH colors can be used directly when browser support improves
- Plate.js editor patterns from Rehab Planner Pro may be useful for rich text

---

**Maintained by:** Development Team  
**Last Review:** December 31, 2024
