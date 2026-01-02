# EPM Master Spec Pack (EPM-001 → EPM-076)

**Canonical tracker:** Linear **Property Management** team (`EPM-*` issues)  
**Status:** Living document (generated/updated: 2026-01-02)  

This spec pack is the “incredibly detailed” technical and product specification for the entire EPM backlog.

## How to use

- **Start with** `01_FOUNDATIONS.md` for architecture, conventions, shared patterns, and cross-cutting flows.
- Then jump into the epic docs below. Each issue section includes:
  - **Goal / non-goals**
  - **Dependencies**
  - **Data model** (tables/fields, constraints, migrations)
  - **API endpoints (exact)** (current or proposed `createServerFn` exports)
  - **Zod schemas (exact)** (current or proposed validators)
  - **DB DDL/migrations (exact)** (links/snippets for SQL + additive migrations)
  - **API surface** (server functions, schemas, query keys)
  - **UI surface** (routes/components/state)
  - **Permissions & RLS** (server authorization + DB/storage policies)
  - **Background jobs** (if any)
  - **Telemetry** (logs/metrics/traces)
  - **Test plan** (unit/integration/E2E + edge cases)
  - **Rollout plan** (migrations, backfills, flags)

## Documents

- `01_FOUNDATIONS.md` — Architecture & shared patterns
- `02_INFRA.md` — Infrastructure & DevOps (EPM-1..13)
- `03_EPIC1_PROPERTIES_UNITS.md` — Epic 1 (EPM-14..19)
- `04_EPIC2_TENANTS_LEASES.md` — Epic 2 (EPM-20..28)
- `05_EPIC3_MAINTENANCE.md` — Epic 3 (EPM-29..33, 74..76)
- `06_EPIC4_FINANCIALS.md` — Epic 4 (EPM-34..38, 72..73)
- `07_EPIC6_COMMS.md` — Epic 6 (EPM-39..42, 65..66)
- `08_EPIC8_DOCUMENTS.md` — Epic 8 (EPM-43..44, 67..69)
- `09_EPIC11_AUTH_RBAC_TEAMS_AUDIT.md` — Epic 11 (EPM-45..46, 70..71)
- `10_PHASE2_AI_COMPLIANCE_ANALYTICS_MOBILE.md` — Phase 2 (EPM-47..64, 51..60)

## Repo pointers (current implementation)

- **Schema/DB:** `prisma/schema.prisma`, `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_add_documents_storage_path.sql`
- **Server patterns:** `src/services/*.{api,query,schema}.ts`, `src/middlewares/auth.ts`, `src/server/*`
- **Current storage work:** `src/server/storage.ts`, `src/services/documents.*`, `src/routes/app.documents.tsx`

