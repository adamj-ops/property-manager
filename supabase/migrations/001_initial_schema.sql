-- =============================================================================
-- Everyday Properties Management Platform
-- Initial Database Schema for Supabase
-- =============================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jwngafjfbubjkdhhjfkc/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Property Management
CREATE TYPE property_type AS ENUM (
  'SINGLE_FAMILY', 'MULTI_FAMILY', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'COMMERCIAL', 'MIXED_USE'
);

CREATE TYPE property_status AS ENUM (
  'ACTIVE', 'INACTIVE', 'UNDER_RENOVATION', 'FOR_SALE'
);

CREATE TYPE unit_status AS ENUM (
  'VACANT', 'OCCUPIED', 'NOTICE_GIVEN', 'UNDER_RENOVATION', 'OFF_MARKET'
);

-- Tenant Management
CREATE TYPE tenant_status AS ENUM (
  'APPLICANT', 'APPROVED', 'ACTIVE', 'PAST', 'EVICTED', 'DENIED'
);

-- Lease Management
CREATE TYPE lease_status AS ENUM (
  'DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'RENEWED', 'TERMINATED', 'MONTH_TO_MONTH'
);

CREATE TYPE lease_type AS ENUM (
  'FIXED_TERM', 'MONTH_TO_MONTH', 'WEEK_TO_WEEK'
);

-- Pet Management
CREATE TYPE pet_type AS ENUM (
  'DOG', 'CAT', 'BIRD', 'FISH', 'REPTILE', 'SMALL_MAMMAL', 'OTHER'
);

CREATE TYPE pet_status AS ENUM (
  'PENDING', 'APPROVED', 'DENIED', 'REMOVED'
);

-- Maintenance
CREATE TYPE maintenance_status AS ENUM (
  'SUBMITTED', 'ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'
);

CREATE TYPE maintenance_priority AS ENUM (
  'EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'
);

CREATE TYPE maintenance_category AS ENUM (
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL',
  'LANDSCAPING', 'CLEANING', 'PAINTING', 'FLOORING', 'WINDOWS_DOORS', 'ROOF', 'SAFETY', 'OTHER'
);

-- Vendor
CREATE TYPE vendor_status AS ENUM (
  'ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'
);

-- Financial
CREATE TYPE payment_type AS ENUM (
  'RENT', 'SECURITY_DEPOSIT', 'PET_DEPOSIT', 'PET_RENT', 'LATE_FEE',
  'PARKING', 'STORAGE', 'UTILITY', 'MOVE_IN_FEE', 'APPLICATION_FEE', 'OTHER'
);

CREATE TYPE payment_method AS ENUM (
  'CHECK', 'CASH', 'ACH', 'CREDIT_CARD', 'DEBIT_CARD', 'MONEY_ORDER', 'ONLINE_PORTAL', 'OTHER'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL', 'CANCELLED'
);

CREATE TYPE expense_category AS ENUM (
  'MAINTENANCE', 'REPAIRS', 'UTILITIES', 'INSURANCE', 'PROPERTY_TAX', 'MORTGAGE',
  'HOA_FEES', 'MANAGEMENT_FEE', 'LEGAL', 'ADVERTISING', 'SUPPLIES',
  'LANDSCAPING', 'CLEANING', 'PEST_CONTROL', 'CAPITAL_IMPROVEMENT', 'OTHER'
);

CREATE TYPE expense_status AS ENUM (
  'PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'
);

-- Communication
CREATE TYPE message_type AS ENUM (
  'EMAIL', 'SMS', 'IN_APP', 'NOTICE'
);

CREATE TYPE message_status AS ENUM (
  'DRAFT', 'SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'READ'
);

-- Documents
CREATE TYPE document_type AS ENUM (
  'LEASE', 'ADDENDUM', 'APPLICATION', 'ID_DOCUMENT', 'INCOME_VERIFICATION',
  'INSPECTION_REPORT', 'PHOTO', 'INVOICE', 'RECEIPT', 'NOTICE',
  'CORRESPONDENCE', 'INSURANCE', 'LICENSE', 'OTHER'
);

