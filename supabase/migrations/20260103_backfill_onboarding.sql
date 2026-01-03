-- Migration: Backfill onboardingCompletedAt for existing users
-- Created: 2026-01-03
-- Purpose: Ensure existing users don't get stuck in the new onboarding flow
--
-- This migration was applied manually via execute_sql due to trigger conflicts.
-- The trigger `update_updated_at_column()` references camelCase `updatedAt` 
-- but the column is `updated_at` - this caused the migration tool to fail.
--
-- Applied using session_replication_role = replica to bypass triggers.

-- Backfill onboardingCompletedAt for all existing users where it's NULL
-- SET session_replication_role = replica;

UPDATE public.users
SET "onboardingCompletedAt" = NOW()
WHERE "onboardingCompletedAt" IS NULL;

-- SET session_replication_role = DEFAULT;

-- Note: This migration set onboardingCompletedAt for 2 existing users on 2026-01-03
