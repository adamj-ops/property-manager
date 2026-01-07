'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  LuAlertCircle,
  LuAlertTriangle,
  LuCheckCircle,
  LuDollarSign,
  LuPlus,
  LuPieChart,
  LuTrendingDown,
  LuTrendingUp,
  LuXCircle,
} from 'react-icons/lu'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { Progress } from '~/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'

import {
  useBudgetsQuery,
  useBudgetHealthQuery,
  budgetsQueryOptions,
  budgetHealthQueryOptions,
} from '~/services/maintenance-budget.query'
import { usePropertiesQuery } from '~/services/properties.query'
import type { BudgetFilters } from '~/services/maintenance-budget.schema'
import { BudgetForm } from '~/components/maintenance/BudgetForm'

export const Route = createFileRoute('/app/maintenance/budgets')({
  loader: async ({ context }) => {
    const currentYear = new Date().getFullYear()
    const defaultFilters: BudgetFilters = {
      fiscalYear: currentYear,
      isActive: true,
      limit: 50,
      offset: 0,
    }
    await Promise.all([
      context.queryClient.ensureQueryData(budgetsQueryOptions(defaultFilters)),
      context.queryClient.ensureQueryData(budgetHealthQueryOptions({ fiscalYear: currentYear })),
    ])
  },
  component: BudgetsPage,
})

function BudgetsSkeleton() {
  return (
    <div className='w-full space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-32' />
        ))}
      </div>
      <Skeleton className='h-96' />
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50'
    case 'critical':
      return 'text-orange-600 bg-orange-50'
    case 'exceeded':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

function getProgressColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'critical':
      return 'bg-orange-500'
    case 'exceeded':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'healthy':
      return <LuCheckCircle className='size-4 text-green-600' />
    case 'warning':
      return <LuAlertTriangle className='size-4 text-yellow-600' />
    case 'critical':
      return <LuAlertCircle className='size-4 text-orange-600' />
    case 'exceeded':
      return <LuXCircle className='size-4 text-red-600' />
    default:
      return null
  }
}

