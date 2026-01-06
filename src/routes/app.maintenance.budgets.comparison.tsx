'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import { z } from 'zod'
import {
  LuArrowLeft,
  LuArrowDown,
  LuArrowUp,
  LuMinus,
} from 'react-icons/lu'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart'

import {
  useBudgetVsActualQuery,
  budgetVsActualQueryOptions,
} from '~/services/maintenance-budget.query'
import { usePropertiesQuery } from '~/services/properties.query'
import type { BudgetVsActualFilters } from '~/services/maintenance-budget.schema'

const searchSchema = z.object({
  fiscalYear: z.number().optional(),
})

export const Route = createFileRoute('/app/maintenance/budgets/comparison')({
  validateSearch: searchSchema,
  loader: async ({ context, search }) => {
    const currentYear = new Date().getFullYear()
    const fiscalYear = search.fiscalYear ?? currentYear
    await context.queryClient.ensureQueryData(
      budgetVsActualQueryOptions({ fiscalYear, groupBy: 'category' })
    )
  },
  component: BudgetComparisonPage,
})

function ComparisonSkeleton() {
  return (
    <div className='w-full space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <Skeleton className='h-8 w-64' />
      </div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Skeleton className='h-96' />
        <Skeleton className='h-96' />
      </div>
      <Skeleton className='h-64' />
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

const CHART_COLORS = {
  budget: 'hsl(var(--chart-1))',
  actual: 'hsl(var(--chart-2))',
  positive: 'hsl(142 76% 36%)', // green
  negative: 'hsl(0 84% 60%)', // red
}

function ComparisonContent() {
  const search = Route.useSearch()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const [fiscalYear, setFiscalYear] = useState(search.fiscalYear ?? currentYear)
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'category' | 'property' | 'month'>('category')

  const filters: BudgetVsActualFilters = useMemo(
    () => ({
      fiscalYear,
      propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
      groupBy,
    }),
    [fiscalYear, propertyFilter, groupBy]
  )

  const { data: comparisonData } = useBudgetVsActualQuery(filters)
  const { data: properties } = usePropertiesQuery({})

  const chartConfig: ChartConfig = {
    budgetAmount: {
      label: 'Budget',
      color: CHART_COLORS.budget,
    },
    actualSpent: {
      label: 'Actual Spent',
      color: CHART_COLORS.actual,
    },
    cumulativeBudget: {
      label: 'Cumulative Budget',
      color: CHART_COLORS.budget,
    },
    cumulativeSpent: {
      label: 'Cumulative Spent',
      color: CHART_COLORS.actual,
    },
  }

  // Calculate totals
  const totals = useMemo(() => {
    if (!comparisonData?.data) return { budget: 0, actual: 0, variance: 0, variancePercent: 0 }

    const budget = comparisonData.data.reduce((sum: number, item: any) => sum + (item.budgetAmount || 0), 0)
    const actual = comparisonData.data.reduce((sum: number, item: any) => sum + (item.actualSpent || 0), 0)
    const variance = budget - actual
    const variancePercent = budget > 0 ? (variance / budget) * 100 : 0

    return { budget, actual, variance, variancePercent }
  }, [comparisonData])

  return (
    <div className='w-full space-y-6 py-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <Link to='/app/maintenance/budgets'>
            <Button variant='ghost' size='icon'>
              <LuArrowLeft className='size-5' />
            </Button>
          </Link>
          <div>
            <Typography.H2>Budget vs Actual</Typography.H2>
            <Typography.Muted>Compare planned budgets against actual spending</Typography.Muted>
          </div>
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
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='category'>By Category</SelectItem>
              <SelectItem value='property'>By Property</SelectItem>
              <SelectItem value='month'>By Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(totals.budget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(totals.actual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 text-2xl font-bold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.variance >= 0 ? <LuArrowDown className='size-5' /> : <LuArrowUp className='size-5' />}
              {formatCurrency(Math.abs(totals.variance))}
            </div>
            <p className='text-xs text-muted-foreground'>
              {totals.variance >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Variance %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.variancePercent >= 0 ? '+' : ''}{totals.variancePercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {groupBy === 'month' ? (
        // Monthly trend chart
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Cumulative budget vs actual spending throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[400px] w-full'>
              <LineChart data={comparisonData?.data} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='monthLabel'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey='cumulativeBudget'
                  type='monotone'
                  stroke='var(--color-cumulativeBudget)'
                  strokeWidth={2}
                  strokeDasharray='5 5'
                  dot={false}
                />
                <Line
                  dataKey='cumulativeSpent'
                  type='monotone'
                  stroke='var(--color-cumulativeSpent)'
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-cumulativeSpent)', r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        // Bar chart for category/property comparison
        <Card>
          <CardHeader>
            <CardTitle>
              {groupBy === 'category' ? 'By Category' : 'By Property'}
            </CardTitle>
            <CardDescription>Budget vs actual comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[400px] w-full'>
              <BarChart
                data={comparisonData?.data}
                layout='vertical'
                margin={{ left: 20, right: 12 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type='number'
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey={groupBy === 'category' ? 'categoryLabel' : 'propertyName'}
                  type='category'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey='budgetAmount' fill='var(--color-budgetAmount)' radius={[0, 4, 4, 0]} />
                <Bar dataKey='actualSpent' fill='var(--color-actualSpent)' radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Variance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Details</CardTitle>
          <CardDescription>Detailed breakdown of budget vs actual</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {groupBy === 'category' ? 'Category' : groupBy === 'property' ? 'Property' : 'Month'}
                </TableHead>
                <TableHead className='text-right'>Budget</TableHead>
                <TableHead className='text-right'>Actual</TableHead>
                <TableHead className='text-right'>Committed</TableHead>
                <TableHead className='text-right'>Variance ($)</TableHead>
                <TableHead className='text-right'>Variance (%)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData?.data.map((item: any, idx: number) => {
                const label =
                  groupBy === 'category'
                    ? item.categoryLabel
                    : groupBy === 'property'
                      ? item.propertyName
                      : item.monthLabel
                const variance = (item.budgetAmount || 0) - (item.actualSpent || 0)
                const variancePercent =
                  item.budgetAmount > 0
                    ? ((variance / item.budgetAmount) * 100).toFixed(1)
                    : '0.0'

                return (
                  <TableRow key={idx}>
                    <TableCell className='font-medium'>{label}</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.budgetAmount || 0)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.actualSpent || 0)}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground'>
                      {formatCurrency(item.committedAmount || 0)}
                    </TableCell>
                    <TableCell className={`text-right ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </TableCell>
                    <TableCell className={`text-right ${Number(variancePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(variancePercent) >= 0 ? '+' : ''}{variancePercent}%
                    </TableCell>
                    <TableCell>
                      {variance > 0 ? (
                        <Badge className='bg-green-50 text-green-700'>
                          <LuArrowDown className='mr-1 size-3' />
                          Under
                        </Badge>
                      ) : variance < 0 ? (
                        <Badge className='bg-red-50 text-red-700'>
                          <LuArrowUp className='mr-1 size-3' />
                          Over
                        </Badge>
                      ) : (
                        <Badge variant='outline'>
                          <LuMinus className='mr-1 size-3' />
                          On Track
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function BudgetComparisonPage() {
  return (
    <Suspense fallback={<ComparisonSkeleton />}>
      <ComparisonContent />
    </Suspense>
  )
}
