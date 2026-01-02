-- =============================================================================
-- Add documents.storage_path for Supabase Storage integration
-- =============================================================================
--
-- Why:
-- - `src/services/documents.api.ts` persists a `storage_path` so we can:
--   - generate fresh signed download URLs
--   - delete the underlying object on document delete
-- - Initial schema (001_initial_schema.sql) did not include this column.
--
-- Notes:
-- - Kept nullable to avoid breaking existing rows (if any).
-- - App code writes this field for new uploads.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_storage_path
  ON documents(storage_path);