function BudgetsContent() {
  const currentYear = new Date().getFullYear()
  const [fiscalYear, setFiscalYear] = useState<number>(currentYear)
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filters: BudgetFilters = useMemo(
    () => ({
      fiscalYear,
      propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
      isActive: showInactive ? undefined : true,
      limit: 50,
      offset: 0,
    }),
    [fiscalYear, propertyFilter, showInactive]
  )

  const { data: budgetsData } = useBudgetsQuery(filters)
  const { data: health } = useBudgetHealthQuery({ fiscalYear, propertyId: propertyFilter !== 'all' ? propertyFilter : undefined })
  const { data: properties } = usePropertiesQuery({})

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className='w-full space-y-6 py-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Typography.H2>Maintenance Budgets</Typography.H2>
          <Typography.Muted>Set and track budgets by property and category</Typography.Muted>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All Properties' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Properties</SelectItem>
              {properties?.properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(fiscalYear)} onValueChange={(v) => setFiscalYear(Number(v))}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button>
                <LuPlus className='mr-2 size-4' />
                Create Budget
              </Button>
            </SheetTrigger>
            <SheetContent className='sm:max-w-lg'>
              <SheetHeader>
                <SheetTitle>Create Budget</SheetTitle>
                <SheetDescription>
                  Set a maintenance budget for a specific property and category.
                </SheetDescription>
              </SheetHeader>
              <div className='mt-6'>
                <BudgetForm
                  onSuccess={() => setIsCreateOpen(false)}
                  defaultFiscalYear={fiscalYear}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Health Summary Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Budgeted</CardTitle>
            <LuDollarSign className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(health.totalBudgeted)}</div>
            <p className='text-xs text-muted-foreground'>
              for {health.budgetCounts.total} budget{health.budgetCounts.total !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Spent</CardTitle>
            {health.overallSpentPercent > 80 ? (
              <LuTrendingUp className='size-4 text-orange-500' />
            ) : (
              <LuTrendingDown className='size-4 text-green-500' />
            )}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(health.totalSpent)}</div>
            <div className='mt-2'>
              <Progress
                value={Math.min(health.overallSpentPercent, 100)}
                className='h-2'
              />
              <p className='mt-1 text-xs text-muted-foreground'>
                {health.overallSpentPercent.toFixed(1)}% of budget used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Remaining</CardTitle>
            <LuPieChart className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${health.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(health.totalRemaining)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {health.totalCommitted > 0 && (
                <>+ {formatCurrency(health.totalCommitted)} committed</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Budget Status</CardTitle>
            <LuAlertCircle className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline' className='bg-green-50 text-green-700'>
                {health.budgetCounts.healthy} Healthy
              </Badge>
              {health.budgetCounts.warning > 0 && (
                <Badge variant='outline' className='bg-yellow-50 text-yellow-700'>
                  {health.budgetCounts.warning} Warning
                </Badge>
              )}
              {health.budgetCounts.critical > 0 && (
                <Badge variant='outline' className='bg-orange-50 text-orange-700'>
                  {health.budgetCounts.critical} Critical
                </Badge>
              )}
              {health.budgetCounts.exceeded > 0 && (
                <Badge variant='outline' className='bg-red-50 text-red-700'>
                  {health.budgetCounts.exceeded} Exceeded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories at Risk Alert */}
      {health.categoriesAtRisk.length > 0 && (
        <Card className='border-orange-200 bg-orange-50'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <LuAlertTriangle className='size-5 text-orange-600' />
              <CardTitle className='text-base text-orange-800'>Categories Needing Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              {health.categoriesAtRisk.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm'
                >
                  <StatusIcon status={item.status} />
                  <div>
                    <span className='text-sm font-medium'>{item.category}</span>
                    <span className='text-xs text-muted-foreground'> • {item.propertyName}</span>
                  </div>
                  <Badge variant='outline' className={getStatusColor(item.status)}>
                    {item.spentPercent.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget List Table */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>
                {budgetsData.total} budget{budgetsData.total !== 1 ? 's' : ''} for {fiscalYear}
              </CardDescription>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgetsData.budgets.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <LuDollarSign className='mb-4 size-12 text-muted-foreground/50' />
              <Typography.H4>No budgets found</Typography.H4>
              <Typography.Muted className='mb-4'>
                Create your first budget to start tracking maintenance expenses.
              </Typography.Muted>
              <Button onClick={() => setIsCreateOpen(true)}>
                <LuPlus className='mr-2 size-4' />
                Create Budget
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className='text-right'>Budget</TableHead>
                  <TableHead className='text-right'>Spent</TableHead>
                  <TableHead className='w-[200px]'>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetsData.budgets.map((budget) => (
                  <TableRow
                    key={budget.id}
                    className='cursor-pointer hover:bg-muted/50'
                  >
                    <TableCell>
                      <Link
                        to='/app/maintenance/budgets/$budgetId'
                        params={{ budgetId: budget.id }}
                        className='font-medium hover:underline'
                      >
                        {budget.property.name}
                      </Link>
                    </TableCell>
                    <TableCell>{budget.categoryLabel}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {budget.period.charAt(0) + budget.period.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      {formatCurrency(budget.budgetAmount)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(budget.spentAmount)}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                          <div
                            className={`h-full transition-all ${getProgressColor(budget.status)}`}
                            style={{ width: `${Math.min(budget.spentPercent, 100)}%` }}
                          />
                        </div>
                        <span className='w-12 text-right text-xs text-muted-foreground'>
                          {budget.spentPercent.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(budget.status)}>
                        <StatusIcon status={budget.status} />
                        <span className='ml-1 capitalize'>{budget.status}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Link to Comparison View */}
      <div className='flex justify-center'>
        <Link
          to='/app/maintenance/budgets/comparison'
          search={{ fiscalYear }}
          className='text-sm text-muted-foreground hover:text-foreground hover:underline'
        >
          View Budget vs Actual Comparison →
        </Link>
      </div>
    </div>
  )
}

function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsSkeleton />}>
      <BudgetsContent />
    </Suspense>
  )
}
