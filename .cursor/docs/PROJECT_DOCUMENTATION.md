# Everyday Properties Management Platform

## Project Documentation

**Version:** 1.0  
**Last Updated:** December 31, 2024  
**Project Phase:** Development  
**Repository:** https://github.com/adamj-ops/property-manager

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Target Users](#target-users)
4. [Core Features Overview](#core-features-overview)
5. [System Architecture](#system-architecture)
6. [Technology Stack](#technology-stack)
7. [Design System](#design-system)
8. [Security & Compliance](#security--compliance)
9. [Integration Points](#integration-points)
10. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

**Everyday Properties** is a modern, AI-powered property management platform designed for small to mid-sized property managers. The platform streamlines property operations, tenant management, maintenance workflows, and financial tracking while ensuring compliance with federal, state (Minnesota), and local (Brooklyn Center) regulations.

### Key Differentiators

| Feature | Description | Competitive Advantage |
|---------|-------------|----------------------|
| **AI-Powered Inspections** | Automated photo analysis and violation detection | 60% faster inspection documentation |
| **Smart Document Engine** | Dynamic lease generation with compliance validation | Zero compliance violations |
| **Predictive Maintenance** | ML-based forecasting of repairs and costs | 30% reduction in emergency repairs |
| **Proactive Compliance** | Real-time regulatory adherence dashboard | Automated deadline tracking |
| **Mobile-First Design** | Native mobile experience, not just responsive | 70% of actions on mobile |

---

## Product Vision

### Mission Statement

> To empower property managers with intelligent tools that automate routine tasks, predict issues before they become emergencies, and ensure complete regulatory compliance—all through an intuitive, modern interface.

### Core Principles

1. **Proactive, Not Reactive** - Predict problems before they occur
2. **Tenant Success First** - Support-first approach vs punishment-first
3. **Compliance Automated** - Never miss a deadline or requirement
4. **Data-Driven Decisions** - Every decision backed by analytics
5. **Mobile-First** - Full functionality on any device

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average work order completion | < 48 hours | System tracking |
| On-time rent collection | > 95% | Monthly reports |
| Tenant satisfaction | > 4.5/5.0 | Survey responses |
| Compliance violations | Zero | Audit reports |
| Page load time | < 2 seconds | Performance monitoring |
| Mobile action completion | > 70% | Analytics |

---

## Target Users

### Primary Users

#### Property Managers
- **Profile:** Manages 20-500 units across 1-20 properties
- **Goals:** Maximize occupancy, minimize costs, maintain compliance
- **Pain Points:** Manual processes, scattered information, compliance complexity
- **Key Features:** Dashboard, tenant management, financial reports, AI inspections

#### Property Owners
- **Profile:** Owns properties managed by property managers
- **Goals:** ROI visibility, investment performance tracking
- **Pain Points:** Lack of real-time visibility, poor reporting
- **Key Features:** Financial reports, performance dashboards, document access

### Secondary Users

#### Maintenance Staff
- **Profile:** Handles day-to-day repairs and maintenance
- **Goals:** Efficient work order completion, clear communication
- **Key Features:** Mobile work order management, photo documentation

#### Tenants (Future Phase)
- **Profile:** Residents of managed properties
- **Goals:** Easy communication, maintenance requests, payment
- **Key Features:** Tenant portal, maintenance submission, payment portal

### User Personas

```
┌─────────────────────────────────────────────────────────────────────┐
│ PERSONA: Adam - Property Manager                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Age: 35-50 | Properties: 3-5 | Units: 45-150                       │
│                                                                     │
│ Goals:                                                              │
│ • Reduce time on administrative tasks                               │
│ • Never miss a compliance deadline                                  │
│ • Improve tenant retention                                          │
│ • Quick access to property status anywhere                          │
│                                                                     │
│ Frustrations:                                                       │
│ • Switching between multiple systems                                │
│ • Manual lease document creation                                    │
│ • Tracking security deposit interest (MN requirement)               │
│ • Late rent notifications and follow-up                             │
│                                                                     │
│ Tech Comfort: Moderate - prefers intuitive interfaces               │
│ Device Usage: 60% desktop, 40% mobile                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Features Overview

### Phase 1: MVP (16-20 weeks)

#### Epic 1: Core Property & Unit Management (34 story points)
- Add/edit properties with address validation
- Manage units with bulk creation
- Property portfolio dashboard
- Unit availability tracking
- Property detail pages with metrics

#### Epic 2: Tenant Management & Leasing (55 story points)
- Tenant profile creation with encrypted PII
- Lease agreement creation and management
- Lease expiration tracking and renewal workflow
- Pet application and approval
- Move-in/move-out inspections

#### Epic 3: Maintenance & Work Orders (42 story points)
- Tenant maintenance request submission
- Work order dashboard and management
- Vendor assignment and tracking
- Status updates with notifications
- Emergency work order handling

#### Epic 4: Financial Management (47 story points)
- Rent payment recording and tracking
- Rent collection dashboard
- Security deposit management (MN compliant)
- Late fee automation
- Expense tracking

#### Epic 6: Communication Hub (28 story points)
- Tenant messaging with history
- Message templates with variables
- Bulk messaging
- Communication dashboard

#### Epic 8: Document Management (21 story points)
- Document upload and storage
- Lease document generation
- Document templates
- Version control

#### Epic 11: User Management & Security (29 story points)
- User registration and authentication
- Role-based access control (RBAC)
- Team collaboration
- Audit trail

### Phase 2: Advanced Features (10-12 weeks)

#### Epic 5: AI-Powered Inspections (34 story points)
- AI photo analysis for inspections
- Automated violation detection
- Predictive maintenance alerts
- AI inspection report generation

#### Epic 7: Compliance & Legal (38 story points)
- Compliance dashboard (Federal, MN, Brooklyn Center)
- Security deposit interest compliance
- Lead paint disclosure automation
- Rental license tracking
- Fair housing compliance checks

#### Epic 9: Reporting & Analytics (31 story points)
- Property performance dashboard
- Custom report builder
- Tenant analytics
- Maintenance analytics

#### Epic 10: Mobile Experience (26 story points)
- Mobile dashboard
- Mobile photo upload for inspections
- Mobile work order management
- Mobile messaging

### Phase 3: Expansion (Future)

- Tenant portal
- Vendor portal
- API for integrations
- Accounting software sync (QuickBooks, Xero)
- Background checks integration
- Online rent collection (Stripe, ACH)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Web App    │  │  Mobile PWA  │  │   Tenant Portal (v2)     │  │
│  │  (React 19)  │  │   (React)    │  │      (Future)            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              TanStack Start (Full-Stack React)               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │  │
│  │  │ Server Fns  │ │  Routing    │ │     Middleware          │ │  │
│  │  │  (RPC)      │ │ (TanStack)  │ │   (Auth, Validation)    │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │ Auth       │ │ Properties │ │ Tenants    │ │ Maintenance    │   │
│  │ Service    │ │ Service    │ │ Service    │ │ Service        │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │ Financial  │ │ Documents  │ │ Comms      │ │ AI/ML          │   │
│  │ Service    │ │ Service    │ │ Service    │ │ Service        │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────┐    │
│  │   PostgreSQL   │ │     Redis      │ │  Supabase Storage   │    │
│  │   (Primary DB) │ │  (Cache/Jobs)  │ │   (File Storage)    │    │
│  └────────────────┘ └────────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐   │
│  │ SendGrid  │ │  Twilio   │ │  OpenAI   │ │  Google Maps/     │   │
│  │  (Email)  │ │   (SMS)   │ │ (AI/ML)   │ │  Places API       │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TYPICAL REQUEST FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User Action      2. Route Handler      3. Server Function       │
│     (React)             (TanStack Router)      (API Layer)          │
│        │                     │                     │                 │
│        ▼                     ▼                     ▼                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────────┐         │
│  │  Click   │ ──────▶ │  Route   │ ──────▶ │  Server Fn   │         │
│  │  Button  │         │  Match   │         │  Execute     │         │
│  └──────────┘         └──────────┘         └──────────────┘         │
│                                                   │                  │
│                                                   ▼                  │
│  4. TanStack Query     5. Database          6. Response             │
│     Cache                  Query                                     │
│        │                     │                     │                 │
│        ▼                     ▼                     ▼                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────────┐         │
│  │  Cache   │ ◀────── │  Prisma  │ ──────▶ │  JSON        │         │
│  │  Update  │         │  Query   │         │  Response    │         │
│  └──────────┘         └──────────┘         └──────────────┘         │
│        │                                                             │
│        ▼                                                             │
│  7. UI Update                                                        │
│  ┌──────────────┐                                                    │
│  │  React       │                                                    │
│  │  Re-render   │                                                    │
│  └──────────────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 19.0 |
| React Compiler | Automatic memoization | beta |
| TanStack Router | File-based routing | 1.85+ |
| TanStack Query | Server state management | 5.62+ |
| TanStack Form | Form management | 0.39+ |
| TanStack Virtual | List virtualization | 3.10+ |
| Tailwind CSS | Styling | 3.4 |
| shadcn/ui | Component library | latest |
| Zod | Validation | 3.23+ |
| date-fns | Date utilities | 4.1+ |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| TanStack Start | Full-stack framework | 1.85+ |
| Prisma | ORM | 6.0+ |
| PostgreSQL | Primary database | 15+ |
| Redis | Cache & job queue | 7+ |
| Better Auth | Authentication | 1.0+ |
| BullMQ | Background jobs | 5+ |
| Nodemailer | Email sending | 6.9+ |

### External Services

| Service | Purpose |
|---------|---------|
| Supabase Storage | File/image storage |
| SendGrid | Transactional email |
| Twilio | SMS notifications |
| OpenAI | AI/ML features (Vision, GPT-4) |
| Google Places | Address validation |

### DevOps

| Tool | Purpose |
|------|---------|
| Vercel | Hosting (frontend + serverless) |
| Railway/Render | Backend services |
| GitHub Actions | CI/CD |
| Sentry | Error tracking |
| PostHog | Product analytics |

---

## Design System

### Visual Identity

The design system is derived from [Rehab Planner Pro](https://github.com/adamj-ops/rehab-planner-pro) for visual consistency across products.

#### Color Palette

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Background | `#f5f5f4` | `#262624` | Page background |
| Foreground | `#262624` | `#f0f0f0` | Primary text |
| Card | `#ffffff` | `#333333` | Card surfaces |
| Accent | `#90c695` | `#90c695` | CTAs, success states |
| Destructive | `#ff6b6b` | `#ff6b6b` | Errors, delete actions |
| Border | Light gray | Dark gray | Borders, dividers |

#### Typography

- **Font Family:** Inter Variable (sans), JetBrains Mono (code)
- **Base Size:** 14px (data-dense optimization)
- **Line Height:** 1.6

#### Design Principles

1. **Dark Mode First** - Designed for dark mode, light mode as alternative
2. **Data-Dense** - Optimized for dashboards with lots of information
3. **Subtle Refinement** - Understated border radius (0.375rem)
4. **Warm & Professional** - Warm gray palette feels approachable

See `.cursor/docs/DESIGN_SYSTEM.md` for full specification.

---

## Security & Compliance

### Authentication & Authorization

- **Authentication:** Better Auth with email/password, optional 2FA
- **Authorization:** Role-based access control (RBAC)
- **Sessions:** JWT tokens with refresh
- **Password:** Argon2 hashing

### Roles & Permissions

| Role | Properties | Tenants | Financials | Maintenance | Admin |
|------|------------|---------|------------|-------------|-------|
| Admin | Full | Full | Full | Full | Full |
| Property Manager | Assigned | Full | Full | Full | None |
| Maintenance | View | View | None | Full | None |
| Accountant | View | View | Full | View | None |
| Viewer | View | View | View | View | None |

### Data Security

- **Encryption at Rest:** Database-level encryption
- **Encryption in Transit:** TLS 1.3
- **PII Handling:** Field-level encryption for SSN, ID numbers
- **Audit Trail:** Complete log of all data changes
- **Backups:** Daily automated backups

### Regulatory Compliance

#### Federal
- Fair Housing Act
- Americans with Disabilities Act (ADA)
- Lead Paint Disclosure (pre-1978 properties)
- Fair Credit Reporting Act

#### Minnesota State
- Security Deposit Interest (504B.178) - 1% annually
- Late Fee Limits (504B.177) - $50 cap
- 21-day Security Deposit Disposition
- Source of Income Protection

#### Local (Brooklyn Center)
- Rental Licensing Requirements
- Crime-Free Housing Program
- Property Maintenance Standards

---

## Integration Points

### Current Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Google Places API | Address validation & geocoding | MVP |
| SendGrid | Email notifications | MVP |
| Supabase Storage | File storage | MVP |

### Planned Integrations (Phase 2+)

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Twilio | SMS notifications | Phase 2 |
| OpenAI Vision | AI inspection analysis | Phase 2 |
| OpenAI GPT-4 | AI message assistant | Phase 2 |
| DocuSign/HelloSign | E-signatures | Phase 2 |
| Stripe | Payment processing | Phase 3 |
| QuickBooks | Accounting sync | Phase 3 |
| TransUnion/Experian | Background checks | Phase 3 |

---

## Deployment Strategy

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local development | `localhost:3000` |
| Staging | Testing/QA | `staging.everydayproperties.com` |
| Production | Live application | `app.everydayproperties.com` |

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐  │
│  │  Push   │───▶│  Build  │───▶│  Test   │───▶│ Deploy Staging  │  │
│  │  to PR  │    │ & Lint  │    │  Suite  │    │   (Auto)        │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────────────┘  │
│                                                        │            │
│                                                        ▼            │
│                                              ┌─────────────────┐    │
│                                              │  Manual QA      │    │
│                                              │  Approval       │    │
│                                              └─────────────────┘    │
│                                                        │            │
│  ┌─────────────────┐    ┌─────────────────┐           ▼            │
│  │  Merge to Main  │───▶│ Deploy Prod     │◀─────────────────────  │
│  └─────────────────┘    └─────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Monitoring & Observability

- **Error Tracking:** Sentry
- **Analytics:** PostHog
- **Performance:** Vercel Analytics
- **Uptime:** Better Uptime or similar
- **Logging:** Application logs to centralized service

---

## Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Epics & User Stories | `.cursor/reference/EPICS_AND_USER_STORIES.md` | Detailed feature specifications |
| UI Prototype | `.cursor/reference/property-management-prototype.md` | ASCII wireframes and UX specs |
| Design System | `.cursor/docs/DESIGN_SYSTEM.md` | Visual design specification |
| Color Tokens | `.cursor/docs/COLOR_TOKENS.md` | Color palette documentation |
| Technical Spec | `.cursor/docs/TECHNICAL_SPEC.md` | Database schema, API design |
| Feature Roadmap | `.cursor/docs/FEATURE_ROADMAP.md` | Phased implementation plan |
| Agent Notes | `.cursor/notes/agentnotes.md` | Development context |
| Project Checklist | `.cursor/notes/project_checklist.md` | Task tracking |

---

**Document Version:** 1.0  
**Maintained by:** Development Team  
**Last Review:** December 31, 2024  
**Next Review:** Quarterly or as needed

