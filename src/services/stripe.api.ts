/**
 * Stripe Payment Service API
 * 
 * Server functions for Stripe payment operations.
 * All operations respect test/live mode settings.
 */

import { createServerFn } from '@tanstack/start'
import type Stripe from 'stripe'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

import { authedMiddleware } from '~/middlewares/auth'
import { logger } from '~/libs/logger'
import { prisma } from '~/server/db'
import { stripe, isStripeConfigured } from '~/server/stripe'
import { ApiError } from '~/server/errors'

// ============================================================================
// SCHEMAS
// ============================================================================

const tenantIdSchema = z.object({
  tenantId: z.string().uuid(),
})

const leaseIdSchema = z.object({
  leaseId: z.string().uuid(),
})

const createCustomerSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
})

const createPaymentIntentSchema = z.object({
  tenantId: z.string().uuid(),
  leaseId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
})

const createSubscriptionSchema = z.object({
  leaseId: z.string().uuid(),
  tenantId: z.string().uuid(),
  amount: z.number().positive(), // Monthly rent in dollars
  currency: z.string().default('usd'),
  startDate: z.coerce.date().optional(), // When subscription should start
})

const updateSubscriptionSchema = z.object({
  subscriptionId: z.string(), // Stripe subscription ID
  amount: z.number().positive().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(), // Partial refund if specified
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
})

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Create or retrieve Stripe customer for a tenant
 */
export const createOrGetStripeCustomer = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createCustomerSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { tenantId, email, name, phone } = data

    // Check if tenant already has a Stripe customer ID
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant) {
      throw ApiError.notFound('Tenant not found')
    }

    if (tenant.stripeCustomerId) {
      // Retrieve existing customer
      const customer = await stripe().customers.retrieve(tenant.stripeCustomerId)
      if (!customer.deleted) {
        return { customerId: tenant.stripeCustomerId, customer }
      }
    }

    // Create new Stripe customer
    const customer = await stripe().customers.create({
      email,
      name,
      phone: phone || undefined,
      metadata: {
        tenantId,
      },
    })

    // Update tenant with Stripe customer ID
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    })

    logger.info('Stripe customer created', { tenantId, customerId: customer.id })

    return { customerId: customer.id, customer }
  })

/**
 * Get Stripe customer details
 */
export const getStripeCustomer = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantIdSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant || !tenant.stripeCustomerId) {
      throw ApiError.notFound('Stripe customer not found for tenant')
    }

    const customer = await stripe().customers.retrieve(tenant.stripeCustomerId)

    return { customer }
  })

// ============================================================================
// PAYMENT METHOD MANAGEMENT
// ============================================================================

/**
 * Create setup intent for adding payment method
 */
export const createSetupIntent = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(tenantIdSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant) {
      throw ApiError.notFound('Tenant not found')
    }

    // Create or get customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      // Create customer first
      const tenantFull = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
        select: { email: true, firstName: true, lastName: true },
      })

      if (!tenantFull) {
        throw ApiError.notFound('Tenant not found')
      }

      const customer = await stripe().customers.create({
        email: tenantFull.email || undefined,
        name: `${tenantFull.firstName} ${tenantFull.lastName}`,
        metadata: { tenantId: data.tenantId },
      })

      customerId = customer.id

      await prisma.tenant.update({
        where: { id: data.tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create setup intent
    const setupIntent = await stripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'us_bank_account'], // Support cards and ACH
    })

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    }
  })

/**
 * List payment methods for a tenant
 */
export const listPaymentMethods = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({
    tenantId: z.string().uuid(),
    type: z.enum(['card', 'us_bank_account']).optional().default('card'),
  })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant || !tenant.stripeCustomerId) {
      return { paymentMethods: [] }
    }

    const paymentMethods = await stripe().paymentMethods.list({
      customer: tenant.stripeCustomerId,
      type: data.type,
    })

    return { paymentMethods: paymentMethods.data }
  })

/**
 * Delete a payment method
 */
export const deletePaymentMethod = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({
    tenantId: z.string().uuid(),
    paymentMethodId: z.string(),
  })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { tenantId, paymentMethodId } = data

    // Verify tenant owns this payment method
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant || !tenant.stripeCustomerId) {
      throw ApiError.notFound('Tenant has no Stripe customer')
    }

    // Verify payment method belongs to this customer
    const paymentMethod = await stripe().paymentMethods.retrieve(paymentMethodId)
    if (paymentMethod.customer !== tenant.stripeCustomerId) {
      throw ApiError.forbidden('Payment method does not belong to this tenant')
    }

    // Detach the payment method from the customer
    await stripe().paymentMethods.detach(paymentMethodId)

    logger.info('Payment method deleted', { tenantId, paymentMethodId })

    return { success: true }
  })

