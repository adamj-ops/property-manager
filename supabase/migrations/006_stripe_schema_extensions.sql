-- Migration: EPM-77 Stripe Schema Extensions
-- Purpose: Add missing fields for full Stripe integration per technical spec

-- ============================================
-- PART 1: Payment Table Extensions
-- ============================================

-- Add Stripe payment method ID for tracking which method was used
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Add Stripe fee amount for fee tracking
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_fee_amount DECIMAL(10, 2);

-- Add failure reason field (previously stored in notes)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add refund tracking fields
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

-- Add index for payment method lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_method_id
ON payments(stripe_payment_method_id)
WHERE stripe_payment_method_id IS NOT NULL;

-- ============================================
-- PART 2: Stripe Webhooks Table (Idempotency)
-- ============================================

-- Create stripe_webhooks table for idempotency tracking
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMP,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON stripe_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type ON stripe_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks(processed);

-- Add comment for documentation
COMMENT ON TABLE stripe_webhooks IS 'Tracks Stripe webhook events for idempotency and debugging';
COMMENT ON COLUMN stripe_webhooks.event_id IS 'Stripe event ID (evt_xxx) - used to prevent duplicate processing';
COMMENT ON COLUMN stripe_webhooks.payload IS 'Raw event payload stored for debugging and audit purposes';
