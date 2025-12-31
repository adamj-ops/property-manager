import { createFileRoute } from '@tanstack/react-router'
import { LuCircleAlert, LuArrowDownLeft, LuArrowUpRight, LuDollarSign, LuDownload, LuTrendingUp } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/financials/')({
  component: FinancialsDashboardPage,
})

// Mock data
const monthlyData = {
  expectedRevenue: 45000,
  collectedRevenue: 42350,
  outstanding: 2650,
  expenses: 12340,
  netOperatingIncome: 30010,
}

const pastDueTenants = [
  { name: 'Emily Rodriguez', unit: '204', amount: 1410, daysPastDue: 5 },
]

const expenseCategories = [
  { name: 'Maintenance', amount: 2840, percentOfRevenue: 6.3, vsBudget: -12 },
  { name: 'Property Management', amount: 3600, percentOfRevenue: 8.0, vsBudget: 0 },
  { name: 'Utilities', amount: 1250, percentOfRevenue: 2.8, vsBudget: 5 },
  { name: 'Taxes & Insurance', amount: 4200, percentOfRevenue: 9.3, vsBudget: 0 },
  { name: 'Legal & Admin', amount: 450, percentOfRevenue: 1.0, vsBudget: -25 },
]

const recentTransactions = [
  { type: 'income', description: 'Rent - Unit 305 James Parker', amount: 1425, date: '2024-12-31' },
  { type: 'income', description: 'Rent - Unit 402 David Kim', amount: 1500, date: '2024-12-30' },
  { type: 'expense', description: 'Plumbing repair - Unit 210', amount: 285, date: '2024-12-29' },
  { type: 'income', description: 'Rent - Unit 101 Sarah Johnson', amount: 1300, date: '2024-12-28' },
  { type: 'expense', description: 'HVAC service call', amount: 150, date: '2024-12-27' },
]

function FinancialsDashboardPage() {
  const collectionRate = Math.round((monthlyData.collectedRevenue / monthlyData.expectedRevenue) * 100)

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Financial Dashboard</Typography.H2>
          <Typography.Muted>December 2024 Overview</Typography.Muted>
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
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${monthlyData.expectedRevenue.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground flex items-center gap-1'>
              <LuTrendingUp className='size-3 text-green-500' />
              +12% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              ${monthlyData.collectedRevenue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>{collectionRate}% collection rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>
              ${monthlyData.outstanding.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>1 tenant past due</p>
          </CardContent>
        </Card>
      </div>

      {/* Past Due Alert */}
      {pastDueTenants.length > 0 && (
        <Card className='border-destructive/50'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <LuCircleAlert className='size-5 text-destructive' />
              <CardTitle>Action Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pastDueTenants.map(tenant => (
              <div key={tenant.unit} className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>
                    Unit {tenant.unit} - {tenant.name}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    ${tenant.amount.toLocaleString()} past due ({tenant.daysPastDue} days)
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link to='/app/communications'>Send Reminder</Link>
                  </Button>
                  <Button variant='outline' size='sm'>
                    Late Notice
                  </Button>
                  <Button size='sm' asChild>
                    <Link to='/app/financials/payments'>Record Payment</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Expense Summary */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Expense Summary</CardTitle>
                <CardDescription>December 2024 breakdown</CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/financials/expenses'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {expenseCategories.map(category => (
                <div key={category.name} className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>{category.name}</span>
                      <span className='text-sm font-medium'>${category.amount.toLocaleString()}</span>
                    </div>
                    <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>{category.percentOfRevenue}% of revenue</span>
                      {category.vsBudget !== 0 && (
                        <Badge
                          variant='outline'
                          className={
                            category.vsBudget < 0
                              ? 'border-green-500 text-green-700'
                              : 'border-orange-500 text-orange-700'
                          }
                        >
                          {category.vsBudget > 0 ? '+' : ''}
                          {category.vsBudget}% vs budget
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className='flex items-center justify-between font-medium'>
                <span>Total Expenses</span>
                <span>${monthlyData.expenses.toLocaleString()}</span>
              </div>
              <div className='flex items-center justify-between font-medium text-green-600'>
                <span>Net Operating Income</span>
                <span>${monthlyData.netOperatingIncome.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/financials/payments'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentTransactions.map((transaction, i) => (
                <div key={i} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <LuArrowDownLeft className='size-4 text-green-600' />
                      ) : (
                        <LuArrowUpRight className='size-4 text-red-600' />
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium'>{transaction.description}</p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Deposits */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Security Deposits</CardTitle>
              <CardDescription>Total: $52,500 held in escrow</CardDescription>
            </div>
            <Button variant='outline' size='sm'>
              View Deposit Ledger
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg bg-muted p-4'>
              <p className='text-sm text-muted-foreground'>Interest Accrued (2024)</p>
              <p className='text-xl font-bold'>$525.00</p>
              <p className='text-xs text-muted-foreground'>@ 1.0% annually</p>
            </div>
            <div className='rounded-lg bg-muted p-4'>
              <p className='text-sm text-muted-foreground'>Next Interest Payment Due</p>
              <p className='text-xl font-bold'>Jan 31, 2025</p>
              <p className='text-xs text-muted-foreground'>MN Statute 504B.178</p>
            </div>
            <div className='rounded-lg bg-yellow-50 p-4'>
              <p className='text-sm text-yellow-800'>Action Required</p>
              <p className='text-xl font-bold text-yellow-800'>3 deposits</p>
              <p className='text-xs text-yellow-700'>Interest payment due soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
