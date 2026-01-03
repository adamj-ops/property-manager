-- =============================================================================
-- EPM-83: Lease Template Import & Management
-- Migration: 003_add_lease_templates.sql
-- Description: Creates lease_templates table for managing lease document templates
-- =============================================================================

-- Create lease template type enum
CREATE TYPE lease_template_type AS ENUM (
  'MAIN_LEASE',
  'ADDENDUM_PET',
  'ADDENDUM_PARKING',
  'ADDENDUM_CRIME_FREE',
  'ADDENDUM_LEAD_PAINT',
  'ADDENDUM_SECURITY_DEPOSIT',
  'ADDENDUM_UTILITIES',
  'ADDENDUM_SMOKING',
  'ADDENDUM_GUEST',
  'ADDENDUM_CUSTOM'
);

-- Create lease_templates table
CREATE TABLE lease_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type lease_template_type NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Template Content
  template_file_url TEXT, -- Supabase Storage URL for DOCX
  template_file_path TEXT, -- Storage path reference
  template_content TEXT, -- Extracted/parsed content for preview
  
  -- Variable System
  variables TEXT[] DEFAULT '{}', -- Extracted variables like ['tenant_name', 'rent_amount']
  variable_schema JSONB, -- Detailed variable metadata (type, format, description)
  
  -- Template Metadata
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Versioning
  parent_template_id UUID REFERENCES lease_templates(id) ON DELETE SET NULL,
  change_notes TEXT, -- Notes about this version
  
  -- Compliance
  minnesota_compliant BOOLEAN DEFAULT TRUE,
  compliance_notes TEXT,
  
  -- Metadata
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on name + version
  UNIQUE(name, version)
);

-- Indexes for performance
CREATE INDEX idx_lease_templates_type ON lease_templates(type);
CREATE INDEX idx_lease_templates_active ON lease_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lease_templates_default ON lease_templates(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_lease_templates_parent ON lease_templates(parent_template_id);
CREATE INDEX idx_lease_templates_created_by ON lease_templates(created_by_id);
CREATE INDEX idx_lease_templates_archived ON lease_templates(is_archived) WHERE is_archived = FALSE;

-- Add updated_at trigger
CREATE TRIGGER update_lease_templates_updated_at 
  BEFORE UPDATE ON lease_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE lease_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all active templates
CREATE POLICY "Users can view active templates" 
  ON lease_templates 
  FOR SELECT 
  USING (is_active = TRUE OR created_by_id = auth.uid());

-- Users can insert their own templates
CREATE POLICY "Users can create templates" 
  ON lease_templates 
  FOR INSERT 
  WITH CHECK (created_by_id = auth.uid());

-- Users can update their own templates
CREATE POLICY "Users can update own templates" 
  ON lease_templates 
  FOR UPDATE 
  USING (created_by_id = auth.uid());

-- Users can delete their own templates (soft delete via is_active)
CREATE POLICY "Users can delete own templates" 
  ON lease_templates 
  FOR DELETE 
  USING (created_by_id = auth.uid());

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE lease_templates IS 'Stores lease document templates for generating lease agreements';
COMMENT ON COLUMN lease_templates.type IS 'Type of template: main lease or specific addendum type';
COMMENT ON COLUMN lease_templates.version IS 'Version number for template versioning';
COMMENT ON COLUMN lease_templates.template_file_url IS 'URL to the DOCX template file in Supabase Storage';
COMMENT ON COLUMN lease_templates.template_file_path IS 'Storage path for the template file';
COMMENT ON COLUMN lease_templates.template_content IS 'Extracted text content from the template for preview';
COMMENT ON COLUMN lease_templates.variables IS 'Array of variable names extracted from the template';
COMMENT ON COLUMN lease_templates.variable_schema IS 'JSON schema describing each variable (type, format, description)';
COMMENT ON COLUMN lease_templates.is_default IS 'Whether this is the default template for its type';
COMMENT ON COLUMN lease_templates.parent_template_id IS 'Reference to parent template for version chain';
COMMENT ON COLUMN lease_templates.minnesota_compliant IS 'Whether template complies with Minnesota regulations';

