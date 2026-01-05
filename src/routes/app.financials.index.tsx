import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LuCircleAlert, LuArrowDownLeft, LuArrowUpRight, LuDownload, LuTrendingUp, LuTrendingDown, LuLoaderCircle } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { usePaymentStatsQuery, useRentRollQuery, usePaymentsQuery } from '~/services/payments.query'
import { useExpenseSummaryQuery, useExpenseStatsQuery } from '~/services/expenses.query'
import { useDepositStatsQuery } from '~/services/security-deposits.query'

export const Route = createFileRoute('/app/financials/')({
  component: FinancialsDashboardPage,
})

// Loading skeleton for stats cards
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <Skeleton className='h-4 w-24' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='mt-1 h-3 w-20' />
      </CardContent>
    </Card>
  )
}

// Payment Stats Section
function PaymentStatsSection() {
  const { data: stats } = usePaymentStatsQuery()

  const outstanding = stats.expectedRent - stats.collectedThisMonth

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Expected Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${stats.expectedRent.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>From active leases</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Collected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            ${stats.collectedThisMonth.toLocaleString()}
          </div>
          <p className='text-xs text-muted-foreground'>{stats.collectionRate}% collection rate</p>
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
          <p className='text-xs text-muted-foreground'>
            {stats.latePayments} {stats.latePayments === 1 ? 'tenant' : 'tenants'} past due
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Delinquent Tenants Section
function DelinquentTenantsSection() {
  const { data: rentRoll } = useRentRollQuery()

  // Filter to only unpaid/partial tenants
  const delinquentTenants = rentRoll
    .filter((item) => item.status !== 'PAID' && item.balance > 0)
    .map((item) => ({
      tenantId: item.lease.tenant.id,
      name: `${item.lease.tenant.firstName} ${item.lease.tenant.lastName}`,
      unit: item.lease.unit.unitNumber,
      property: item.lease.unit.property.name,
      amount: item.balance,
      // Calculate days past due (simplified - assumes rent due on 1st)
      daysPastDue: Math.max(0, new Date().getDate() - 1),
    }))

  if (delinquentTenants.length === 0) {
    return null
  }

  return (
    <Card className='border-destructive/50'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <LuCircleAlert className='size-5 text-destructive' />
          <CardTitle>Action Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {delinquentTenants.map((tenant) => (
          <div key={tenant.tenantId} className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>
                Unit {tenant.unit} - {tenant.name}
              </p>
              <p className='text-sm text-muted-foreground'>
                ${tenant.amount.toLocaleString()} past due
                {tenant.daysPastDue > 0 && ` (${tenant.daysPastDue} days)`}
              </p>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' asChild>
                <Link to='/app/communications'>Send Reminder</Link>
              </Button>
              <Button size='sm' asChild>
                <Link to='/app/financials/payments'>Record Payment</Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Expense Summary Section
function ExpenseSummarySection() {
  const { data: summary } = useExpenseSummaryQuery({})
  const { data: stats } = useExpenseStatsQuery()

  // Map category names to display names
  const categoryDisplayNames: Record<string, string> = {
    MAINTENANCE: 'Maintenance',
    REPAIRS: 'Repairs',
    UTILITIES: 'Utilities',
    INSURANCE: 'Insurance',
    PROPERTY_TAX: 'Property Tax',
    MORTGAGE: 'Mortgage',
    HOA_FEES: 'HOA Fees',
    MANAGEMENT_FEE: 'Management',
    LEGAL: 'Legal & Admin',
    ADVERTISING: 'Advertising',
    SUPPLIES: 'Supplies',
    LANDSCAPING: 'Landscaping',
    CLEANING: 'Cleaning',
    PEST_CONTROL: 'Pest Control',
    CAPITAL_IMPROVEMENT: 'Capital Improvement',
    OTHER: 'Other',
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Expense Summary</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} breakdown
            </CardDescription>
          </div>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/app/financials/expenses'>View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {summary.byCategory.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No expenses this month</p>
          ) : (
            summary.byCategory.slice(0, 5).map((category) => (
              <div key={category.category} className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {categoryDisplayNames[category.category] || category.category}
                    </span>
                    <span className='text-sm font-medium'>${category.total.toLocaleString()}</span>
                  </div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {category.count} {category.count === 1 ? 'transaction' : 'transactions'}
                  </div>
                </div>
              </div>
            ))
          )}
          <Separator />
          <div className='flex items-center justify-between font-medium'>
            <span>Total Expenses</span>
            <span>${summary.totalExpenses.toLocaleString()}</span>
          </div>
          {stats.monthOverMonthChange !== 0 && (
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              {stats.monthOverMonthChange > 0 ? (
                <LuTrendingUp className='size-3 text-red-500' />
              ) : (
                <LuTrendingDown className='size-3 text-green-500' />
              )}
              {stats.monthOverMonthChange > 0 ? '+' : ''}
              {stats.monthOverMonthChange}% vs last month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Transactions Section
function RecentTransactionsSection() {
  const { data: paymentsData } = usePaymentsQuery({ limit: 5 })

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Payments</CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/app/financials/payments'>View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {paymentsData.payments.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No recent payments</p>
          ) : (
            paymentsData.payments.map((payment) => (
              <div key={payment.id} className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-8 items-center justify-center rounded-full bg-green-100'>
                    <LuArrowDownLeft className='size-4 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>
                      {payment.type === 'RENT' ? 'Rent' : payment.type} - Unit{' '}
                      {payment.lease?.unit.unitNumber || 'N/A'} {payment.tenant.firstName}{' '}
                      {payment.tenant.lastName}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <span className='font-medium text-green-600'>
                    +${Number(payment.amount).toLocaleString()}
                  </span>
                  <p className='text-xs text-muted-foreground'>
                    <Badge variant='outline' className='text-xs'>
                      {payment.status}
                    </Badge>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Security Deposits Section
function SecurityDepositsSection() {
  const { data: stats } = useDepositStatsQuery()

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Security Deposits</CardTitle>
            <CardDescription>
              Total: ${stats.totalDepositsHeld.toLocaleString()} held in escrow
            </CardDescription>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link to='/app/financials/deposits'>View Deposit Ledger</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='rounded-lg bg-muted p-4'>
            <p className='text-sm text-muted-foreground'>Interest Accrued</p>
            <p className='text-xl font-bold'>${stats.totalInterestAccrued.toLocaleString()}</p>
            <p className='text-xs text-muted-foreground'>@ 1.0% annually (MN)</p>
          </div>
          <div className='rounded-lg bg-muted p-4'>
            <p className='text-sm text-muted-foreground'>Active Deposits</p>
            <p className='text-xl font-bold'>{stats.activeDepositsCount}</p>
            <p className='text-xs text-muted-foreground'>Current tenants</p>
          </div>
          {(stats.pendingDispositions > 0 || stats.interestDueSoon > 0) ? (
            <div className='rounded-lg bg-yellow-50 p-4'>
              <p className='text-sm text-yellow-800'>Action Required</p>
              <p className='text-xl font-bold text-yellow-800'>
                {stats.pendingDispositions + stats.interestDueSoon}
              </p>
              <p className='text-xs text-yellow-700'>
                {stats.pendingDispositions > 0 && `${stats.pendingDispositions} disposition(s) pending`}
                {stats.pendingDispositions > 0 && stats.interestDueSoon > 0 && ', '}
                {stats.interestDueSoon > 0 && `${stats.interestDueSoon} interest payment(s) due`}
              </p>
            </div>
          ) : (
            <div className='rounded-lg bg-green-50 p-4'>
              <p className='text-sm text-green-800'>All Current</p>
              <p className='text-xl font-bold text-green-800'>No action needed</p>
              <p className='text-xs text-green-700'>MN Statute 504B.178 compliant</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading fallback
function DashboardLoading() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='mt-1 h-4 w-32' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-36' />
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FinancialsDashboardContent() {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Financial Dashboard</Typography.H2>
          <Typography.Muted>{currentMonth} Overview</Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Export Report
          </Button>
          <Button asChild>
            <Link to='/app/financials/payments'>Record Payment</Link>
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <Suspense fallback={
        <div className='grid gap-4 md:grid-cols-3'>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      }>
        <PaymentStatsSection />
      </Suspense>

      {/* Past Due Alert */}
      <Suspense fallback={null}>
        <DelinquentTenantsSection />
      </Suspense>

      {/* Main Content Grid */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Expense Summary */}
        <Suspense fallback={<Card><CardContent className='py-10 text-center'><LuLoaderCircle className='mx-auto size-6 animate-spin' /></CardContent></Card>}>
          <ExpenseSummarySection />
        </Suspense>

        {/* Recent Transactions */}
        <Suspense fallback={<Card><CardContent className='py-10 text-center'><LuLoaderCircle className='mx-auto size-6 animate-spin' /></CardContent></Card>}>
          <RecentTransactionsSection />
        </Suspense>
      </div>

      {/* Security Deposits */}
      <Suspense fallback={<Card><CardContent className='py-10 text-center'><LuLoaderCircle className='mx-auto size-6 animate-spin' /></CardContent></Card>}>
        <SecurityDepositsSection />
      </Suspense>
    </div>
  )
}

function FinancialsDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <FinancialsDashboardContent />
    </Suspense>
  )
}
