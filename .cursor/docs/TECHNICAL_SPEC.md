# Technical Specification

## Everyday Properties Management Platform

**Version:** 1.0  
**Last Updated:** December 31, 2024  
**Status:** Draft  

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Design](#api-design)
3. [Authentication & Authorization](#authentication--authorization)
4. [Background Jobs](#background-jobs)
5. [File Storage](#file-storage)
6. [Caching Strategy](#caching-strategy)
7. [Performance Considerations](#performance-considerations)

---

## Database Schema

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIPS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐   │
│  │   User   │────▶│  Team    │────▶│ Property │────▶│    Unit      │   │
│  └──────────┘     └──────────┘     └──────────┘     └──────────────┘   │
│       │                                  │                 │            │
│       │                                  │                 │            │
│       ▼                                  ▼                 ▼            │
│  ┌──────────┐                      ┌──────────┐     ┌──────────────┐   │
│  │ Session  │                      │  Lease   │◀───▶│   Tenant     │   │
│  └──────────┘                      └──────────┘     └──────────────┘   │
│                                          │                 │            │
│                                          │                 │            │
│                                          ▼                 ▼            │
│                                    ┌──────────┐     ┌──────────────┐   │
│                                    │ Payment  │     │ Work Order   │   │
│                                    └──────────┘     └──────────────┘   │
│                                                            │            │
│                                                            ▼            │
│                                                     ┌──────────────┐   │
│                                                     │   Vendor     │   │
│                                                     └──────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Tables

#### Properties Table

```sql
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Basic Information
  name            VARCHAR(255) NOT NULL,
  property_type   VARCHAR(50) NOT NULL, -- 'multifamily', 'single_family', 'commercial'
  year_built      INTEGER,
  total_units     INTEGER NOT NULL DEFAULT 1,
  
  -- Address
  street_address  VARCHAR(255) NOT NULL,
  unit_address    VARCHAR(50),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(2) NOT NULL,
  zip_code        VARCHAR(10) NOT NULL,
  country         VARCHAR(2) DEFAULT 'US',
  
  -- Geocoding
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  
  -- Status
  status          VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'draft'
  
  -- Compliance
  lead_paint_disclosure_required BOOLEAN DEFAULT false, -- pre-1978
  rental_license_number          VARCHAR(100),
  rental_license_expires         DATE,
  
  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id),
  
  CONSTRAINT unique_address UNIQUE (street_address, city, state, zip_code)
);

CREATE INDEX idx_properties_team ON properties(team_id);
CREATE INDEX idx_properties_status ON properties(status);
```

#### Units Table

```sql
CREATE TABLE units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Basic Information
  unit_number     VARCHAR(50) NOT NULL,
  unit_type       VARCHAR(50), -- 'apartment', 'studio', 'townhouse'
  floor           INTEGER,
  bedrooms        INTEGER NOT NULL DEFAULT 1,
  bathrooms       DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  square_feet     INTEGER,
  
  -- Financial
  market_rent     DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'vacant', 
  -- 'occupied', 'vacant', 'notice_given', 'renovation', 'offline'
  
  -- Amenities (JSON for flexibility)
  amenities       JSONB DEFAULT '[]',
  
  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_unit_per_property UNIQUE (property_id, unit_number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
```

#### Tenants Table

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255),
  email_verified  BOOLEAN DEFAULT false,
  phone           VARCHAR(20),
  phone_secondary VARCHAR(20),
  
  -- Emergency Contact
  emergency_contact_name   VARCHAR(200),
  emergency_contact_phone  VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  
  -- Sensitive Data (encrypted at field level)
  ssn_encrypted   BYTEA,
  id_number_encrypted BYTEA,
  
  -- Employment
  employer        VARCHAR(255),
  employer_phone  VARCHAR(20),
  monthly_income  DECIMAL(10, 2),
  
  -- Vehicle Information
  vehicles        JSONB DEFAULT '[]',
  -- [{make, model, year, color, license_plate, state}]
  
  -- Status
  status          VARCHAR(20) DEFAULT 'active', -- 'active', 'former', 'applicant'
  
  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_tenants_team ON tenants(team_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_name ON tenants(last_name, first_name);
```

#### Leases Table

```sql
CREATE TABLE leases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID NOT NULL REFERENCES units(id),
  
  -- Lease Terms
  lease_type      VARCHAR(20) NOT NULL, -- '12_month', '6_month', 'month_to_month'
  start_date      DATE NOT NULL,
  end_date        DATE,
  
  -- Financial Terms
  monthly_rent    DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL,
  pet_deposit     DECIMAL(10, 2) DEFAULT 0,
  pet_rent        DECIMAL(10, 2) DEFAULT 0,
  late_fee        DECIMAL(10, 2) DEFAULT 50, -- MN cap
  grace_period_days INTEGER DEFAULT 5,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'active',
  -- 'draft', 'pending_signature', 'active', 'expired', 'terminated'
  
  -- Renewal
  auto_renew      BOOLEAN DEFAULT false,
  renewal_offered BOOLEAN DEFAULT false,
  renewal_status  VARCHAR(20), -- 'offered', 'accepted', 'declined'
  
  -- Related Lease (for renewals)
  previous_lease_id UUID REFERENCES leases(id),
  
  -- Metadata
  signed_at       TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
```

#### Lease Tenants (Junction Table)

```sql
CREATE TABLE lease_tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id    UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_lease_tenant UNIQUE (lease_id, tenant_id)
);

CREATE INDEX idx_lease_tenants_lease ON lease_tenants(lease_id);
CREATE INDEX idx_lease_tenants_tenant ON lease_tenants(tenant_id);
```

#### Security Deposits Table

```sql
CREATE TABLE security_deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  
  -- Deposit Details
  amount          DECIMAL(10, 2) NOT NULL,
  received_date   DATE NOT NULL,
  
  -- Interest Tracking (Minnesota 1% annually)
  interest_rate   DECIMAL(5, 4) DEFAULT 0.01,
  interest_accrued DECIMAL(10, 2) DEFAULT 0,
  last_interest_calc_date DATE,
  interest_paid_date DATE,
  
  -- Disposition
  disposition_date DATE,
  disposition_sent_date DATE,
  amount_refunded DECIMAL(10, 2),
  amount_deducted DECIMAL(10, 2),
  deduction_items JSONB DEFAULT '[]',
  -- [{description, amount, category}]
  
  -- Status
  status          VARCHAR(20) DEFAULT 'held',
  -- 'held', 'disposition_pending', 'refunded', 'applied_to_damages'
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_deposits_lease ON security_deposits(lease_id);
CREATE INDEX idx_security_deposits_status ON security_deposits(status);
```

#### Payments Table

```sql
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id        UUID NOT NULL REFERENCES leases(id),
  tenant_id       UUID REFERENCES tenants(id),
  
  -- Payment Details
  amount          DECIMAL(10, 2) NOT NULL,
  payment_date    DATE NOT NULL,
  payment_method  VARCHAR(20) NOT NULL, -- 'check', 'ach', 'cash', 'card', 'other'
  reference_number VARCHAR(100), -- check number, transaction ID, etc.
  
  -- Allocation
  allocations     JSONB NOT NULL,
  -- [{type: 'rent'|'late_fee'|'pet_rent'|'utilities', amount: decimal, for_period: date}]
  
  -- Status
  status          VARCHAR(20) DEFAULT 'completed',
  -- 'pending', 'completed', 'bounced', 'refunded'
  
  -- Notes
  notes           TEXT,
  
  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
```

#### Work Orders Table

```sql
CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID REFERENCES units(id),
  property_id     UUID NOT NULL REFERENCES properties(id),
  tenant_id       UUID REFERENCES tenants(id),
  
  -- Work Order Details
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  category        VARCHAR(50) NOT NULL,
  -- 'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other'
  
  -- Priority
  priority        VARCHAR(20) DEFAULT 'normal',
  -- 'emergency', 'urgent', 'normal', 'low'
  
  -- Access
  entry_permitted BOOLEAN DEFAULT true,
  preferred_times JSONB, -- ['morning', 'afternoon', 'evening']
  
  -- Assignment
  assigned_to     UUID REFERENCES vendors(id),
  assigned_at     TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  scheduled_date  DATE,
  scheduled_time  VARCHAR(20),
  
  -- Completion
  completed_at    TIMESTAMP WITH TIME ZONE,
  actual_cost     DECIMAL(10, 2),
  completion_notes TEXT,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'open',
  -- 'open', 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_work_orders_property ON work_orders(property_id);
CREATE INDEX idx_work_orders_unit ON work_orders(unit_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to);
```

#### Work Order Status History

```sql
CREATE TABLE work_order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  
  status          VARCHAR(20) NOT NULL,
  notes           TEXT,
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_wo_status_history_work_order ON work_order_status_history(work_order_id);
```

#### Vendors Table

```sql
CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Business Information
  company_name    VARCHAR(255) NOT NULL,
  contact_name    VARCHAR(200),
  email           VARCHAR(255),
  phone           VARCHAR(20) NOT NULL,
  phone_emergency VARCHAR(20),
  
  -- Address
  street_address  VARCHAR(255),
  city            VARCHAR(100),
  state           VARCHAR(2),
  zip_code        VARCHAR(10),
  
  -- Service Categories
  categories      VARCHAR(50)[] NOT NULL,
  -- ARRAY['plumbing', 'electrical', 'hvac', etc.]
  
  -- Service Area (properties they serve)
  service_properties UUID[] DEFAULT '{}',
  
  -- Rates
  hourly_rate     DECIMAL(10, 2),
  minimum_charge  DECIMAL(10, 2),
  
  -- Insurance
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_expires DATE,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'active',
  is_preferred    BOOLEAN DEFAULT false,
  
  -- Performance Metrics (calculated)
  avg_completion_time INTERVAL,
  avg_rating      DECIMAL(3, 2),
  total_jobs      INTEGER DEFAULT 0,
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_team ON vendors(team_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_categories ON vendors USING GIN(categories);
```

#### Inspections Table

```sql
CREATE TABLE inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID NOT NULL REFERENCES units(id),
  lease_id        UUID REFERENCES leases(id),
  
  -- Inspection Type
  inspection_type VARCHAR(30) NOT NULL,
  -- 'move_in', 'move_out', 'quarterly', 'annual', 'complaint'
  
  -- Scheduling
  scheduled_date  DATE NOT NULL,
  completed_date  DATE,
  
  -- Results
  overall_condition VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
  passed          BOOLEAN,
  
  -- Room-by-Room (JSON for flexibility)
  room_conditions JSONB DEFAULT '{}',
  -- {kitchen: {condition: 'good', notes: '', issues: []}, ...}
  
  -- AI Analysis Results
  ai_analysis     JSONB,
  -- {issues: [{type, location, confidence, description, suggested_action}], ...}
  
  -- Signatures
  inspector_signature_url VARCHAR(500),
  tenant_signature_url    VARCHAR(500),
  signed_at       TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'scheduled',
  -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_inspections_unit ON inspections(unit_id);
CREATE INDEX idx_inspections_lease ON inspections(lease_id);
CREATE INDEX idx_inspections_type ON inspections(inspection_type);
CREATE INDEX idx_inspections_date ON inspections(scheduled_date);
```

#### Messages Table

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Participants
  sender_user_id  UUID REFERENCES users(id),
  recipient_tenant_id UUID REFERENCES tenants(id),
  recipient_vendor_id UUID REFERENCES vendors(id),
  
  -- Thread
  thread_id       UUID REFERENCES messages(id),
  
  -- Content
  subject         VARCHAR(255),
  body            TEXT NOT NULL,
  body_html       TEXT,
  
  -- Attachments
  attachments     JSONB DEFAULT '[]',
  -- [{filename, url, size, mime_type}]
  
  -- Delivery
  sent_via        VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'in_app'
  external_id     VARCHAR(255), -- SendGrid message ID, etc.
  delivered_at    TIMESTAMP WITH TIME ZONE,
  read_at         TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'sent',
  -- 'draft', 'scheduled', 'sent', 'delivered', 'failed'
  
  scheduled_for   TIMESTAMP WITH TIME ZONE,
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_team ON messages(team_id);
CREATE INDEX idx_messages_recipient_tenant ON messages(recipient_tenant_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_status ON messages(status);
```

#### Documents Table

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Related Entity (polymorphic)
  property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE CASCADE,
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lease_id        UUID REFERENCES leases(id) ON DELETE CASCADE,
  
  -- File Information
  filename        VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_url        VARCHAR(500) NOT NULL,
  file_size       INTEGER, -- bytes
  mime_type       VARCHAR(100),
  
  -- Categorization
  category        VARCHAR(50) NOT NULL,
  -- 'lease', 'addendum', 'inspection', 'receipt', 'license', 'insurance', 'other'
  
  tags            VARCHAR(50)[] DEFAULT '{}',
  
  -- Versioning
  version         INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES documents(id),
  
  -- Expiration Tracking
  expires_at      DATE,
  
  -- Metadata
  description     TEXT,
  extracted_text  TEXT, -- OCR text for search
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_documents_team ON documents(team_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_lease ON documents(lease_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_expires ON documents(expires_at);
CREATE INDEX idx_documents_search ON documents USING GIN(to_tsvector('english', extracted_text));
```

#### Pets Table

```sql
CREATE TABLE pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  
  -- Pet Information
  name            VARCHAR(100) NOT NULL,
  pet_type        VARCHAR(50) NOT NULL, -- 'dog', 'cat', 'bird', 'fish', 'other'
  breed           VARCHAR(100),
  weight_lbs      INTEGER,
  age_years       INTEGER,
  color           VARCHAR(100),
  
  -- Registration
  license_number  VARCHAR(100),
  license_authority VARCHAR(100),
  
  -- Vaccination
  rabies_vaccination_date DATE,
  rabies_expiration_date DATE,
  other_vaccinations JSONB DEFAULT '[]',
  
  -- Photos
  photo_url       VARCHAR(500),
  
  -- Approval
  status          VARCHAR(20) DEFAULT 'pending',
  -- 'pending', 'approved', 'denied', 'removed'
  approved_at     TIMESTAMP WITH TIME ZONE,
  approved_by     UUID REFERENCES users(id),
  denial_reason   TEXT,
  
  -- Financial
  pet_deposit     DECIMAL(10, 2) DEFAULT 0,
  pet_rent        DECIMAL(10, 2) DEFAULT 0,
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_lease ON pets(lease_id);
CREATE INDEX idx_pets_tenant ON pets(tenant_id);
CREATE INDEX idx_pets_status ON pets(status);
```

#### Audit Log Table

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id),
  user_id         UUID REFERENCES users(id),
  
  -- Action Details
  action          VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view'
  entity_type     VARCHAR(50) NOT NULL, -- 'property', 'tenant', 'lease', etc.
  entity_id       UUID NOT NULL,
  
  -- Changes
  old_values      JSONB,
  new_values      JSONB,
  
  -- Context
  ip_address      INET,
  user_agent      TEXT,
  
  -- Flags
  is_sensitive    BOOLEAN DEFAULT false, -- PII access, financial changes
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_team ON audit_log(team_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);
```

#### Expenses Table

```sql
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Related Entities
  property_id     UUID REFERENCES properties(id),
  unit_id         UUID REFERENCES units(id),
  work_order_id   UUID REFERENCES work_orders(id),
  vendor_id       UUID REFERENCES vendors(id),
  
  -- Expense Details
  date            DATE NOT NULL,
  amount          DECIMAL(10, 2) NOT NULL,
  category        VARCHAR(50) NOT NULL,
  -- 'maintenance', 'utilities', 'insurance', 'taxes', 'management', 'legal', 'other'
  subcategory     VARCHAR(50),
  description     TEXT NOT NULL,
  
  -- Classification
  is_capital_improvement BOOLEAN DEFAULT false,
  
  -- Receipt
  receipt_url     VARCHAR(500),
  
  -- Recurring
  is_recurring    BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(20), -- 'monthly', 'quarterly', 'annually'
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_expenses_team ON expenses(team_id);
CREATE INDEX idx_expenses_property ON expenses(property_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

#### Teams Table

```sql
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  
  -- Billing
  plan            VARCHAR(20) DEFAULT 'starter',
  subscription_status VARCHAR(20) DEFAULT 'active',
  
  -- Settings
  settings        JSONB DEFAULT '{}',
  
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role            VARCHAR(50) NOT NULL DEFAULT 'member',
  -- 'owner', 'admin', 'property_manager', 'maintenance', 'accountant', 'viewer'
  
  permissions     JSONB DEFAULT '{}',
  
  -- Property Access (null = all properties)
  property_access UUID[] DEFAULT NULL,
  
  invited_at      TIMESTAMP WITH TIME ZONE,
  joined_at       TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

---

## API Design

### API Structure

The application uses TanStack Start server functions for the API layer, providing type-safe RPC-style calls.

### Service Organization

```
src/services/
├── auth.api.ts           # Authentication endpoints
├── auth.query.ts         # Auth queries/mutations
├── auth.schema.ts        # Auth validation schemas
├── properties.api.ts     # Property management
├── properties.query.ts
├── properties.schema.ts
├── units.api.ts          # Unit management
├── tenants.api.ts        # Tenant management
├── leases.api.ts         # Lease management
├── payments.api.ts       # Payment recording
├── work-orders.api.ts    # Maintenance
├── vendors.api.ts        # Vendor management
├── documents.api.ts      # Document storage
├── messages.api.ts       # Communication
├── inspections.api.ts    # Inspections
└── reports.api.ts        # Reporting
```

### Example API Endpoints

#### Properties API

```typescript
// src/services/properties.api.ts

export const listProperties = createServerFn('GET', async () => {
  const session = await requireAuth();
  const properties = await db.property.findMany({
    where: { teamId: session.teamId },
    include: { units: true },
    orderBy: { name: 'asc' }
  });
  return properties;
});

export const getProperty = createServerFn('GET', async (propertyId: string) => {
  const session = await requireAuth();
  const property = await db.property.findFirst({
    where: { 
      id: propertyId, 
      teamId: session.teamId 
    },
    include: {
      units: true,
      _count: { select: { units: true } }
    }
  });
  if (!property) throw new Error('Property not found');
  return property;
});

export const createProperty = createServerFn('POST', async (data: CreatePropertyInput) => {
  const session = await requireAuth();
  const validated = createPropertySchema.parse(data);
  
  // Geocode address
  const geocoded = await geocodeAddress(validated.streetAddress, validated.city, validated.state);
  
  const property = await db.property.create({
    data: {
      ...validated,
      teamId: session.teamId,
      latitude: geocoded?.lat,
      longitude: geocoded?.lng,
      leadPaintDisclosureRequired: validated.yearBuilt < 1978,
      createdBy: session.userId
    }
  });
  
  await createAuditLog({
    action: 'create',
    entityType: 'property',
    entityId: property.id,
    newValues: property,
    userId: session.userId,
    teamId: session.teamId
  });
  
  return property;
});

export const updateProperty = createServerFn('PATCH', async (data: UpdatePropertyInput) => {
  const session = await requireAuth();
  const { id, ...updateData } = updatePropertySchema.parse(data);
  
  const existing = await db.property.findFirst({
    where: { id, teamId: session.teamId }
  });
  if (!existing) throw new Error('Property not found');
  
  const property = await db.property.update({
    where: { id },
    data: updateData
  });
  
  await createAuditLog({
    action: 'update',
    entityType: 'property',
    entityId: property.id,
    oldValues: existing,
    newValues: property,
    userId: session.userId,
    teamId: session.teamId
  });
  
  return property;
});
```

#### Validation Schemas

```typescript
// src/services/properties.schema.ts

import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1).max(255),
  propertyType: z.enum(['multifamily', 'single_family', 'commercial']),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  totalUnits: z.number().int().min(1).default(1),
  streetAddress: z.string().min(1).max(255),
  unitAddress: z.string().max(50).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  rentalLicenseNumber: z.string().max(100).optional(),
  rentalLicenseExpires: z.date().optional(),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().uuid(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
```

#### React Query Integration

```typescript
// src/services/properties.query.ts

import { queryOptions, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import * as api from './properties.api';

export const propertyKeys = {
  all: ['properties'] as const,
  list: () => [...propertyKeys.all, 'list'] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
  metrics: (id: string) => [...propertyKeys.all, 'metrics', id] as const,
};

export const propertiesQueryOptions = () =>
  queryOptions({
    queryKey: propertyKeys.list(),
    queryFn: () => api.listProperties(),
  });

export const propertyQueryOptions = (id: string) =>
  queryOptions({
    queryKey: propertyKeys.detail(id),
    queryFn: () => api.getProperty(id),
    enabled: !!id,
  });

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateProperty,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.list() });
    },
  });
};
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Registration                                                     │
│     ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐   │
│     │  User    │───▶│ Validate │───▶│ Create User + Account   │   │
│     │  Submit  │    │  Input   │    │ Send Verification Email │   │
│     └──────────┘    └──────────┘    └──────────────────────────┘   │
│                                                                      │
│  2. Email Verification                                               │
│     ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐   │
│     │  Click   │───▶│ Validate │───▶│ Mark emailVerified=true │   │
│     │  Link    │    │  Token   │    │ Redirect to Dashboard   │   │
│     └──────────┘    └──────────┘    └──────────────────────────┘   │
│                                                                      │
│  3. Login                                                            │
│     ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐   │
│     │  User    │───▶│ Validate │───▶│ Create Session + Token  │   │
│     │  Login   │    │ Password │    │ Set HTTP-only Cookie    │   │
│     └──────────┘    └──────────┘    └──────────────────────────┘   │
│                                                                      │
│  4. Session Validation                                               │
│     ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐   │
│     │  Request │───▶│ Extract  │───▶│ Validate + Refresh      │   │
│     │  w/Token │    │  Token   │    │ Return User Context     │   │
│     └──────────┘    └──────────┘    └──────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Authorization Middleware

```typescript
// src/middlewares/auth.ts

import { getSession } from '@/server/auth';

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const membership = await db.teamMember.findFirst({
    where: { userId: session.user.id }
  });
  
  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return { ...session, role: membership.role, teamId: membership.teamId };
}

export async function requirePropertyAccess(propertyId: string) {
  const session = await requireAuth();
  const membership = await db.teamMember.findFirst({
    where: { userId: session.user.id }
  });
  
  if (!membership) throw new Error('Forbidden');
  
  // Null means all properties
  if (membership.propertyAccess === null) return session;
  
  // Check specific property access
  if (!membership.propertyAccess.includes(propertyId)) {
    throw new Error('Forbidden: No access to this property');
  }
  
  return session;
}
```

---

## Background Jobs

### Job Queue (BullMQ)

```typescript
// src/server/jobs/index.ts

import { Queue, Worker } from 'bullmq';
import { redis } from '../redis';

// Define queues
export const emailQueue = new Queue('email', { connection: redis });
export const notificationQueue = new Queue('notifications', { connection: redis });
export const complianceQueue = new Queue('compliance', { connection: redis });
export const reportsQueue = new Queue('reports', { connection: redis });

// Job types
interface SendEmailJob {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

interface LeaseExpirationCheckJob {
  teamId: string;
}

interface SecurityDepositInterestJob {
  leaseId: string;
}
```

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `lease-expiration-check` | Daily 8am | Check for expiring leases, send notifications |
| `rent-due-reminder` | 1st of month | Send rent due reminders |
| `late-fee-calculation` | Daily 1am | Calculate and apply late fees after grace period |
| `security-deposit-interest` | Monthly | Calculate interest on security deposits |
| `license-expiration-check` | Daily | Check for expiring licenses/documents |
| `daily-digest` | Daily 6am | Send daily digest emails |

---

## File Storage

### Supabase Storage Integration

```typescript
// src/server/storage.ts

// NOTE: We use Supabase Storage (not Cloudflare R2).
// This section is intentionally high-level; implementation details live in `src/server/storage.ts`.
//
// Suggested patterns:
// - Use Supabase Storage buckets: `documents`, `media`
// - Use signed URLs for download (and optionally upload)
// - Persist metadata in DB `documents` table
//
// Pseudocode sketch:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// export async function createSignedUploadUrl(...) { ... }
// export async function createSignedDownloadUrl(...) { ... }
// export async function deleteObject(...) { ... }

export {};
```

### File Organization

```
bucket/
└── team/{teamId}/
    ├── property/{propertyId}/
    │   ├── media/
    │   └── documents/
    ├── tenant/{tenantId}/
    │   ├── media/
    │   └── documents/
    ├── inspection/{inspectionId}/
    │   └── media/
    ├── lease/{leaseId}/
    │   └── documents/
    └── work-order/{workOrderId}/
        └── media/
```

---

## Caching Strategy

### Redis Cache Layers

| Layer | TTL | Purpose |
|-------|-----|---------|
| Session | 7 days | User session data |
| Portfolio Metrics | 5 min | Dashboard KPIs |
| Property List | 2 min | Property listing with counts |
| Search Results | 1 min | Search result caching |
| Computed Fields | 1 hour | Occupancy rates, balances |

### Cache Invalidation

```typescript
// src/server/cache.ts

import { redis } from './redis';

export const cacheKeys = {
  portfolioMetrics: (teamId: string) => `team:${teamId}:portfolio-metrics`,
  propertyMetrics: (propertyId: string) => `property:${propertyId}:metrics`,
  unitStatus: (unitId: string) => `unit:${unitId}:status`,
  tenantBalance: (tenantId: string) => `tenant:${tenantId}:balance`,
};

export async function invalidatePropertyCache(teamId: string, propertyId?: string) {
  const keys = [cacheKeys.portfolioMetrics(teamId)];
  if (propertyId) {
    keys.push(cacheKeys.propertyMetrics(propertyId));
  }
  await redis.del(keys);
}

export async function invalidateTenantCache(tenantId: string) {
  await redis.del(cacheKeys.tenantBalance(tenantId));
}
```

---

## Performance Considerations

### Database Optimization

1. **Indexes** - All foreign keys and commonly queried fields indexed
2. **Pagination** - Cursor-based pagination for large lists
3. **Partial Indexes** - Indexes on active records only where applicable
4. **Connection Pooling** - PgBouncer for production

### Frontend Optimization

1. **Code Splitting** - Route-based lazy loading
2. **Virtual Lists** - TanStack Virtual for long lists
3. **Optimistic Updates** - Immediate UI feedback
4. **Stale-While-Revalidate** - TanStack Query caching

### API Optimization

1. **Selective Fields** - Only fetch required fields
2. **Batched Queries** - DataLoader pattern where applicable
3. **Response Compression** - Gzip/Brotli
4. **Edge Caching** - Cloudflare CDN for static assets

---

**Document Version:** 1.0  
**Last Review:** December 31, 2024

