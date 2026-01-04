import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
  LuArrowLeft,
  LuCheck,
  LuDownload,
  LuFilter,
  LuLoader2,
  LuSearch,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { Textarea } from '~/components/ui/textarea'
import { usePaymentsQuery, usePaymentStatsQuery, useCreatePayment } from '~/services/payments.query'
import { useLeasesQuery } from '~/services/leases.query'
import type { PaymentStatus } from '~/services/payments.schema'

export const Route = createFileRoute('/app/financials/payments')({
  component: PaymentsPage,
})

// Stats section
function PaymentStatsSection() {
  const { data: stats } = usePaymentStatsQuery()

  const outstanding = stats.expectedRent - stats.collectedThisMonth

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Collected This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            ${stats.collectedThisMonth.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Outstanding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-destructive'>
            ${outstanding.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Collection Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.collectionRate}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Late Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.latePayments}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Status badge component
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variants: Record<PaymentStatus, { className: string; label: string }> = {
    COMPLETED: { className: 'border-green-500 text-green-700', label: 'Completed' },
    PENDING: { className: 'border-yellow-500 text-yellow-700', label: 'Pending' },
    FAILED: { className: 'border-red-500 text-red-700', label: 'Failed' },
    REFUNDED: { className: 'border-blue-500 text-blue-700', label: 'Refunded' },
    PARTIAL: { className: 'border-orange-500 text-orange-700', label: 'Partial' },
    CANCELLED: { className: 'border-gray-500 text-gray-700', label: 'Cancelled' },
  }

  const variant = variants[status] || { className: '', label: status }

  return (
    <Badge variant='outline' className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// Payment form
function RecordPaymentForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: leasesData } = useLeasesQuery({ status: 'ACTIVE' })
  const createPayment = useCreatePayment()

  const form = useForm({
    defaultValues: {
      leaseId: '',
      tenantId: '',
      amount: 0,
      method: 'CHECK' as const,
      type: 'RENT' as const,
      paymentDate: new Date().toISOString().split('T')[0],
      memo: '',
    },
    onSubmit: async ({ value }) => {
      const selectedLease = leasesData.leases.find((l) => l.id === value.leaseId)
      if (!selectedLease) return

      await createPayment.mutateAsync({
        tenantId: selectedLease.tenantId,
        leaseId: value.leaseId,
        amount: value.amount,
        method: value.method,
        type: value.type,
        status: 'COMPLETED',
        paymentDate: new Date(value.paymentDate),
        memo: value.memo || undefined,
      })

      onSuccess?.()
      form.reset()
    },
  })

  // Get tenant info when lease is selected
  const selectedLease = leasesData.leases.find(
    (l) => l.id === form.getFieldValue('leaseId')
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <CardDescription>Quick payment entry</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form.Field name='leaseId'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Tenant / Lease</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select tenant' />
                  </SelectTrigger>
                  <SelectContent>
                    {leasesData.leases.map((lease) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.tenant.firstName} {lease.tenant.lastName} - Unit{' '}
                        {lease.unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {selectedLease && (
            <div className='rounded-lg bg-muted p-3 text-sm'>
              <p className='font-medium'>
                {selectedLease.tenant.firstName} {selectedLease.tenant.lastName}
              </p>
              <p className='text-muted-foreground'>
                Monthly Rent: ${Number(selectedLease.monthlyRent).toLocaleString()}
              </p>
            </div>
          )}

          <form.Field name='amount'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Amount</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                    $
                  </span>
                  <Input
                    type='number'
                    step='0.01'
                    placeholder='0.00'
                    className='pl-7'
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name='method'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Payment Method</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select method' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACH'>ACH / Bank Transfer</SelectItem>
                    <SelectItem value='CHECK'>Check</SelectItem>
                    <SelectItem value='CASH'>Cash</SelectItem>
                    <SelectItem value='CREDIT_CARD'>Credit Card</SelectItem>
                    <SelectItem value='DEBIT_CARD'>Debit Card</SelectItem>
                    <SelectItem value='MONEY_ORDER'>Money Order</SelectItem>
                    <SelectItem value='ONLINE_PORTAL'>Online Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='type'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Allocate To</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select allocation' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='RENT'>Rent</SelectItem>
                    <SelectItem value='LATE_FEE'>Late Fee</SelectItem>
                    <SelectItem value='PET_RENT'>Pet Rent</SelectItem>
                    <SelectItem value='PET_DEPOSIT'>Pet Deposit</SelectItem>
                    <SelectItem value='SECURITY_DEPOSIT'>Security Deposit</SelectItem>
                    <SelectItem value='UTILITY'>Utilities</SelectItem>
                    <SelectItem value='PARKING'>Parking</SelectItem>
                    <SelectItem value='STORAGE'>Storage</SelectItem>
                    <SelectItem value='OTHER'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='paymentDate'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Date</Label>
                <Input
                  type='date'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='memo'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder='Check number, reference, etc.'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <Button
            type='submit'
            className='w-full'
            disabled={createPayment.isPending || !form.getFieldValue('leaseId')}
          >
            {createPayment.isPending ? (
              <LuLoader2 className='mr-2 size-4 animate-spin' />
            ) : (
              <LuCheck className='mr-2 size-4' />
            )}
            Record Payment
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

// Payment list
function PaymentListSection() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data } = usePaymentsQuery({
    ...(statusFilter !== 'all' && { status: statusFilter as PaymentStatus }),
    ...(searchQuery && { search: searchQuery }),
  })

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Payment History</CardTitle>
          <div className='flex gap-2'>
            <div className='relative'>
              <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search...'
                className='w-48 pl-10'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-32'>
                <LuFilter className='mr-2 size-4' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='COMPLETED'>Completed</SelectItem>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='FAILED'>Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.payments.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            <p>No payments found</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {data.payments.map((payment) => (
              <div
                key={payment.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  payment.status === 'PENDING' ? 'border-yellow-300 bg-yellow-50/50' : ''
                }`}
              >
                <div className='flex items-center gap-4'>
                  <div
                    className={`flex size-10 items-center justify-center rounded-full ${
                      payment.status === 'COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}
                  >
                    {payment.status === 'COMPLETED' ? (
                      <LuCheck className='size-5 text-green-600' />
                    ) : (
                      <span className='text-sm font-medium text-yellow-600'>!</span>
                    )}
                  </div>
                  <div>
                    <p className='font-medium'>
                      {payment.tenant.firstName} {payment.tenant.lastName} - Unit{' '}
                      {payment.lease?.unit.unitNumber || 'N/A'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {payment.type}
                      {payment.method && ` - ${payment.method}`}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-medium'>${Number(payment.amount).toLocaleString()}</p>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </span>
                    <PaymentStatusBadge status={payment.status as PaymentStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.total > data.payments.length && (
          <div className='mt-4 text-center'>
            <Button variant='outline'>
              Load More ({data.total - data.payments.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Loading fallback
function PaymentsLoading() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div className='flex-1'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='mt-1 h-4 w-48' />
        </div>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-36' />
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card>
          <CardContent className='space-y-4 py-6'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardContent className='py-10 text-center'>
            <LuLoader2 className='mx-auto size-8 animate-spin' />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PaymentsContent() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/financials'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <Typography.H2>Payments</Typography.H2>
          <Typography.Muted>Rent collection and payment history</Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <Suspense
        fallback={
          <div className='grid gap-4 md:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className='pb-2'>
                  <Skeleton className='h-4 w-24' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-8 w-32' />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <PaymentStatsSection />
      </Suspense>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Record Payment Form */}
        <Suspense
          fallback={
            <Card>
              <CardContent className='py-10 text-center'>
                <LuLoader2 className='mx-auto size-8 animate-spin' />
              </CardContent>
            </Card>
          }
        >
          <RecordPaymentForm />
        </Suspense>

        {/* Payment History */}
        <Suspense
          fallback={
            <Card className='lg:col-span-2'>
              <CardContent className='py-10 text-center'>
                <LuLoader2 className='mx-auto size-8 animate-spin' />
              </CardContent>
            </Card>
          }
        >
          <PaymentListSection />
        </Suspense>
      </div>
    </div>
  )
}

function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsLoading />}>
      <PaymentsContent />
    </Suspense>
  )
}
