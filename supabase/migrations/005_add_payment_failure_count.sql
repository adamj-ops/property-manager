-- Migration: Add payment_failure_count to pm_tenants
-- Purpose: Track consecutive payment failures for late fee escalation (EPM-77)

-- Add payment_failure_count column to pm_tenants table
ALTER TABLE pm_tenants
ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN pm_tenants.payment_failure_count IS 'Track consecutive payment failures for late fee escalation. Reset to 0 on successful payment.';
