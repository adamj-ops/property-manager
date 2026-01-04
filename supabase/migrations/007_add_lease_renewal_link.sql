-- Add renewal tracking to leases
-- This links a renewed lease to its original lease for tracking the renewal chain

-- Add renewed_from_lease_id column
ALTER TABLE pm_leases
  ADD COLUMN IF NOT EXISTS renewed_from_lease_id UUID REFERENCES pm_leases(id);

-- Create index for renewal lookups
CREATE INDEX IF NOT EXISTS idx_leases_renewed_from
  ON pm_leases(renewed_from_lease_id);

-- Add comment for documentation
COMMENT ON COLUMN pm_leases.renewed_from_lease_id IS 'References the original lease that this lease renews';
