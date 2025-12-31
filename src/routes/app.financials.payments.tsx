import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuCheck, LuDownload, LuFilter, LuPlus, LuSearch } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/financials/payments')({
  component: PaymentsPage,
})

// Mock data
const payments = [
  {
    id: '1',
    tenant: 'James Parker',
    unit: '305',
    property: 'Humboldt Court',
    amount: 1425,
    type: 'Rent + Pet',
    method: 'ACH',
    date: '2024-12-31',
    status: 'completed',
  },
  {
    id: '2',
    tenant: 'David Kim',
    unit: '402',
    property: 'Humboldt Court',
    amount: 1500,
    type: 'Rent',
    method: 'Check #1234',
    date: '2024-12-30',
    status: 'completed',
  },
  {
    id: '3',
    tenant: 'Sarah Johnson',
    unit: '101',
    property: 'Humboldt Court',
    amount: 1300,
    type: 'Rent + Pet',
    method: 'ACH',
    date: '2024-12-28',
    status: 'completed',
  },
  {
    id: '4',
    tenant: 'Emily Rodriguez',
    unit: '204',
    property: 'Humboldt Court',
    amount: 1375,
    type: 'Rent',
    method: '',
    date: '',
    status: 'pending',
    daysOverdue: 5,
  },
]

function PaymentsPage() {
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
          <Button>
            <LuPlus className='mr-2 size-4' />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Collected This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>$42,350</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>$2,650</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94.1%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Late Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1</div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Record Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Quick payment entry</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Tenant</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select tenant' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>Sarah Johnson - Unit 101</SelectItem>
                  <SelectItem value='2'>Mike Chen - Unit 102</SelectItem>
                  <SelectItem value='3'>Emily Rodriguez - Unit 204</SelectItem>
                  <SelectItem value='4'>James Parker - Unit 305</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Amount</Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                <Input type='number' placeholder='0.00' className='pl-7' />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ach'>ACH / Bank Transfer</SelectItem>
                  <SelectItem value='check'>Check</SelectItem>
                  <SelectItem value='cash'>Cash</SelectItem>
                  <SelectItem value='card'>Credit/Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Date</Label>
              <Input type='date' />
            </div>
            <div className='space-y-2'>
              <Label>Allocate To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select allocation' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='rent'>Rent</SelectItem>
                  <SelectItem value='rent-pet'>Rent + Pet Rent</SelectItem>
                  <SelectItem value='late-fee'>Late Fee</SelectItem>
                  <SelectItem value='deposit'>Security Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className='w-full'>
              <LuCheck className='mr-2 size-4' />
              Record Payment
            </Button>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Payment History</CardTitle>
              <div className='flex gap-2'>
                <div className='relative'>
                  <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input placeholder='Search...' className='pl-10 w-48' />
                </div>
                <Button variant='outline' size='icon'>
                  <LuFilter className='size-4' />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {payments.map(payment => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    payment.status === 'pending' ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {payment.status === 'completed' ? (
                        <LuCheck className='size-5 text-green-600' />
                      ) : (
                        <span className='text-sm font-medium text-red-600'>!</span>
                      )}
                    </div>
                    <div>
                      <p className='font-medium'>
                        {payment.tenant} - Unit {payment.unit}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {payment.type}
                        {payment.method && ` • ${payment.method}`}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>${payment.amount.toLocaleString()}</p>
                    {payment.status === 'completed' ? (
                      <p className='text-sm text-muted-foreground'>
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    ) : (
                      <Badge variant='destructive'>{payment.daysOverdue} days overdue</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
