'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LuCreditCard, LuDollarSign } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { createCheckoutSession } from '~/services/stripe.api'
import { useTenantBalanceQuery } from '~/services/tenant-portal.query'

export const Route = createFileRoute('/tenant/payments')({
  component: TenantPaymentsPage,
})

function TenantPaymentsPage() {
  const { data: balanceData } = useTenantBalanceQuery()
  const [amountType, setAmountType] = useState<'full' | 'custom'>('full')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const currentBalance = balanceData.currentBalance
  const monthlyRent = balanceData.monthlyRent

  const paymentAmount =
    amountType === 'full' ? currentBalance : parseFloat(customAmount) || 0

  const handlePayment = async () => {
    if (paymentAmount <= 0) {
      return
    }

    setIsLoading(true)

    try {
      const { url } = await createCheckoutSession({
        data: {
          tenantId: balanceData.tenantId,
          leaseId: balanceData.leaseId || undefined,
          amount: paymentAmount,
          currency: 'usd',
          description: `Rent payment - ${balanceData.leaseId ? `Lease ${balanceData.leaseId.substring(0, 8)}` : 'Monthly Rent'}`,
        },
      })

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className='w-full max-w-3xl space-y-6'>
      {/* Page Header */}
      <div>
        <Typography.H1>Pay Rent</Typography.H1>
        <Typography.Muted>Make a secure payment using Stripe</Typography.Muted>
      </div>

      {/* Current Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <Typography.H2 className='text-destructive'>
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography.H2>
            <Typography.Muted>
              Monthly rent: ${monthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography.Muted>
            {balanceData.lastPaymentDate && (
              <Typography.Muted className='text-xs'>
                Last payment: ${balanceData.lastPaymentAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on{' '}
                {new Date(balanceData.lastPaymentDate).toLocaleDateString()}
              </Typography.Muted>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Amount</CardTitle>
          <CardDescription>Select how much you'd like to pay</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <Button
              type='button'
              variant={amountType === 'full' ? 'default' : 'outline'}
              className='w-full justify-between'
              onClick={() => {
                setAmountType('full')
                setCustomAmount('')
              }}
            >
              <span>Pay Full Balance</span>
              <Badge variant={amountType === 'full' ? 'secondary' : 'outline'}>
                ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
            </Button>
            <Button
              type='button'
              variant={amountType === 'custom' ? 'default' : 'outline'}
              className='w-full justify-start'
              onClick={() => setAmountType('custom')}
            >
              Pay Custom Amount
            </Button>
          </div>

          {amountType === 'custom' && (
            <div className='space-y-2'>
              <Label htmlFor='customAmount'>Amount</Label>
              <div className='relative'>
                <LuDollarSign className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='customAmount'
                  type='number'
                  min='0.01'
                  max={currentBalance}
                  step='0.01'
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder='0.00'
                  className='pl-9'
                />
              </div>
              <Typography.Muted className='text-xs'>
                Maximum: ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.Muted>
            </div>
          )}

          <Separator />

          {/* Payment Summary */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Typography.Muted>Payment Amount</Typography.Muted>
              <Typography.H3>
                ${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.H3>
            </div>
            {paymentAmount < currentBalance && (
              <div className='flex items-center justify-between'>
                <Typography.Muted>Remaining Balance</Typography.Muted>
                <Typography.Small className='text-destructive'>
                  ${(currentBalance - paymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography.Small>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || paymentAmount <= 0 || paymentAmount > currentBalance}
            size='lg'
            className='w-full'
          >
            <LuCreditCard className='mr-2 size-4' />
            {isLoading ? 'Processing...' : 'Pay with Stripe'}
          </Button>

          <Typography.Muted className='text-center text-xs'>
            You will be redirected to Stripe's secure payment page to complete your payment.
          </Typography.Muted>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className='border-blue-500/20 bg-blue-500/5'>
        <CardHeader>
          <CardTitle className='text-sm'>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            Payments are processed securely through Stripe. We accept all major credit cards and bank transfers.
          </p>
          <p>
            Your payment will be recorded immediately upon successful completion. A receipt will be sent to your email address.
          </p>
          <p>
            If you have any questions about your payment, please contact your property manager.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

