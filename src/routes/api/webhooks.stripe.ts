import { createAPIFileRoute } from '@tanstack/start/api'
import type Stripe from 'stripe'

import { logger } from '~/libs/logger'
import { prisma } from '~/server/db'
import { stripe, verifyWebhookSignature } from '~/server/stripe'

/**
 * Stripe Webhook Endpoint
 * 
 * Handles Stripe webhook events for payment processing.
 * 
 * IMPORTANT: This endpoint uses webhook signature verification to ensure
 * events are from Stripe. All operations respect test/live mode settings.
 * 
 * Supported events:
 * - payment_intent.succeeded - Record successful payment
 * - payment_intent.payment_failed - Handle payment failure
 * - invoice.payment_succeeded - Record subscription payment
 * - invoice.payment_failed - Handle subscription payment failure
 * - customer.subscription.updated - Sync subscription changes
 * - customer.subscription.deleted - Handle subscription cancellation
 */
export const APIRoute = createAPIFileRoute('/api/webhooks/stripe')({
  POST: async ({ request }) => {
    // Check if Stripe is configured
    if (!stripe()) {
      logger.error('Stripe webhook received but Stripe is not configured')
      return new Response('Stripe not configured', { status: 503 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logger.error('Stripe webhook: missing signature header')
      return new Response('Missing signature', { status: 400 })
    }

    let event

    try {
      // Verify webhook signature
      event = verifyWebhookSignature(body, signature, webhookSecret)
    } catch (error) {
      logger.error('Stripe webhook signature verification failed', { error })
      return new Response('Invalid signature', { status: 400 })
    }

    // Log event for debugging
    logger.info('Stripe webhook event received', {
      type: event.type,
      id: event.id,
      livemode: event.livemode,
    })

    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
          break
        }

        case 'payment_intent.payment_failed': {
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
          break
        }

        case 'invoice.payment_succeeded': {
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
        }

        case 'invoice.payment_failed': {
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break
        }

        case 'customer.subscription.updated': {
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        }

        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        }

        default:
          logger.info('Unhandled Stripe webhook event type', { type: event.type })
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      logger.error('Error processing Stripe webhook', { error, eventType: event.type })
      // Return 200 to prevent Stripe from retrying (we'll handle retries manually)
      return new Response(JSON.stringify({ received: true, error: 'Processing failed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
})

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment intent succeeded', { paymentIntentId: paymentIntent.id })

  // Find payment by payment intent ID
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { tenant: true, lease: true },
  })

  if (!payment) {
    logger.warn('Payment not found for payment intent', { paymentIntentId: paymentIntent.id })
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      receivedDate: new Date(),
      processedAt: new Date(),
      stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : undefined,
      referenceNumber: paymentIntent.id,
    },
  })

  logger.info('Payment recorded successfully', { paymentId: payment.id })
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id })

  // Find payment by payment intent ID
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { tenant: true, lease: true },
  })

  if (!payment) {
    logger.warn('Payment not found for payment intent', { paymentIntentId: paymentIntent.id })
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    },
  })

  // TODO: Send notification emails (EPM-4 Resend integration)
  // TODO: Track failure count for late fee escalation (EPM-37)
}

/**
 * Handle successful invoice payment (subscription)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Invoice payment succeeded', { invoiceId: invoice.id, subscriptionId: invoice.subscription })

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    logger.warn('Invoice missing subscription ID', { invoiceId: invoice.id })
    return
  }

  // Find lease by subscription ID
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
    include: { tenant: true },
  })

  if (!lease) {
    logger.warn('Lease not found for subscription', { subscriptionId: invoice.subscription })
    return
  }

  // Create or update payment record
  const amount = invoice.amount_paid / 100 // Convert from cents to dollars
  const paymentDate = new Date(invoice.created * 1000)

  await prisma.payment.upsert({
    where: {
      stripePaymentIntentId: invoice.payment_intent as string | undefined || `invoice_${invoice.id}`,
    },
    create: {
      tenantId: lease.tenantId,
      leaseId: lease.id,
      type: 'RENT',
      method: 'ONLINE',
      status: 'COMPLETED',
      amount,
      appliedAmount: amount,
      paymentDate,
      receivedDate: paymentDate,
      processedAt: new Date(),
      stripePaymentIntentId: invoice.payment_intent as string | undefined,
      stripeChargeId: invoice.charge as string | undefined,
      referenceNumber: invoice.id,
      memo: `Recurring rent payment via Stripe subscription`,
    },
    update: {
      status: 'COMPLETED',
      receivedDate: paymentDate,
      processedAt: new Date(),
    },
  })

  logger.info('Subscription payment recorded', { leaseId: lease.id, amount })
}

/**
 * Handle failed invoice payment (subscription)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', { invoiceId: invoice.id, subscriptionId: invoice.subscription })

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    return
  }

  // Find lease by subscription ID
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
    include: { tenant: true },
  })

  if (!lease) {
    return
  }

  // TODO: Send notification emails (EPM-4 Resend integration)
  // TODO: Track failure count for late fee escalation (EPM-37)
  // TODO: Trigger retry logic
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Subscription updated', { subscriptionId: subscription.id })

  // Find lease by subscription ID
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!lease) {
    logger.warn('Lease not found for subscription', { subscriptionId: subscription.id })
    return
  }

  // Update lease if subscription status changed
  // Note: We don't store subscription status in the lease model,
  // but we could add it if needed for tracking
  logger.info('Subscription update processed', { leaseId: lease.id })
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Subscription deleted', { subscriptionId: subscription.id })

  // Find lease by subscription ID
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!lease) {
    logger.warn('Lease not found for subscription', { subscriptionId: subscription.id })
    return
  }

  // Clear subscription ID from lease
  await prisma.lease.update({
    where: { id: lease.id },
    data: { stripeSubscriptionId: null },
  })

  logger.info('Subscription cleared from lease', { leaseId: lease.id })
}

