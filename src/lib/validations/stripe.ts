/**
 * Stripe Validation Schemas
 *
 * Zod schemas for validating Stripe-related operations.
 * These are modular and can be imported where needed.
 */

import { z } from 'zod'

// ============================================================================
// PAYMENT INTENT SCHEMAS
// ============================================================================

export const createPaymentIntentSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive().max(50000), // $500 max per spec
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
})

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const createSubscriptionSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  billingDay: z.number().min(1).max(28), // Avoid 29-31 for consistency
  startDate: z.date().optional(),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  amount: z.number().positive().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  pauseCollection: z.boolean().optional(),
})

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

// ============================================================================
// WEBHOOK EVENT SCHEMA
// ============================================================================

export const webhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
})

export type WebhookEvent = z.infer<typeof webhookEventSchema>

// ============================================================================
// PAYMENT METHOD SCHEMAS
// ============================================================================

export const paymentMethodTypeSchema = z.enum(['card', 'us_bank_account'])

export const attachPaymentMethodSchema = z.object({
  tenantId: z.string().uuid(),
  paymentMethodId: z.string(),
})

export const detachPaymentMethodSchema = z.object({
  tenantId: z.string().uuid(),
  paymentMethodId: z.string(),
})

// ============================================================================
// REFUND SCHEMAS
// ============================================================================

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(), // Partial refund if specified
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
})

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

export const createCustomerSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

// ============================================================================
// CHECKOUT SESSION SCHEMAS
// ============================================================================

export const createCheckoutSessionSchema = z.object({
  tenantId: z.string().uuid(),
  leaseId: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>

// ============================================================================
// AMOUNT VALIDATION HELPERS
// ============================================================================

/**
 * Validate payment amount is within acceptable range
 * Per Minnesota compliance: support minimum $50 payment
 */
export const validatePaymentAmount = (amount: number): boolean => {
  return amount >= 50 && amount <= 50000
}

/**
 * Convert dollars to cents for Stripe
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars from Stripe
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100
}

// ============================================================================
// STRIPE ID VALIDATION
// ============================================================================

export const stripeCustomerIdSchema = z.string().startsWith('cus_')
export const stripePaymentIntentIdSchema = z.string().startsWith('pi_')
export const stripeSubscriptionIdSchema = z.string().startsWith('sub_')
export const stripeChargeIdSchema = z.string().startsWith('ch_')
export const stripePaymentMethodIdSchema = z.string().startsWith('pm_')
export const stripeSetupIntentIdSchema = z.string().startsWith('seti_')
export const stripeRefundIdSchema = z.string().startsWith('re_')
export const stripeEventIdSchema = z.string().startsWith('evt_')
