# Foundations (Architecture, Standards, Shared Flows)

**Updated:** 2026-01-02  
**Applies to:** All `EPM-*` issues  

## 1) System architecture (current)

### 1.1 High-level diagram

```mermaid
flowchart TB
  subgraph Client["Client (React + TanStack Router/Query)"]
    UI["Routes & UI Components"]
  end

  subgraph App["App Runtime (TanStack Start)"]
    MW["Middleware\n(auth/validation)"]
    SF["Server Functions\n(createServerFn)"]
  end

  subgraph Data["Data Layer"]
    PG["Postgres (Supabase)\nPrisma + pg pool"]
    ST["Supabase Storage\n(buckets)"]
  end

  subgraph Ext["External Services"]
    EMAIL["Email Provider\n(SendGrid planned;\nSMTP exists)"]
    PLACES["Google Places API\n(planned)"]
    REDIS["Redis/BullMQ\n(planned)"]
  end

  UI --> MW --> SF
  SF --> PG
  SF --> ST
  SF --> EMAIL
  SF --> PLACES
  SF --> REDIS
```

### 1.2 Key decision: multi-tenancy path (Option A)

For the next implementation phase we use **Option A: user-scoped ownership**.

- **Ownership concept:** “documents belong to a user” (via `uploaded_by_id`) and user can only access their own records.
- **Storage paths:** currently implemented as `{supabaseUserId}/{folder}/{type}/{uuid}-{fileName}` and may be migrated to `user/{id}/...` later.
- **Teams:** not implemented yet. When teams are added, we will introduce team-scoped authorization and storage paths as a migration.

## 2) Data model conventions

### 2.1 Table conventions

- Primary keys: UUID.
- Timestamps: `created_at`, `updated_at` (server-managed).
- Soft delete (where needed): either `status = DELETED` (documents) or explicit `deleted_at`.

### 2.2 Naming conventions

- **DB:** snake_case
- **TypeScript:** camelCase
- **Enums:** SCREAMING_SNAKE_CASE for values, PascalCase for enum names.

### 2.3 Access rules (baseline)

- All reads/writes are scoped by authenticated user id:
  - `managerId` on `properties`
  - `uploaded_by_id` on `documents`
  - Similar scoping will be required on tenants/leases/maintenance/payments as they get wired.

## 3) API/service conventions (TanStack Start)

### 3.1 File layout

Each domain gets:

- `{domain}.schema.ts` — Zod schemas and types
- `{domain}.api.ts` — server functions via `createServerFn`
- `{domain}.query.ts` — client query/mutation hooks & query keys

### 3.2 Error handling standard

**Goal:** consistent error envelope for UI.

Recommended standard:

- Throw typed errors with:
  - `code` (e.g. `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`)
  - `message`
  - optional `details`
- Ensure HTTP status codes are set in middleware/handlers.

### 3.3 Pagination standard

- Inputs: `limit`, `offset`
- Output: `{ data, total, limit, offset }`
- Always return `total` count when feasible (or explain why not).

## 4) Auth & authorization

### 4.1 Current auth

- Better Auth configured in `src/server/auth.ts`.
- TanStack Start middleware reads auth context in `src/middlewares/auth.ts`.

### 4.2 Authorization layers

```mermaid
flowchart TB
  REQ["Request"] --> MW["authedMiddleware\n(isAuthenticated?)"]
  MW --> AUTHZ["Authorization helpers\n(requireRole, requireAccess)"]
  AUTHZ --> DATA["DB query scoped by user/team"]
```

### 4.3 Role model (target)

We will standardize roles:

- Admin
- PropertyManager
- Maintenance
- Accountant
- Viewer

Implementation detail:

- `user.role` stored in DB; middleware uses it for gatekeeping.
- Per-record access checks must also exist (role alone is not enough).

## 5) Supabase Storage (Option A)

### 5.1 Upload lifecycle (recommended)

```mermaid
sequenceDiagram
  participant UI as UI
  participant API as ServerFn
  participant ST as Supabase Storage
  participant DB as Postgres

  UI->>API: createDocumentUpload(file metadata)
  API->>DB: insert documents row (PENDING)
  API->>ST: createSignedUploadUrl(path)
  API-->>UI: uploadUrl + token + documentId

  UI->>ST: PUT file to signedUrl
  UI->>API: confirmDocumentUpload(documentId)
  API->>ST: createSignedUrl(path)
  API->>DB: update documents row (ACTIVE + file_url)
  API-->>UI: updated document
```

### 5.2 Storage policies

We will prefer **server-mediated operations** using the service role key, then add Storage RLS later for client-side direct access if needed.

## 6) Background jobs (future)

BullMQ planned for:

- late fee application
- lease expiration notifications
- document expiration notifications
- recurring maintenance schedule generation

```mermaid
flowchart LR
  APP["App"] --> Q["Queue (BullMQ)"]
  Q --> W["Worker"]
  W --> DB["Postgres"]
  W --> EMAIL["Email/SMS"]
```

## 7) Testing strategy (minimum viable)

- Unit tests: pure functions, validators, path builders
- Integration tests: server fns hitting a test DB
- E2E tests: Playwright covering key workflows

Minimum required per feature:

- happy path
- authorization failure
- validation failure
- idempotency/retry safety

