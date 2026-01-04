import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
  LuArrowLeft,
  LuCheck,
  LuDownload,
  LuFilter,
  LuLoaderCircle,
  LuPlus,
  LuSearch,
  LuUpload,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { useExpensesQuery, useExpenseStatsQuery, useExpenseSummaryQuery, useCreateExpense } from '~/services/expenses.query'
import { usePropertiesQuery } from '~/services/properties.query'
import type { ExpenseCategory, ExpenseStatus } from '~/services/expenses.schema'

export const Route = createFileRoute('/app/financials/expenses')({
  component: ExpensesPage,
})

// Category display names
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

// Stats section
function ExpenseStatsSection() {
  const { data: stats } = useExpenseStatsQuery()
  const { data: summary } = useExpenseSummaryQuery({})

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Total Expenses (Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${stats.currentMonth.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>
            {stats.currentMonthCount} transactions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Year to Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${stats.yearToDate.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>
            {stats.monthOverMonthChange !== 0 && (
              <span className={stats.monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'}>
                {stats.monthOverMonthChange > 0 ? '+' : ''}
                {stats.monthOverMonthChange}% vs last month
              </span>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Tax Deductible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            ${summary.taxDeductibleTotal.toLocaleString()}
          </div>
          <p className='text-xs text-muted-foreground'>This month</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Add expense form
function AddExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: propertiesData } = usePropertiesQuery({})
  const createExpense = useCreateExpense()

  const form = useForm({
    defaultValues: {
      propertyId: '',
      category: 'MAINTENANCE' as ExpenseCategory,
      description: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
    onSubmit: async ({ value }) => {
      await createExpense.mutateAsync({
        propertyId: value.propertyId,
        category: value.category,
        description: value.description,
        amount: value.amount,
        expenseDate: new Date(value.expenseDate),
        notes: value.notes || undefined,
        taxDeductible: true,
        status: 'APPROVED',
      })

      onSuccess?.()
      form.reset()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
          <CardDescription>Record a new expense</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form.Field name='description'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Description</Label>
                <Input
                  placeholder='e.g., Plumbing repair'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='category'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as ExpenseCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
                    <SelectItem value='REPAIRS'>Repairs</SelectItem>
                    <SelectItem value='UTILITIES'>Utilities</SelectItem>
                    <SelectItem value='INSURANCE'>Insurance</SelectItem>
                    <SelectItem value='PROPERTY_TAX'>Property Tax</SelectItem>
                    <SelectItem value='MANAGEMENT_FEE'>Management Fee</SelectItem>
                    <SelectItem value='LEGAL'>Legal & Admin</SelectItem>
                    <SelectItem value='LANDSCAPING'>Landscaping</SelectItem>
                    <SelectItem value='CLEANING'>Cleaning</SelectItem>
                    <SelectItem value='CAPITAL_IMPROVEMENT'>Capital Improvement</SelectItem>
                    <SelectItem value='OTHER'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className='grid gap-4 grid-cols-2'>
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

            <form.Field name='expenseDate'>
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
          </div>

          <form.Field name='propertyId'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Property</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select property' />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesData.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='notes'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder='Additional details...'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <Button
            type='submit'
            className='w-full'
            disabled={createExpense.isPending || !form.getFieldValue('propertyId')}
          >
            {createExpense.isPending ? (
              <LuLoaderCircle className='mr-2 size-4 animate-spin' />
            ) : (
              <LuCheck className='mr-2 size-4' />
            )}
            Add Expense
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

// Expense list
function ExpenseListSection() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data } = useExpensesQuery({
    ...(categoryFilter !== 'all' && { category: categoryFilter as ExpenseCategory }),
    ...(searchQuery && { search: searchQuery }),
  })

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Expenses</CardTitle>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-36'>
                <LuFilter className='mr-2 size-4' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
                <SelectItem value='UTILITIES'>Utilities</SelectItem>
                <SelectItem value='INSURANCE'>Insurance</SelectItem>
                <SelectItem value='MANAGEMENT_FEE'>Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.expenses.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            <p>No expenses found</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {data.expenses.map((expense) => (
              <div
                key={expense.id}
                className='flex items-center justify-between rounded-lg border p-4'
              >
                <div>
                  <p className='font-medium'>{expense.description}</p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Badge variant='secondary'>
                      {categoryDisplayNames[expense.category] || expense.category}
                    </Badge>
                    {expense.vendor && (
                      <span className='text-sm text-muted-foreground'>
                        {expense.vendor.companyName || expense.vendor.contactName}
                      </span>
                    )}
                    {expense.maintenanceRequest && (
                      <Badge variant='outline'>
                        WO #{expense.maintenanceRequest.requestNumber}
                      </Badge>
                    )}
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {expense.property.name}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-medium'>${Number(expense.amount).toLocaleString()}</p>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.total > data.expenses.length && (
          <div className='mt-4 text-center'>
            <Button variant='outline'>
              Load More ({data.total - data.expenses.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Category summary
function CategorySummarySection() {
  const { data: summary } = useExpenseSummaryQuery({})

  if (summary.byCategory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>No expenses this month</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 md:grid-cols-5'>
          {summary.byCategory.map((category) => (
            <div key={category.category} className='rounded-lg border p-4'>
              <p className='text-sm font-medium'>
                {categoryDisplayNames[category.category] || category.category}
              </p>
              <p className='mt-1 text-xl font-bold'>${category.total.toLocaleString()}</p>
              <p className='text-sm text-muted-foreground'>
                {category.count} {category.count === 1 ? 'expense' : 'expenses'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading fallback
function ExpensesLoading() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div className='flex-1'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='mt-1 h-4 w-48' />
        </div>
        <Skeleton className='h-10 w-24' />
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {[...Array(3)].map((_, i) => (
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
            <LuLoaderCircle className='mx-auto size-8 animate-spin' />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ExpensesContent() {
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
          <Typography.H2>Expenses</Typography.H2>
          <Typography.Muted>Track and categorize property expenses</Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Suspense
        fallback={
          <div className='grid gap-4 md:grid-cols-3'>
            {[...Array(3)].map((_, i) => (
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
        <ExpenseStatsSection />
      </Suspense>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Add Expense Form */}
        <Suspense
          fallback={
            <Card>
              <CardContent className='py-10 text-center'>
                <LuLoaderCircle className='mx-auto size-8 animate-spin' />
              </CardContent>
            </Card>
          }
        >
          <AddExpenseForm />
        </Suspense>

        {/* Expense List */}
        <Suspense
          fallback={
            <Card className='lg:col-span-2'>
              <CardContent className='py-10 text-center'>
                <LuLoaderCircle className='mx-auto size-8 animate-spin' />
              </CardContent>
            </Card>
          }
        >
          <ExpenseListSection />
        </Suspense>
      </div>

      {/* Category Breakdown */}
      <Suspense
        fallback={
          <Card>
            <CardContent className='py-10 text-center'>
              <LuLoaderCircle className='mx-auto size-8 animate-spin' />
            </CardContent>
          </Card>
        }
      >
        <CategorySummarySection />
      </Suspense>
    </div>
  )
}

function ExpensesPage() {
  return (
    <Suspense fallback={<ExpensesLoading />}>
      <ExpensesContent />
    </Suspense>
  )
}