CREATE TYPE document_status AS ENUM (
  'DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED'
);

-- Inspections
CREATE TYPE inspection_type AS ENUM (
  'MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE', 'SAFETY', 'ANNUAL'
);

CREATE TYPE inspection_status AS ENUM (
  'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

-- =============================================================================
-- AUTHENTICATION TABLES (Better Auth Compatible)
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  ban_expires TIMESTAMPTZ
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  impersonated_by TEXT
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROPERTY MANAGEMENT TABLES
-- =============================================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type property_type DEFAULT 'MULTI_FAMILY',
  status property_status DEFAULT 'ACTIVE',

  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'MN',
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Property Details
  year_built INTEGER,
  total_units INTEGER DEFAULT 1,
  total_sq_ft INTEGER,
  lot_size DECIMAL(10, 2),
  parking_spaces INTEGER,
  amenities TEXT[] DEFAULT '{}',

  -- Compliance
  rental_license_number TEXT,
  rental_license_expiry TIMESTAMPTZ,
  lead_paint_disclosure BOOLEAN DEFAULT FALSE,
  built_before_1978 BOOLEAN DEFAULT FALSE,

  -- Financial
  purchase_price DECIMAL(12, 2),
  purchase_date TIMESTAMPTZ,
  current_value DECIMAL(12, 2),
  mortgage_balance DECIMAL(12, 2),

  -- Metadata
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  manager_id UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_properties_manager ON properties(manager_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, state);

-- =============================================================================
-- UNIT MANAGEMENT
-- =============================================================================

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL,
  status unit_status DEFAULT 'VACANT',

  -- Unit Details
  floor_plan TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms DECIMAL(2, 1) DEFAULT 1,
  sq_ft INTEGER,
  floor INTEGER,

  -- Rent Information
  market_rent DECIMAL(10, 2) NOT NULL,
  current_rent DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2),

  -- Features
  features TEXT[] DEFAULT '{}',
  pet_friendly BOOLEAN DEFAULT FALSE,
  pet_deposit DECIMAL(10, 2),
  pet_rent DECIMAL(10, 2),

  -- Appliances & Utilities
  appliances TEXT[] DEFAULT '{}',
  utilities_included TEXT[] DEFAULT '{}',

  -- Metadata
  notes TEXT,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);

-- =============================================================================
-- TENANT MANAGEMENT
-- =============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status tenant_status DEFAULT 'APPLICANT',

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  alt_phone TEXT,
  date_of_birth DATE,

  -- Identification (encrypt in application layer)
  ssn TEXT,
  drivers_license TEXT,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,

  -- Employment
  employer TEXT,
  employer_phone TEXT,
  job_title TEXT,
  monthly_income DECIMAL(10, 2),

  -- Previous Rental
  previous_address TEXT,
  previous_landlord TEXT,
  previous_landlord_phone TEXT,
  reason_for_leaving TEXT,

  -- Vehicle Information
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  license_plate TEXT,

  -- Preferences
  preferred_contact_method TEXT DEFAULT 'email',

  -- Metadata
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_name ON tenants(last_name, first_name);

-- =============================================================================
-- LEASE MANAGEMENT
-- =============================================================================

