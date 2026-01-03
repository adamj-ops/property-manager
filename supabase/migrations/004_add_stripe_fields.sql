-- =============================================================================
-- Add Stripe Integration Fields
-- Migration: 004_add_stripe_fields.sql
-- =============================================================================
-- Adds Stripe-related fields to support payment processing:
-- - tenants.stripe_customer_id: Stripe customer ID for payment methods
-- - leases.stripe_subscription_id: Stripe subscription ID for recurring payments
-- - payments.stripe_payment_intent_id: Stripe payment intent ID
-- - payments.stripe_charge_id: Stripe charge ID (for refunds)
-- =============================================================================

-- Add Stripe customer ID to tenants table
ALTER TABLE pm_tenants
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON pm_tenants(stripe_customer_id);

-- Add Stripe subscription ID to leases table
ALTER TABLE pm_leases
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leases_stripe_subscription_id ON pm_leases(stripe_subscription_id);

-- Add Stripe payment intent ID and charge ID to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);

-- Add comments for documentation
COMMENT ON COLUMN pm_tenants.stripe_customer_id IS 'Stripe customer ID for payment method management';
COMMENT ON COLUMN pm_leases.stripe_subscription_id IS 'Stripe subscription ID for recurring rent payments';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe payment intent ID for one-time payments';
COMMENT ON COLUMN payments.stripe_charge_id IS 'Stripe charge ID for refund processing';

