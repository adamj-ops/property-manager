'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { LuAlertCircle, LuCreditCard, LuHome } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Typography } from '~/components/ui/typography'
import { useTenantBalanceQuery } from '~/services/tenant-portal.query'

export const Route = createFileRoute('/tenant/payments/cancel')({
  component: PaymentCancelPage,
})

function PaymentCancelPage() {
  const { data: balanceData } = useTenantBalanceQuery()

  return (
    <div className='w-full max-w-2xl space-y-6'>
      <Card className='border-yellow-500/20 bg-yellow-500/5'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-yellow-500/10'>
            <LuAlertCircle className='size-8 text-yellow-600' />
          </div>
          <CardTitle className='text-2xl'>Payment Cancelled</CardTitle>
          <CardDescription>Your payment was not processed</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='rounded-lg bg-background p-4'>
            <div className='space-y-2'>
              <Typography.Small className='text-muted-foreground'>Current Balance</Typography.Small>
              <Typography.H3 className='text-destructive'>
                ${balanceData.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.H3>
            </div>
          </div>

          <div className='space-y-2 text-center'>
            <Typography.Muted>
              Your payment was cancelled and no charges were made. You can try again at any time.
            </Typography.Muted>
            <Typography.Muted>
              If you experienced any issues, please contact your property manager for assistance.
            </Typography.Muted>
          </div>

          <div className='flex gap-4'>
            <Button asChild variant='outline' className='flex-1'>
              <Link to='/tenant/dashboard'>
                <LuHome className='mr-2 size-4' />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild className='flex-1'>
              <Link to='/tenant/payments'>
                <LuCreditCard className='mr-2 size-4' />
                Try Again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