-- Function to generate lease numbers
CREATE OR REPLACE FUNCTION generate_lease_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'LS-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_number TEXT UNIQUE DEFAULT generate_lease_number(),
  status lease_status DEFAULT 'DRAFT',
  type lease_type DEFAULT 'FIXED_TERM',

  -- Lease Term
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  move_in_date DATE,
  move_out_date DATE,
  signed_date DATE,

  -- Rent Information
  monthly_rent DECIMAL(10, 2) NOT NULL,
  rent_due_day INTEGER DEFAULT 1,
  late_fee_amount DECIMAL(10, 2) DEFAULT 50, -- MN cap is $50
  late_fee_grace_days INTEGER DEFAULT 5,

  -- Security Deposit (MN Compliance: 504B.178)
  security_deposit DECIMAL(10, 2) NOT NULL,
  deposit_paid_date DATE,
  deposit_interest_rate DECIMAL(5, 4) DEFAULT 0.01, -- MN: 1% annually
  deposit_bank_name TEXT,
  deposit_account_last4 TEXT,

  -- Pet Information
  pets_allowed BOOLEAN DEFAULT FALSE,
  pet_deposit DECIMAL(10, 2),
  pet_rent DECIMAL(10, 2),

  -- Utilities & Responsibilities
  utilities_tenant_pays TEXT[] DEFAULT '{}',
  utilities_owner_pays TEXT[] DEFAULT '{}',

  -- Additional Terms
  parking_included BOOLEAN DEFAULT FALSE,
  parking_fee DECIMAL(10, 2),
  storage_included BOOLEAN DEFAULT FALSE,
  storage_fee DECIMAL(10, 2),

  -- Renewal
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_notice_days INTEGER DEFAULT 60,
  renewal_rent_increase DECIMAL(5, 2),

  -- Documents
  lease_document_url TEXT,
  signed_document_url TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id)
);

CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date);

-- Co-tenants on a lease
CREATE TABLE lease_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lease_id, tenant_id)
);

-- Lease addenda
CREATE TABLE lease_addenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  signed_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lease_addenda_lease ON lease_addenda(lease_id);

-- =============================================================================
-- PET MANAGEMENT
-- =============================================================================

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status pet_status DEFAULT 'PENDING',
  type pet_type NOT NULL,

  name TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  weight DECIMAL(5, 2),
  age INTEGER,

  -- Vaccination & Registration
  vaccinated BOOLEAN DEFAULT FALSE,
  vaccination_expiry DATE,
  rabies_tag_number TEXT,
  licensed_with_city BOOLEAN DEFAULT FALSE,

  -- Approval
  approved_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Metadata
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_pets_tenant ON pets(tenant_id);

-- =============================================================================
-- VENDOR MANAGEMENT
-- =============================================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status vendor_status DEFAULT 'ACTIVE',

  -- Business Information
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Services
  categories maintenance_category[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),

  -- Insurance & Licensing
  insurance_provider TEXT,
  insurance_policy_num TEXT,
  insurance_expiry DATE,
  license_number TEXT,
  license_expiry DATE,

  -- Payment
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,

  -- Rating
  rating DECIMAL(2, 1),
  total_jobs INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_status ON vendors(status);

-- =============================================================================
-- MAINTENANCE MANAGEMENT
-- =============================================================================

-- Function to generate work order numbers
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WO-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE DEFAULT generate_work_order_number(),
  status maintenance_status DEFAULT 'SUBMITTED',
  priority maintenance_priority DEFAULT 'MEDIUM',
  category maintenance_category NOT NULL,

  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  permission_to_enter BOOLEAN DEFAULT TRUE,
  preferred_times TEXT,

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TEXT,
  estimated_duration INTEGER, -- minutes
  completed_at TIMESTAMPTZ,

  -- Cost Tracking
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  tenant_charge DECIMAL(10, 2),

  -- Documentation
  photo_urls TEXT[] DEFAULT '{}',
  completion_notes TEXT,
  completion_photos TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_id UUID REFERENCES tenants(id),
  assigned_to_id UUID REFERENCES users(id),
  created_by_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id)
);

CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_assigned ON maintenance_requests(assigned_to_id);
CREATE INDEX idx_maintenance_created ON maintenance_requests(created_at);

-- Maintenance comments
CREATE TABLE maintenance_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL, -- 'staff', 'tenant', 'vendor'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_maintenance_comments_request ON maintenance_comments(request_id);

-- =============================================================================
-- FINANCIAL MANAGEMENT
-- =============================================================================

