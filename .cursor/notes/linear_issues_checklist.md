# Linear Issues Checklist - Property Management

**Last Updated:** January 2, 2026  
**Project:** Property Management  
**Team:** Property Management (EPM)  
**Total Issues:** 76

> **✅ All issues have been recreated in the EPM team with sequential EPM-001 through EPM-076 numbering.**

## 🔍 Quick Reference

- **Linear Project:** [Property Management (EPM)](https://linear.app/everyday-co/project/property-management-bb1d88383bbb)
- **Team:** Property Management (EPM)
- **Status Legend:**
  - **Backlog** = Not started
  - **In Progress** = Currently being worked on
  - **In Review** = Completed, awaiting review
  - **Done** = Completed and verified
- **Priority Legend:**
  - **Urgent (P0)** = Critical blocker, must be done first
  - **High (P1)** = Important for MVP
  - **Medium (P2)** = Phase 2 or nice-to-have

---

## 📋 Table of Contents

1. [Infrastructure & DevOps](#infrastructure--devops)
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

---

## Infrastructure & DevOps

### Critical/Blocker Issues

| ID | Title | Status | Priority | Labels | Dependencies |
|----|-------|--------|----------|--------|--------------|
| EPM-1 | Infrastructure: Database Schema Implementation | Backlog | Urgent | MVP, Blocker, Database | None (foundational) |
| EPM-2 | Infrastructure: External Services Setup - Cloudflare R2 | Backlog | Urgent | MVP, Blocker | EPM-1 |
| EPM-4 | Infrastructure: External Services Setup - SendGrid Email | Backlog | Urgent | MVP, Blocker | EPM-1 |
| EPM-7 | Technical: API Service Layer Architecture | Backlog | Urgent | MVP, Blocker | EPM-1 |

### High Priority Issues

| ID | Title | Status | Priority | Labels | Dependencies |
|----|-------|--------|----------|--------|--------------|
| EPM-3 | Infrastructure: External Services Setup - Google Places API | Backlog | High | MVP | EPM-1 |
| EPM-6 | Infrastructure: Background Jobs Setup (BullMQ/Redis) | Backlog | High | MVP | EPM-1, EPM-4 |
| EPM-8 | Infrastructure: CI/CD Pipeline Setup | Backlog | High | MVP | None (parallel) |
| EPM-9 | Testing: Testing Framework Setup | Backlog | High | MVP | EPM-7 |

### Medium Priority Issues

| ID | Title | Status | Priority | Labels | Dependencies |
|----|-------|--------|----------|--------|--------------|
| EPM-5 | Infrastructure: Caching Layer Setup (Redis) | Backlog | Medium | MVP | EPM-6 |
| EPM-10 | Infrastructure: Monitoring & Observability Setup | Backlog | Medium | MVP | EPM-8 |
| EPM-12 | Documentation: API Documentation Generation | Backlog | Medium | - | EPM-7 |
| EPM-11 | Documentation: User Guide & Help Documentation | Backlog | Medium | - | MVP Feature Completion |
| EPM-13 | Documentation: Deployment Guide | Backlog | Medium | - | EPM-8 |

---

## Epic 1: Core Property & Unit Management

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-17 | Epic 1.1: Add New Property | Backlog | High | MVP | 5 | None |
| EPM-14 | Epic 1.2: View Property Portfolio Dashboard | Backlog | High | MVP | 3 | EPM-17 |
| EPM-15 | Epic 1.3: Add Units to Property | Backlog | High | MVP | 8 | EPM-17 |
| EPM-16 | Epic 1.4: Edit Property/Unit Details | Backlog | High | MVP | 5 | EPM-17, EPM-15 |
| EPM-19 | Epic 1.5: View Unit Availability Status | Backlog | High | MVP | 5 | EPM-15 |
| EPM-18 | Epic 1.6: Property Detail Page | Backlog | High | MVP | 8 | EPM-17, EPM-15, EPM-19 |

**Epic 1 Total:** 34 story points

---

## Epic 2: Tenant Management & Leasing

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-21 | Epic 2.1: Tenant Profile Creation | Backlog | High | MVP | 8 | EPM-15 |
| EPM-20 | Epic 2.2: Create New Lease Agreement | Backlog | High | MVP | 13 | EPM-21, EPM-43 |
| EPM-22 | Epic 2.3: Lease Expiration Tracking | Backlog | High | MVP | 8 | EPM-20 |
| EPM-23 | Epic 2.4: Lease Renewal Workflow | Backlog | High | MVP | 8 | EPM-20, EPM-22 |
| EPM-24 | Epic 2.5: Tenant List & Search | Backlog | High | MVP | 5 | EPM-21 |
| EPM-25 | Epic 2.6: Tenant Detail Page | Backlog | High | MVP | 8 | EPM-21, EPM-20, EPM-34 |
| EPM-26 | Epic 2.7: Pet Application & Approval | Backlog | High | MVP | 8 | EPM-21, EPM-20 |
| EPM-27 | Epic 2.8: Move-In Inspection | Backlog | High | MVP | 8 | EPM-20 |
| EPM-28 | Epic 2.9: Move-Out Process | Backlog | High | MVP | 13 | EPM-27, EPM-36 |

**Epic 2 Total:** 79 story points (55 for MVP scope)

---

## Epic 3: Maintenance & Work Orders

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-29 | Epic 3.1: Tenant Submit Maintenance Request | Backlog | High | MVP | 5 | EPM-21 |
| EPM-30 | Epic 3.2: Property Manager View Work Orders | Backlog | High | MVP | 5 | EPM-29 |
| EPM-31 | Epic 3.3: Assign Work Order to Vendor | Backlog | High | MVP | 5 | EPM-30 |
| EPM-32 | Epic 3.4: Update Work Order Status | Backlog | High | MVP | 5 | EPM-31 |
| EPM-33 | Epic 3.5: Vendor Management | Backlog | High | MVP | 5 | None |
| EPM-74 | Epic 3.6: Recurring Maintenance Schedules | Backlog | Medium | Phase 2 | 8 | EPM-30, EPM-33 |
| EPM-75 | Epic 3.7: Emergency Work Order Handling | Backlog | Medium | Phase 2 | 8 | EPM-29, EPM-30 |
| EPM-76 | Epic 3.8: Maintenance Cost Tracking | Backlog | Medium | Phase 2 | 5 | EPM-32 |

**Epic 3 Total:** 46 story points (25 MVP + 21 Phase 2)

---

## Epic 4: Financial Management

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-34 | Epic 4.1: Record Rent Payments | Backlog | High | MVP | 8 | EPM-20 |
| EPM-35 | Epic 4.2: Rent Collection Dashboard | Backlog | High | MVP | 8 | EPM-34 |
| EPM-36 | Epic 4.3: Security Deposit Management | Backlog | High | MVP | 13 | EPM-20, EPM-28 |
| EPM-37 | Epic 4.4: Late Fee Automation | Backlog | High | MVP | 5 | EPM-34, EPM-35 |
| EPM-38 | Epic 4.5: Expense Tracking | Backlog | High | MVP | 8 | EPM-17, EPM-32 |
| EPM-72 | Epic 4.6: Financial Reports | Backlog | Medium | Phase 2 | 13 | EPM-34, EPM-35, EPM-38 |
| EPM-73 | Epic 4.7: Budget vs Actual Tracking | Backlog | Medium | Phase 2 | 8 | EPM-38, EPM-72 |

**Epic 4 Total:** 63 story points (42 MVP + 21 Phase 2)

---

## Epic 5: AI-Powered Inspections (Phase 2)

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-48 | Epic 5.1: AI Photo Analysis for Inspections | Backlog | Medium | Phase 2 | 13 | EPM-27 |
| EPM-47 | Epic 5.2: Automated Violation Detection | Backlog | Medium | Phase 2 | 13 | EPM-48 |
| EPM-49 | Epic 5.3: Predictive Maintenance Alerts | Backlog | Medium | Phase 2 | 13 | EPM-48, EPM-74 |
| EPM-50 | Epic 5.4: AI Inspection Report Generation | Backlog | Medium | Phase 2 | 8 | EPM-48 |

**Epic 5 Total:** 47 story points (34 for Phase 2 scope)

---

## Epic 6: Communication Hub

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-39 | Epic 6.1: Send Message to Tenant | Backlog | High | MVP | 5 | EPM-21 |
| EPM-40 | Epic 6.2: Message Templates | Backlog | High | MVP | 5 | EPM-39 |
| EPM-41 | Epic 6.3: Bulk Messaging | Backlog | High | MVP | 5 | EPM-39, EPM-40 |
| EPM-42 | Epic 6.6: Communication Dashboard | Backlog | High | MVP | 5 | EPM-39 |
| EPM-66 | Epic 6.4: Automated Notifications | Backlog | Medium | Phase 2 | 8 | EPM-40 |
| EPM-65 | Epic 6.5: AI Message Assistant | Backlog | Medium | Phase 2 | 8 | EPM-39 |

**Epic 6 Total:** 36 story points (20 MVP + 16 Phase 2)

---

## Epic 7: Compliance & Legal (Phase 2)

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-51 | Epic 7.1: Compliance Dashboard | Backlog | Medium | Phase 2 | 8 | None |
| EPM-53 | Epic 7.2: Security Deposit Interest Compliance | Backlog | Medium | Phase 2 | 8 | EPM-36 |
| EPM-52 | Epic 7.3: Lead Paint Disclosure Compliance | Backlog | Medium | Phase 2 | 5 | EPM-20 |
| EPM-55 | Epic 7.4: Rental License Tracking | Backlog | Medium | Phase 2 | 5 | EPM-17 |
| EPM-54 | Epic 7.5: Crime-Free Housing Compliance | Backlog | Medium | Phase 2 | 8 | EPM-20 |
| EPM-56 | Epic 7.6: Fair Housing Compliance Checks | Backlog | Medium | Phase 2 | 8 | EPM-21 |

**Epic 7 Total:** 42 story points (38 for Phase 2 scope)

---

## Epic 8: Document Management

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-44 | Epic 8.1: Document Upload & Storage | Backlog | High | MVP | 8 | None |
| EPM-43 | Epic 8.2: Lease Document Generation | Backlog | High | MVP | 13 | EPM-20 |
| EPM-68 | Epic 8.3: E-Signature Integration | Backlog | Medium | Phase 2 | 13 | EPM-43 |
| EPM-67 | Epic 8.4: Document Templates | Backlog | Medium | Phase 2 | 8 | EPM-44 |
| EPM-69 | Epic 8.5: Document Expiration Tracking | Backlog | Medium | Phase 2 | 5 | EPM-44 |

**Epic 8 Total:** 47 story points (21 MVP + 26 Phase 2)

---

## Epic 9: Reporting & Analytics (Phase 2)

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-57 | Epic 9.1: Property Performance Dashboard | Backlog | Medium | Phase 2 | 8 | EPM-34, EPM-38 |
| EPM-58 | Epic 9.2: Custom Report Builder | Backlog | Medium | Phase 2 | 13 | EPM-72 |
| EPM-59 | Epic 9.3: Tenant Analytics | Backlog | Medium | Phase 2 | 8 | EPM-21, EPM-34 |
| EPM-60 | Epic 9.4: Maintenance Analytics | Backlog | Medium | Phase 2 | 8 | EPM-76 |

**Epic 9 Total:** 37 story points (31 for Phase 2 scope)

---

## Epic 10: Mobile Experience (Phase 2)

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-61 | Epic 10.1: Mobile Dashboard | Backlog | Medium | Phase 2 | 8 | EPM-14 |
| EPM-62 | Epic 10.2: Mobile Photo Upload for Inspections | Backlog | Medium | Phase 2 | 8 | EPM-29, EPM-48 |
| EPM-63 | Epic 10.3: Mobile Work Order Management | Backlog | Medium | Phase 2 | 8 | EPM-30, EPM-31 |
| EPM-64 | Epic 10.4: Mobile Messaging | Backlog | Medium | Phase 2 | 5 | EPM-39 |

**Epic 10 Total:** 29 story points (26 for Phase 2 scope)

---

## Epic 11: User Management & Security

| ID | Title | Status | Priority | Labels | Story Points | Dependencies |
|----|-------|--------|----------|--------|--------------|--------------|
| EPM-46 | Epic 11.1: User Registration & Authentication | Backlog | High | MVP, Auth | 8 | None |
| EPM-45 | Epic 11.2: Role-Based Access Control | Backlog | High | MVP, Auth | 8 | EPM-46 |
| EPM-70 | Epic 11.3: Team Collaboration | Backlog | Medium | Phase 2 | 8 | EPM-45 |
| EPM-71 | Epic 11.4: Audit Trail | Backlog | Medium | Phase 2 | 5 | EPM-46 |

**Epic 11 Total:** 29 story points (16 MVP + 13 Phase 2)

---

## Summary Statistics

### By Status
- **Backlog:** 76 issues
- **In Progress:** 0 issues
- **Done:** 0 issues

### By Priority
- **Urgent (P0):** 4 infrastructure issues
- **High (P1):** ~40 MVP feature issues
- **Medium (P2):** ~32 Phase 2 feature issues

### By Phase
- **MVP (Phase 1):** ~40 issues
- **Phase 2:** ~32 issues
- **Infrastructure:** 13 issues
- **Documentation:** 3 issues

### Total Story Points
- **MVP Features:** ~256 story points
- **Phase 2 Features:** ~155 story points
- **Infrastructure:** Not estimated (foundational work)

---

## Next Steps

1. **Start with Infrastructure:**
   - EPM-1: Database Schema (blocks everything)
   - EPM-7: API Service Layer (blocks feature development)
   - EPM-2: Cloudflare R2 (needed for file uploads)
   - EPM-4: SendGrid (needed for emails)

2. **Then MVP Features:**
   - Epic 11: Auth & RBAC (EPM-46, EPM-45)
   - Epic 1: Properties & Units (EPM-17, EPM-14, EPM-15, etc.)
   - Epic 2: Tenants & Leases (EPM-21, EPM-20, etc.)
   - Epic 3: Maintenance (EPM-29, EPM-30, etc.)
   - Epic 4: Financials (EPM-34, EPM-35, etc.)
   - Epic 6: Communications (EPM-39, EPM-40, etc.)
   - Epic 8: Documents (EPM-44, EPM-43)

3. **Finally Phase 2:**
   - Epic 5: AI Inspections (EPM-48, EPM-47, etc.)
   - Epic 7: Compliance (EPM-51, EPM-53, etc.)
   - Epic 9: Analytics (EPM-57, EPM-58, etc.)
   - Epic 10: Mobile (EPM-61, EPM-62, etc.)

---

**Note:** This checklist should be updated regularly as issues are completed or statuses change.  
**Linear Project:** [Property Management (EPM)](https://linear.app/everyday-co/project/property-management-bb1d88383bbb)  
**Team:** [Property Management](https://linear.app/everyday-co/team/Property-Management/all)

---

## ⚠️ Project Hygiene Note (Jan 2, 2026)

There are currently **two Linear projects named \"Property Management\"** in the workspace:

- **Everyday Co. team** (issue prefix `EVE-*`)
- **Property Management team** (issue prefix `EPM-*`)

This repo and these checklists are intended to track against the **EPM** project/issue set.
See the Linear document: `https://linear.app/everyday-co/document/repo-audit-vs-linear-checklist-jan-2-2026-50221c979585`