/**
 * Set default payment method for a tenant
 */
export const setDefaultPaymentMethod = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({
    tenantId: z.string().uuid(),
    paymentMethodId: z.string(),
  })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { tenantId, paymentMethodId } = data

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    })

    if (!tenant || !tenant.stripeCustomerId) {
      throw ApiError.notFound('Tenant has no Stripe customer')
    }

    // Update customer's default payment method
    await stripe().customers.update(tenant.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    logger.info('Default payment method updated', { tenantId, paymentMethodId })

    return { success: true }
  })

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

/**
 * Create payment intent for one-time payment
 */
export const createPaymentIntent = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createPaymentIntentSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { tenantId, leaseId, amount, currency, description, metadata } = data

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
    })

    if (!tenant) {
      throw ApiError.notFound('Tenant not found')
    }

    // Create or get Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: tenant.email || undefined,
        name: `${tenant.firstName} ${tenant.lastName}`,
        metadata: { tenantId },
      })
      customerId = customer.id

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create payment intent
    const paymentIntent = await stripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      description: description || `Rent payment for tenant ${tenantId}`,
      metadata: {
        tenantId,
        leaseId: leaseId || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      tenantId,
      amount,
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  })

/**
 * Create Stripe Checkout session for one-time payment
 */
export const createCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createPaymentIntentSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { tenantId, leaseId, amount, currency, description, metadata } = data

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true, email: true },
    })

    if (!tenant) {
      throw ApiError.notFound('Tenant not found')
    }

    // Create or get Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const tenantFull = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { email: true, firstName: true, lastName: true },
      })

      if (!tenantFull) {
        throw ApiError.notFound('Tenant not found')
      }

      const customer = await stripe().customers.create({
        email: tenantFull.email || undefined,
        name: `${tenantFull.firstName} ${tenantFull.lastName}`,
        metadata: { tenantId },
      })
      customerId = customer.id

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description || 'Rent Payment',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_BASE_URL}/tenant/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_BASE_URL}/tenant/payments/cancel`,
      metadata: {
        tenantId,
        leaseId: leaseId || '',
        ...metadata,
      },
    })

    return {
      sessionId: session.id,
      url: session.url,
    }
  })

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create subscription for recurring rent payments
 */
export const createSubscription = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createSubscriptionSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { leaseId, tenantId, amount, currency, startDate } = data

    // Verify lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: {
          select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
        },
      },
    })

    if (!lease) {
      throw ApiError.notFound('Lease not found')
    }

    if (lease.tenantId !== tenantId) {
      throw ApiError.forbidden('Tenant does not match lease')
    }

    // Check if subscription already exists
    if (lease.stripeSubscriptionId) {
      const existingSubscription = await stripe().subscriptions.retrieve(lease.stripeSubscriptionId)
      if (!existingSubscription.canceled_at) {
        throw ApiError.conflict('Subscription already exists for this lease')
      }
    }

    // Create or get Stripe customer
    let customerId = lease.tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: lease.tenant.email || undefined,
        name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        metadata: { tenantId },
      })
      customerId = customer.id

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create Stripe product and price
    const product = await stripe().products.create({
      name: `Rent - ${lease.leaseNumber}`,
      metadata: { leaseId },
    })

    const price = await stripe().prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
      recurring: {
        interval: 'month',
      },
    })

    // Create subscription
    const subscription = await stripe().subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        leaseId,
        tenantId,
      },
      billing_cycle_anchor: startDate ? Math.floor(startDate.getTime() / 1000) : undefined,
      proration_behavior: 'none',
    })

    // Update lease with subscription ID
    await prisma.lease.update({
      where: { id: leaseId },
      data: { stripeSubscriptionId: subscription.id },
    })

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      leaseId,
      amount,
    })

    return {
      subscriptionId: subscription.id,
      subscription,
      clientSecret: subscription.latest_invoice
        ? (subscription.latest_invoice as Stripe.Invoice).payment_intent
          ? ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent)
              .client_secret
          : undefined
        : undefined,
    }
  })

/**
 * Update subscription (e.g., change rent amount)
 */
export const updateSubscription = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updateSubscriptionSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { subscriptionId, amount, cancelAtPeriodEnd } = data

    // Retrieve subscription
    const subscription = await stripe().subscriptions.retrieve(subscriptionId)

    const updates: Stripe.SubscriptionUpdateParams = {}

    // Update amount if provided
    if (amount !== undefined) {
      // Create new price
      const productId = typeof subscription.items.data[0]?.price.product === 'string'
        ? subscription.items.data[0].price.product
        : (subscription.items.data[0]?.price.product as Stripe.Product).id

      const newPrice = await stripe().prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100),
        currency: subscription.currency,
        recurring: { interval: 'month' },
      })

      // Update subscription with new price
      updates.items = [
        {
          id: subscription.items.data[0]?.id,
          price: newPrice.id,
        },
      ]
      updates.proration_behavior = 'create_prorations'
    }

    // Cancel at period end if requested
    if (cancelAtPeriodEnd !== undefined) {
      updates.cancel_at_period_end = cancelAtPeriodEnd
    }

    const updatedSubscription = await stripe().subscriptions.update(subscriptionId, updates)

    logger.info('Subscription updated', { subscriptionId, updates })

    return { subscription: updatedSubscription }
  })

/**
 * Cancel subscription
 */
export const cancelSubscription = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({ subscriptionId: z.string() })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const canceledSubscription = await stripe().subscriptions.cancel(data.subscriptionId)

    // Clear subscription ID from lease
    await prisma.lease.updateMany({
      where: { stripeSubscriptionId: data.subscriptionId },
      data: { stripeSubscriptionId: null },
    })

    logger.info('Subscription canceled', { subscriptionId: data.subscriptionId })

    return { subscription: canceledSubscription }
  })

/**
 * Get subscription details by lease ID
 */
export const getSubscription = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(leaseIdSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const lease = await prisma.lease.findUnique({
      where: { id: data.leaseId },
      select: { stripeSubscriptionId: true },
    })

    if (!lease) {
      throw ApiError.notFound('Lease not found')
    }

    if (!lease.stripeSubscriptionId) {
      return { subscription: null }
    }

    const subscription = await stripe().subscriptions.retrieve(lease.stripeSubscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    })

    return {
      subscription,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: subscription.items.data[0]?.price.unit_amount
        ? subscription.items.data[0].price.unit_amount / 100
        : null,
    }
  })

/**
 * Get subscription details by subscription ID (direct lookup)
 */
export const getSubscriptionById = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({ subscriptionId: z.string() })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const subscription = await stripe().subscriptions.retrieve(data.subscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    })

    return {
      subscription,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  })

/**
 * Pause subscription (sets cancel_at_period_end to true)
 */
export const pauseSubscription = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({ subscriptionId: z.string() })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const subscription = await stripe().subscriptions.update(data.subscriptionId, {
      cancel_at_period_end: true,
    })

    logger.info('Subscription paused', { subscriptionId: data.subscriptionId })

    return { subscription }
  })

/**
 * Resume subscription (sets cancel_at_period_end to false)
 */
export const resumeSubscription = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(z.object({ subscriptionId: z.string() })))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const subscription = await stripe().subscriptions.update(data.subscriptionId, {
      cancel_at_period_end: false,
    })

    logger.info('Subscription resumed', { subscriptionId: data.subscriptionId })

    return { subscription }
  })

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Process refund for a payment
 */
export const refundPayment = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(refundPaymentSchema))
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw ApiError.serviceUnavailable('Stripe is not configured')
    }

    const { paymentId, amount, reason } = data

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { stripeChargeId: true, amount: true },
    })

    if (!payment) {
      throw ApiError.notFound('Payment not found')
    }

    if (!payment.stripeChargeId) {
      throw ApiError.badRequest('Payment does not have a Stripe charge ID')
    }

    // Process refund
    const refundParams: Stripe.RefundCreateParams = {
      charge: payment.stripeChargeId,
      reason: reason || 'requested_by_customer',
    }

    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert to cents
    }

    const refund = await stripe().refunds.create(refundParams)

    // Update payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        notes: `Refunded via Stripe: ${refund.id}. Amount: $${(refund.amount / 100).toFixed(2)}`,
      },
    })

    logger.info('Refund processed', { paymentId, refundId: refund.id })

    return { refund }
  })

