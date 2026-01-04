import { createAPIFileRoute } from '@tanstack/start/api'
import { format } from 'date-fns'
import type Stripe from 'stripe'

import { PaymentFailedEmail } from '~/emails/payment-failed'
import { PaymentReceiptEmail } from '~/emails/payment-receipt'
import { logger } from '~/libs/logger'
import { formatCurrency } from '~/libs/utils'
import { prisma } from '~/server/db'
import { sendEmail } from '~/server/email'
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
 * - charge.refunded - Sync refunds initiated outside the app
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

    // Idempotency check - prevent duplicate processing
    const existingWebhook = await prisma.stripeWebhook.findUnique({
      where: { eventId: event.id },
    })

    if (existingWebhook?.processed) {
      logger.info('Duplicate webhook event, already processed', { eventId: event.id })
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Record webhook event for idempotency tracking
    await prisma.stripeWebhook.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        payload: event.data.object as object,
        processed: false,
      },
      update: {
        eventType: event.type,
        payload: event.data.object as object,
      },
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

        case 'charge.refunded': {
          await handleChargeRefunded(event.data.object as Stripe.Charge)
          break
        }

        default:
          logger.info('Unhandled Stripe webhook event type', { type: event.type })
      }

      // Mark webhook as processed
      await prisma.stripeWebhook.update({
        where: { eventId: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      })

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      // Record error in webhook tracking
      await prisma.stripeWebhook.update({
        where: { eventId: event.id },
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

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

  // Find payment by payment intent ID with full context for email
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: {
      tenant: true,
      lease: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  })

  if (!payment) {
    logger.warn('Payment not found for payment intent', { paymentIntentId: paymentIntent.id })
    return
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
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

  // Send payment receipt email to tenant
  if (payment.tenant.email) {
    const propertyAddress = payment.lease?.unit?.property
      ? `${payment.lease.unit.property.addressLine1}, ${payment.lease.unit.property.city}, ${payment.lease.unit.property.state}`
      : 'Your rental property'

    try {
      await sendEmail({
        to: payment.tenant.email,
        subject: 'Payment Receipt - Your payment has been received',
        react: PaymentReceiptEmail({
          tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
          amount: formatCurrency(Number(payment.amount)),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          paymentMethod: 'Online Payment',
          receiptNumber: updatedPayment.paymentNumber,
          propertyAddress,
        }),
      })
      logger.info('Payment receipt email sent', { tenantEmail: payment.tenant.email, paymentId: payment.id })
    } catch (emailError) {
      logger.error('Failed to send payment receipt email', { error: emailError, paymentId: payment.id })
    }
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id })

  // Find payment by payment intent ID with full context for notifications
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: {
      tenant: true,
      lease: {
        include: {
          unit: {
            include: {
              property: {
                include: {
                  manager: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!payment) {
    logger.warn('Payment not found for payment intent', { paymentIntentId: paymentIntent.id })
    return
  }

  const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error'

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      notes: `Payment failed: ${failureReason}`,
    },
  })

  // Increment payment failure count on tenant
  await prisma.tenant.update({
    where: { id: payment.tenantId },
    data: {
      paymentFailureCount: {
        increment: 1,
      },
    },
  })

  const propertyAddress = payment.lease?.unit?.property
    ? `${payment.lease.unit.property.addressLine1}, ${payment.lease.unit.property.city}, ${payment.lease.unit.property.state}`
    : 'Your rental property'

  const paymentLink = `${process.env.VITE_APP_URL || ''}/tenant/payments`

  // Send payment failed email to tenant
  if (payment.tenant.email) {
    try {
      await sendEmail({
        to: payment.tenant.email,
        subject: 'Payment Failed - Action Required',
        react: PaymentFailedEmail({
          tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
          amount: formatCurrency(Number(payment.amount)),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          failureReason,
          propertyAddress,
          paymentLink,
        }),
      })
      logger.info('Payment failed email sent to tenant', { tenantEmail: payment.tenant.email, paymentId: payment.id })
    } catch (emailError) {
      logger.error('Failed to send payment failed email to tenant', { error: emailError, paymentId: payment.id })
    }
  }

  // Send notification to property manager
  const manager = payment.lease?.unit?.property?.manager
  if (manager?.email) {
    try {
      await sendEmail({
        to: manager.email,
        subject: `Payment Failed - ${payment.tenant.firstName} ${payment.tenant.lastName}`,
        react: PaymentFailedEmail({
          tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
          amount: formatCurrency(Number(payment.amount)),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          failureReason,
          propertyAddress,
          paymentLink: `${process.env.VITE_APP_URL || ''}/app/tenants/${payment.tenantId}`,
        }),
      })
      logger.info('Payment failed email sent to manager', { managerEmail: manager.email, paymentId: payment.id })
    } catch (emailError) {
      logger.error('Failed to send payment failed email to manager', { error: emailError, paymentId: payment.id })
    }
  }

  // Check if tenant has multiple failures for late fee escalation (EPM-37)
  const tenant = await prisma.tenant.findUnique({
    where: { id: payment.tenantId },
    select: { paymentFailureCount: true },
  })

  if (tenant && tenant.paymentFailureCount >= 3) {
    logger.warn('Tenant has multiple payment failures - consider late fee escalation', {
      tenantId: payment.tenantId,
      failureCount: tenant.paymentFailureCount,
    })
    // Late fee automation will be handled by EPM-37
  }
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

  // Find lease by subscription ID with full context for email
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
    include: {
      tenant: true,
      unit: {
        include: {
          property: true,
        },
      },
    },
  })

  if (!lease) {
    logger.warn('Lease not found for subscription', { subscriptionId: invoice.subscription })
    return
  }

  // Create or update payment record
  const amount = invoice.amount_paid / 100 // Convert from cents to dollars
  const paymentDate = new Date(invoice.created * 1000)

  const payment = await prisma.payment.upsert({
    where: {
      stripePaymentIntentId: invoice.payment_intent as string | undefined || `invoice_${invoice.id}`,
    },
    create: {
      tenantId: lease.tenantId,
      leaseId: lease.id,
      type: 'RENT',
      method: 'ONLINE_PORTAL',
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

  // Reset payment failure count on successful payment
  await prisma.tenant.update({
    where: { id: lease.tenantId },
    data: { paymentFailureCount: 0 },
  })

  logger.info('Subscription payment recorded', { leaseId: lease.id, amount })

  // Send payment receipt email to tenant
  if (lease.tenant.email) {
    const propertyAddress = lease.unit?.property
      ? `${lease.unit.property.addressLine1}, ${lease.unit.property.city}, ${lease.unit.property.state}`
      : 'Your rental property'

    try {
      await sendEmail({
        to: lease.tenant.email,
        subject: 'Payment Receipt - Your rent payment has been received',
        react: PaymentReceiptEmail({
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          amount: formatCurrency(amount),
          paymentDate: format(paymentDate, 'MMMM d, yyyy'),
          paymentMethod: 'Recurring Payment',
          receiptNumber: payment.paymentNumber,
          propertyAddress,
        }),
      })
      logger.info('Subscription payment receipt email sent', { tenantEmail: lease.tenant.email, leaseId: lease.id })
    } catch (emailError) {
      logger.error('Failed to send subscription payment receipt email', { error: emailError, leaseId: lease.id })
    }
  }
}

/**
 * Handle failed invoice payment (subscription)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', { invoiceId: invoice.id, subscriptionId: invoice.subscription })

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    return
  }

  // Find lease by subscription ID with full context for notifications
  const lease = await prisma.lease.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
    include: {
      tenant: true,
      unit: {
        include: {
          property: {
            include: {
              manager: true,
            },
          },
        },
      },
    },
  })

  if (!lease) {
    return
  }

  const amount = invoice.amount_due / 100 // Convert from cents to dollars
  const failureReason = invoice.last_finalization_error?.message || 'Payment method declined'

  // Increment payment failure count on tenant
  await prisma.tenant.update({
    where: { id: lease.tenantId },
    data: {
      paymentFailureCount: {
        increment: 1,
      },
    },
  })

  const propertyAddress = lease.unit?.property
    ? `${lease.unit.property.addressLine1}, ${lease.unit.property.city}, ${lease.unit.property.state}`
    : 'Your rental property'

  const paymentLink = `${process.env.VITE_APP_URL || ''}/tenant/payments`

  // Send payment failed email to tenant
  if (lease.tenant.email) {
    try {
      await sendEmail({
        to: lease.tenant.email,
        subject: 'Subscription Payment Failed - Action Required',
        react: PaymentFailedEmail({
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          amount: formatCurrency(amount),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          failureReason,
          propertyAddress,
          paymentLink,
        }),
      })
      logger.info('Subscription payment failed email sent to tenant', { tenantEmail: lease.tenant.email, leaseId: lease.id })
    } catch (emailError) {
      logger.error('Failed to send subscription payment failed email to tenant', { error: emailError, leaseId: lease.id })
    }
  }

  // Send notification to property manager
  const manager = lease.unit?.property?.manager
  if (manager?.email) {
    try {
      await sendEmail({
        to: manager.email,
        subject: `Subscription Payment Failed - ${lease.tenant.firstName} ${lease.tenant.lastName}`,
        react: PaymentFailedEmail({
          tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          amount: formatCurrency(amount),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          failureReason,
          propertyAddress,
          paymentLink: `${process.env.VITE_APP_URL || ''}/app/tenants/${lease.tenantId}`,
        }),
      })
      logger.info('Subscription payment failed email sent to manager', { managerEmail: manager.email, leaseId: lease.id })
    } catch (emailError) {
      logger.error('Failed to send subscription payment failed email to manager', { error: emailError, leaseId: lease.id })
    }
  }

  // Check if tenant has multiple failures for late fee escalation (EPM-37)
  const tenant = await prisma.tenant.findUnique({
    where: { id: lease.tenantId },
    select: { paymentFailureCount: true },
  })

  if (tenant && tenant.paymentFailureCount >= 3) {
    logger.warn('Tenant has multiple subscription payment failures - consider late fee escalation', {
      tenantId: lease.tenantId,
      failureCount: tenant.paymentFailureCount,
    })
    // Late fee automation will be handled by EPM-37
  }

  // Note: Stripe handles automatic retry logic for subscription payments
  // Configure retry settings in Stripe Dashboard under Billing > Subscriptions > Settings
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

/**
 * Handle charge refund (syncs refunds initiated outside the app, e.g., from Stripe Dashboard)
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info('Charge refunded', { chargeId: charge.id, refundedAmount: charge.amount_refunded })

  // Find payment by charge ID
  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
    include: { tenant: true },
  })

  if (!payment) {
    // Try to find by payment intent ID
    const paymentByIntent = charge.payment_intent
      ? await prisma.payment.findUnique({
          where: { stripePaymentIntentId: charge.payment_intent as string },
          include: { tenant: true },
        })
      : null

    if (!paymentByIntent) {
      logger.warn('Payment not found for refunded charge', { chargeId: charge.id })
      return
    }

    await processRefund(paymentByIntent, charge)
    return
  }

  await processRefund(payment, charge)
}

/**
 * Process refund and update payment record
 */
async function processRefund(
  payment: { id: string; tenant: { email: string | null; firstName: string; lastName: string }; amount: unknown },
  charge: Stripe.Charge
) {
  const refundAmount = charge.amount_refunded / 100 // Convert from cents to dollars
  const isFullRefund = charge.refunded
  const originalAmount = Number(payment.amount)

  // Update payment record with refund details
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: isFullRefund ? 'REFUNDED' : 'COMPLETED',
      refundedAt: new Date(),
      refundAmount,
      notes: isFullRefund
        ? `Fully refunded: $${refundAmount.toFixed(2)}`
        : `Partially refunded: $${refundAmount.toFixed(2)} of $${originalAmount.toFixed(2)}`,
    },
  })

  logger.info('Payment refund recorded', {
    paymentId: payment.id,
    refundAmount,
    isFullRefund,
  })

  // Send refund notification email to tenant
  if (payment.tenant.email) {
    try {
      await sendEmail({
        to: payment.tenant.email,
        subject: 'Payment Refund Confirmation',
        react: PaymentReceiptEmail({
          tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
          amount: formatCurrency(refundAmount),
          paymentDate: format(new Date(), 'MMMM d, yyyy'),
          paymentMethod: 'Refund',
          receiptNumber: `REF-${charge.id.slice(-8).toUpperCase()}`,
          propertyAddress: 'Refund processed',
        }),
      })
      logger.info('Refund notification email sent', { tenantEmail: payment.tenant.email, paymentId: payment.id })
    } catch (emailError) {
      logger.error('Failed to send refund notification email', { error: emailError, paymentId: payment.id })
    }
  }
}

