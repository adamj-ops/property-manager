/**
 * Stripe Payment Integration Service
 * 
 * IMPORTANT SAFETY MEASURES:
 * - All operations default to test mode unless STRIPE_LIVE_MODE=true
 * - Live mode requires explicit environment variable
 * - This prevents accidental charges to real accounts
 */

import Stripe from 'stripe'
import { logger } from '~/libs/logger'

// Get Stripe secret key from environment
const getStripeSecretKey = (): string | null => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    logger.warn('STRIPE_SECRET_KEY not configured. Stripe features will be disabled.')
    return null
  }
  return key
}

// Initialize Stripe client with test mode enforcement
export const getStripeClient = (): Stripe | null => {
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    return null
  }

  const isLiveMode = process.env.STRIPE_LIVE_MODE === 'true'
  const isTestKey = secretKey.startsWith('sk_test_')
  const isLiveKey = secretKey.startsWith('sk_live_')

  // Safety check: prevent live mode unless explicitly enabled
  if (isLiveKey && !isLiveMode) {
    throw new Error(
      'STRIPE_SECRET_KEY is a live key but STRIPE_LIVE_MODE is not set to "true". ' +
        'This is a safety measure to prevent accidental live charges. ' +
        'Set STRIPE_LIVE_MODE=true only when ready for production.',
    )
  }

  // Log mode for debugging
  if (isLiveKey) {
    logger.warn('⚠️  Stripe LIVE MODE enabled. Real charges will be processed!')
  } else {
    logger.info('✅ Stripe TEST MODE enabled. No real charges will be processed.')
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
}

// Get Stripe client instance (singleton pattern)
let stripeClient: Stripe | null = null

export const stripe = (): Stripe => {
  if (!stripeClient) {
    const client = getStripeClient()
    if (!client) {
      throw new Error('Stripe client not initialized. Check STRIPE_SECRET_KEY configuration.')
    }
    stripeClient = client
  }
  return stripeClient
}

/**
 * Check if Stripe is configured and available
 */
export const isStripeConfigured = (): boolean => {
  try {
    return getStripeClient() !== null
  } catch {
    return false
  }
}

/**
 * Check if we're in live mode
 */
export const isLiveMode = (): boolean => {
  return process.env.STRIPE_LIVE_MODE === 'true'
}

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event => {
  const client = stripe()
  return client.webhooks.constructEvent(payload, signature, secret)
}

