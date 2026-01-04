'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { LuCircleCheck, LuHouse } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/tenant/payments/success')({
  component: PaymentSuccessPage,
})

function PaymentSuccessPage() {
  const search = Route.useSearch()
  const sessionId = (search as { session_id?: string })?.session_id

  return (
    <div className='w-full max-w-2xl space-y-6'>
      <Card className='border-green-500/20 bg-green-500/5'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10'>
            <LuCircleCheck className='size-8 text-green-600' />
          </div>
          <CardTitle className='text-2xl'>Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {sessionId && (
            <div className='rounded-lg bg-background p-4'>
              <Typography.Small className='text-muted-foreground'>Payment Session ID</Typography.Small>
              <Typography.Small className='font-mono'>{sessionId}</Typography.Small>
            </div>
          )}

          <div className='space-y-2 text-center'>
            <Typography.Muted>
              A receipt has been sent to your email address. Your payment will appear in your payment history shortly.
            </Typography.Muted>
            <Typography.Muted>
              If you have any questions about this payment, please contact your property manager.
            </Typography.Muted>
          </div>

          <div className='flex gap-4'>
            <Button asChild variant='outline' className='flex-1'>
              <Link to='/tenant/payments'>Make Another Payment</Link>
            </Button>
            <Button asChild className='flex-1'>
              <Link to='/tenant/dashboard'>
                <LuHouse className='mr-2 size-4' />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