-- Function to generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PAY-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE DEFAULT generate_payment_number(),
  type payment_type NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'PENDING',

  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  applied_amount DECIMAL(10, 2),

  -- Payment Details
  payment_date DATE NOT NULL,
  due_date DATE,
  received_date DATE,

  -- Reference
  reference_number TEXT,
  memo TEXT,

  -- For partial payments
  for_period_start DATE,
  for_period_end DATE,

  -- Processing
  processed_at TIMESTAMPTZ,
  processing_fee DECIMAL(10, 2),

  -- Metadata
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lease_id UUID REFERENCES leases(id)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- Function to generate expense numbers
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EXP-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT UNIQUE DEFAULT generate_expense_number(),
  category expense_category NOT NULL,
  status expense_status DEFAULT 'PENDING',

  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  tax_deductible BOOLEAN DEFAULT TRUE,

  -- Details
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,

  -- Reference
  invoice_number TEXT,
  reference_number TEXT,

  -- Metadata
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  property_id UUID NOT NULL REFERENCES properties(id),
  vendor_id UUID REFERENCES vendors(id),
  maintenance_request_id UUID REFERENCES maintenance_requests(id)
);

CREATE INDEX idx_expenses_property ON expenses(property_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- =============================================================================
-- COMMUNICATION
-- =============================================================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type message_type DEFAULT 'EMAIL',

  -- Content
  subject TEXT,
  body TEXT NOT NULL,
  html_body TEXT,

  -- Variables: {{tenant.firstName}}, {{property.name}}, etc.
  variables TEXT[] DEFAULT '{}',

  -- Usage
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type message_type DEFAULT 'EMAIL',
  status message_status DEFAULT 'DRAFT',

  -- Content
  subject TEXT,
  body TEXT NOT NULL,
  html_body TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Delivery Info
  delivery_error TEXT,
  external_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  sender_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  template_id UUID REFERENCES message_templates(id)
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_status ON messages(status);

-- =============================================================================
-- DOCUMENT MANAGEMENT
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type document_type NOT NULL,
  status document_status DEFAULT 'ACTIVE',

  -- File Info
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_url TEXT NOT NULL,

  -- Metadata
  title TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id)
);

CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);

-- =============================================================================
-- INSPECTIONS
-- =============================================================================

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type inspection_type NOT NULL,
  status inspection_status DEFAULT 'SCHEDULED',

  -- Scheduling
  scheduled_date DATE NOT NULL,
  completed_date DATE,

  -- Results
  overall_condition TEXT,
  notes TEXT,

  -- AI Analysis (Phase 2)
  ai_analysis_run BOOLEAN DEFAULT FALSE,
  ai_findings JSONB,
  ai_confidence DECIMAL(3, 2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  property_id UUID NOT NULL REFERENCES properties(id),
  lease_id UUID REFERENCES leases(id)
);

CREATE INDEX idx_inspections_property ON inspections(property_id);
CREATE INDEX idx_inspections_type ON inspections(type);
CREATE INDEX idx_inspections_date ON inspections(scheduled_date);

CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location & Item
  room TEXT NOT NULL,
  item TEXT NOT NULL,

  -- Condition Rating
  condition TEXT NOT NULL,

  -- Details
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',

  -- Damage Assessment
  has_damage BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  estimated_repair_cost DECIMAL(10, 2),
  tenant_responsible BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);

-- =============================================================================
-- AUDIT LOG
-- =============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action Details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_addenda_updated_at BEFORE UPDATE ON lease_addenda FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable for Supabase
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be added based on your auth strategy
-- For now, we'll add permissive policies for authenticated users
-- These should be refined based on roles (admin, manager, etc.)

-- Example policy for properties (manager can see their own properties)
CREATE POLICY "Users can view their managed properties"
  ON properties FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Users can manage their properties"
  ON properties FOR ALL
  USING (manager_id = auth.uid());

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role has full access to properties"
  ON properties FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant select/insert/update/delete to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- COMPLETE
-- =============================================================================
-- Schema migration complete!
--
-- Tables created: 22
-- Indexes created: 30+
-- Triggers created: 19
--
-- Next steps:
-- 1. Add more granular RLS policies based on user roles
-- 2. Set up Supabase Storage buckets for documents/images
-- 3. Configure Edge Functions for complex operations
-- =============================================================================
