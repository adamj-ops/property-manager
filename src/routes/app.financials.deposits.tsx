import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  LuArrowLeft,
  LuCircleAlert,
  LuCheck,
  LuClock,
  LuDollarSign,
  LuDownload,
  LuFilter,
  LuLoader2,
  LuPercent,
  LuSearch,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { useDepositsQuery, useDepositStatsQuery } from '~/services/security-deposits.query'
import type { DepositStatus } from '~/services/security-deposits.schema'

export const Route = createFileRoute('/app/financials/deposits')({
  component: DepositsPage,
})

// Stats cards
function DepositStatsSection() {
  const { data: stats } = useDepositStatsQuery()

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Total Held</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${stats.totalDepositsHeld.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>
            {stats.activeDepositsCount} active deposits
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Interest Accrued</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>
            ${stats.totalInterestAccrued.toLocaleString()}
          </div>
          <p className='text-xs text-muted-foreground'>@ 1% annual (MN Statute)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Pending Disposition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.pendingDispositions > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {stats.pendingDispositions}
          </div>
          <p className='text-xs text-muted-foreground'>
            {stats.pendingDispositions > 0 ? 'Action required' : 'All current'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Interest Due Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.interestDueSoon > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {stats.interestDueSoon}
          </div>
          <p className='text-xs text-muted-foreground'>Within 30 days</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Get status badge
function StatusBadge({ status }: { status: DepositStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant='outline' className='border-green-500 text-green-700'>Active</Badge>
    case 'PENDING_DISPOSITION':
      return <Badge variant='outline' className='border-yellow-500 text-yellow-700'>Pending Disposition</Badge>
    case 'DISPOSED':
      return <Badge variant='outline' className='border-blue-500 text-blue-700'>Disposed</Badge>
    case 'REFUNDED':
      return <Badge variant='outline' className='border-gray-500 text-gray-700'>Refunded</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

// Deposit list
function DepositListSection() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data } = useDepositsQuery({
    ...(statusFilter !== 'all' && { status: statusFilter as DepositStatus }),
  })

  // Client-side search filtering
  const filteredDeposits = data.deposits.filter((deposit) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      deposit.tenantName.toLowerCase().includes(query) ||
      deposit.unitNumber.toLowerCase().includes(query) ||
      deposit.propertyName.toLowerCase().includes(query)
    )
  })

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Security Deposits</CardTitle>
            <CardDescription>
              Manage deposits and track interest (MN Statute 504B.178 compliant)
            </CardDescription>
          </div>
          <div className='flex gap-2'>
            <div className='relative'>
              <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search tenant or unit...'
                className='w-64 pl-10'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-40'>
                <LuFilter className='mr-2 size-4' />
                <SelectValue placeholder='Filter status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='ACTIVE'>Active</SelectItem>
                <SelectItem value='PENDING_DISPOSITION'>Pending Disposition</SelectItem>
                <SelectItem value='DISPOSED'>Disposed</SelectItem>
                <SelectItem value='REFUNDED'>Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDeposits.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            <LuDollarSign className='mx-auto size-8 opacity-50' />
            <p className='mt-2'>No security deposits found</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredDeposits.map((deposit) => (
              <div
                key={deposit.leaseId}
                className={`rounded-lg border p-4 ${
                  deposit.status === 'PENDING_DISPOSITION' ? 'border-yellow-300 bg-yellow-50/50' : ''
                }`}
              >
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>{deposit.tenantName}</p>
                      <StatusBadge status={deposit.status} />
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Unit {deposit.unitNumber} - {deposit.propertyName}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold'>${deposit.depositAmount.toLocaleString()}</p>
                    <p className='text-xs text-muted-foreground'>
                      Held {deposit.daysHeld} days
                    </p>
                  </div>
                </div>

                <div className='mt-4 grid gap-4 md:grid-cols-4'>
                  <div className='rounded bg-muted p-2'>
                    <p className='text-xs text-muted-foreground'>Interest Accrued</p>
                    <p className='font-medium text-blue-600'>
                      ${deposit.interestAccrued.toLocaleString()}
                    </p>
                  </div>
                  <div className='rounded bg-muted p-2'>
                    <p className='text-xs text-muted-foreground'>Interest Owed</p>
                    <p className='font-medium'>
                      ${deposit.interestOwed.toLocaleString()}
                    </p>
                  </div>
                  <div className='rounded bg-muted p-2'>
                    <p className='text-xs text-muted-foreground'>Rate</p>
                    <p className='font-medium'>{(deposit.interestRate * 100).toFixed(1)}% / year</p>
                  </div>
                  <div className='rounded bg-muted p-2'>
                    <p className='text-xs text-muted-foreground'>
                      {deposit.status === 'PENDING_DISPOSITION' ? 'Disposition Due' : 'Deposit Date'}
                    </p>
                    <p className='font-medium'>
                      {deposit.status === 'PENDING_DISPOSITION' && deposit.dispositionDueDate ? (
                        <span className={
                          new Date(deposit.dispositionDueDate) < new Date()
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }>
                          {new Date(deposit.dispositionDueDate).toLocaleDateString()}
                        </span>
                      ) : deposit.depositPaidDate ? (
                        new Date(deposit.depositPaidDate).toLocaleDateString()
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </div>
                </div>

                {deposit.status === 'PENDING_DISPOSITION' && (
                  <div className='mt-4 flex items-center justify-between rounded-lg bg-yellow-100 p-3'>
                    <div className='flex items-center gap-2'>
                      <LuCircleAlert className='size-4 text-yellow-700' />
                      <span className='text-sm text-yellow-800'>
                        Disposition required within 21 days of move-out (MN law)
                      </span>
                    </div>
                    <Button size='sm' variant='outline'>
                      Create Disposition
                    </Button>
                  </div>
                )}

                {deposit.status === 'ACTIVE' && deposit.interestOwed > 10 && (
                  <div className='mt-4 flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Interest payment recommended
                    </span>
                    <Button size='sm' variant='outline'>
                      Record Interest Payment
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// MN Compliance Info Card
function ComplianceInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuPercent className='size-5' />
          Minnesota Security Deposit Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4 text-sm'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-blue-100 p-1'>
              <LuPercent className='size-3 text-blue-600' />
            </div>
            <div>
              <p className='font-medium'>1% Annual Simple Interest</p>
              <p className='text-muted-foreground'>
                Interest must be calculated and paid annually or at lease termination
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-yellow-100 p-1'>
              <LuClock className='size-3 text-yellow-600' />
            </div>
            <div>
              <p className='font-medium'>21-Day Disposition Deadline</p>
              <p className='text-muted-foreground'>
                After tenant moves out, you have 21 days to return deposit or send itemized deductions
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-green-100 p-1'>
              <LuCheck className='size-3 text-green-600' />
            </div>
            <div>
              <p className='font-medium'>Itemized Deductions Required</p>
              <p className='text-muted-foreground'>
                Any deductions must be itemized in writing with specific amounts
              </p>
            </div>
          </div>
        </div>
        <div className='mt-4 rounded-lg bg-muted p-3'>
          <p className='text-xs text-muted-foreground'>
            Reference: Minnesota Statute 504B.178
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton
function DepositsLoading() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='mt-1 h-4 w-64' />
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-32' />
              <Skeleton className='mt-1 h-3 w-20' />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className='py-10 text-center'>
          <LuLoader2 className='mx-auto size-8 animate-spin' />
        </CardContent>
      </Card>
    </div>
  )
}

function DepositsContent() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/financials'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <Typography.H2>Security Deposits</Typography.H2>
          <Typography.Muted>
            Track deposits, interest accrual, and dispositions
          </Typography.Muted>
        </div>
        <Button variant='outline'>
          <LuDownload className='mr-2 size-4' />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <Suspense fallback={
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
      }>
        <DepositStatsSection />
      </Suspense>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Deposit List */}
        <div className='lg:col-span-2'>
          <Suspense fallback={
            <Card>
              <CardContent className='py-10 text-center'>
                <LuLoader2 className='mx-auto size-8 animate-spin' />
              </CardContent>
            </Card>
          }>
            <DepositListSection />
          </Suspense>
        </div>

        {/* Compliance Info */}
        <div>
          <ComplianceInfoCard />
        </div>
      </div>
    </div>
  )
}

function DepositsPage() {
  return (
    <Suspense fallback={<DepositsLoading />}>
      <DepositsContent />
    </Suspense>
  )
}
