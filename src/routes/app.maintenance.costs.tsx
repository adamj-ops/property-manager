'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  LuArrowDown,
  LuArrowUp,
  LuDollarSign,
  LuReceipt,
  LuTrendingDown,
  LuTrendingUp,
  LuWrench,
} from 'react-icons/lu'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart'
import {
  ChartContainer as ChartWrapper,
  ChartDateFilter,
  useChartDrillDown,
} from '~/components/dashboard/chart-container'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { Badge } from '~/components/ui/badge'
import { Link } from '~/components/ui/link'

import {
  useCostSummaryQuery,
  useCostsByPropertyQuery,
  useCostsByCategoryQuery,
  useCostsByVendorQuery,
  useCostsByPeriodQuery,
  useTopExpensiveRequestsQuery,
  costSummaryQueryOptions,
  costsByPropertyQueryOptions,
  costsByCategoryQueryOptions,
  costsByVendorQueryOptions,
  costsByPeriodQueryOptions,
  topExpensiveRequestsQueryOptions,
} from '~/services/cost-reporting.query'
import { usePropertiesQuery } from '~/services/properties.query'
import type { CostReportingFilters, AggregationPeriod } from '~/services/cost-reporting.schema'

export const Route = createFileRoute('/app/maintenance/costs')({
  loader: async ({ context }) => {
    const defaultFilters: CostReportingFilters = {
      startDate: subMonths(new Date(), 12),
      endDate: new Date(),
    }
    // Prefetch all cost data
    await Promise.all([
      context.queryClient.ensureQueryData(costSummaryQueryOptions(defaultFilters)),
      context.queryClient.ensureQueryData(costsByPropertyQueryOptions(defaultFilters)),
      context.queryClient.ensureQueryData(costsByCategoryQueryOptions(defaultFilters)),
      context.queryClient.ensureQueryData(costsByVendorQueryOptions(defaultFilters)),
      context.queryClient.ensureQueryData(costsByPeriodQueryOptions({ ...defaultFilters, period: 'MONTH' })),
      context.queryClient.ensureQueryData(topExpensiveRequestsQueryOptions({ ...defaultFilters, limit: 10 })),
    ])
  },
  component: CostReportingPage,
})

function CostsSkeleton() {
  return (
    <div className='w-full space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-10 w-48' />
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-32' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Skeleton className='h-96' />
        <Skeleton className='h-96' />
      </div>
    </div>
  )
}

// Chart colors
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function CostsContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  })
  const [preset, setPreset] = useState('12m')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [period, setPeriod] = useState<AggregationPeriod>('MONTH')

  const filters: CostReportingFilters = useMemo(() => ({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
  }), [dateRange, propertyFilter])

  const { data: summary } = useCostSummaryQuery(filters)
  const { data: costsByProperty } = useCostsByPropertyQuery(filters)
  const { data: costsByCategory } = useCostsByCategoryQuery(filters)
  const { data: costsByVendor } = useCostsByVendorQuery(filters)
  const { data: costsByPeriod } = useCostsByPeriodQuery({ ...filters, period })
  const { data: topExpensive } = useTopExpensiveRequestsQuery({ ...filters, limit: 10 })
  const { data: properties } = usePropertiesQuery({})

  // Drill-down hooks
  const categoryDrillDown = useChartDrillDown()
  const vendorDrillDown = useChartDrillDown()

  // Chart configs
  const periodChartConfig: ChartConfig = {
    actualCost: {
      label: 'Actual Cost',
      color: 'hsl(var(--chart-1))',
    },
    estimatedCost: {
      label: 'Estimated',
      color: 'hsl(var(--chart-3))',
    },
  }

  const categoryChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    costsByCategory.forEach((cat, idx) => {
      config[cat.category] = {
        label: cat.categoryLabel,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }
    })
    return config
  }, [costsByCategory])

  const propertyChartConfig: ChartConfig = {
    actualCost: {
      label: 'Actual Cost',
      color: 'hsl(var(--chart-1))',
    },
    tenantCharges: {
      label: 'Tenant Charges',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <div className='w-full space-y-6 py-6'>
      {/* Header with filters */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Typography.H2>Maintenance Costs</Typography.H2>
          <Typography.Muted>Track and analyze your maintenance expenses</Typography.Muted>
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
          <ChartDateFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            preset={preset}
            onPresetChange={setPreset}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Actual Cost</CardTitle>
            <LuDollarSign className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(summary.totalActual)}</div>
            <p className='text-xs text-muted-foreground'>
              from {summary.completedCount} completed work orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Net Cost</CardTitle>
            <LuReceipt className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(summary.netCost)}</div>
            <p className='text-xs text-muted-foreground'>
              after {formatCurrency(summary.totalTenantCharges)} in tenant charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Cost per Request</CardTitle>
            <LuWrench className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(summary.avgCostPerRequest)}</div>
            <p className='text-xs text-muted-foreground'>
              across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Budget Variance</CardTitle>
            {summary.savingsVsEstimate >= 0 ? (
              <LuTrendingDown className='size-4 text-green-500' />
            ) : (
              <LuTrendingUp className='size-4 text-red-500' />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.savingsVsEstimate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.savingsVsEstimate >= 0 ? '-' : '+'}
              {formatCurrency(Math.abs(summary.savingsVsEstimate))}
            </div>
            <p className='text-xs text-muted-foreground'>
              {summary.savingsVsEstimate >= 0 ? 'under budget' : 'over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend Chart */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Cost Trend</CardTitle>
            <CardDescription>Maintenance costs over time</CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as AggregationPeriod)}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='WEEK'>Weekly</SelectItem>
              <SelectItem value='MONTH'>Monthly</SelectItem>
              <SelectItem value='QUARTER'>Quarterly</SelectItem>
              <SelectItem value='YEAR'>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer config={periodChartConfig} className='h-[350px] w-full'>
            <AreaChart data={costsByPeriod} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='periodLabel'
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
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey='estimatedCost'
                type='monotone'
                fill='var(--color-estimatedCost)'
                fillOpacity={0.2}
                stroke='var(--color-estimatedCost)'
                strokeWidth={2}
                strokeDasharray='5 5'
              />
              <Area
                dataKey='actualCost'
                type='monotone'
                fill='var(--color-actualCost)'
                fillOpacity={0.4}
                stroke='var(--color-actualCost)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Two-column charts */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Cost by Category */}
        <ChartWrapper
          title='Cost by Category'
          description='Breakdown of costs by maintenance category'
          showDateFilter={false}
          drillDownData={categoryDrillDown.drillDownData}
          onDrillDownClose={categoryDrillDown.closeDrillDown}
        >
          <ChartContainer config={categoryChartConfig} className='h-[300px] w-full'>
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey='category'
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Pie
                data={costsByCategory}
                dataKey='actualCost'
                nameKey='categoryLabel'
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
                stroke='hsl(var(--background))'
                style={{ cursor: 'pointer' }}
                onClick={(_, idx) => {
                  const cat = costsByCategory[idx]
                  if (cat) {
                    categoryDrillDown.handleChartClick(cat, (d) => ({
                      title: d.categoryLabel,
                      description: `${d.requestCount} work orders • ${formatCurrency(d.actualCost)} total`,
                      items: [
                        {
                          id: 'actual',
                          label: 'Actual Cost',
                          value: formatCurrency(d.actualCost),
                          status: 'info',
                        },
                        {
                          id: 'estimated',
                          label: 'Estimated Cost',
                          value: formatCurrency(d.estimatedCost),
                          status: d.actualCost <= d.estimatedCost ? 'success' : 'warning',
                        },
                        {
                          id: 'tenant',
                          label: 'Tenant Charges',
                          value: formatCurrency(d.tenantCharges),
                          status: 'info',
                        },
                        {
                          id: 'count',
                          label: 'Work Orders',
                          value: String(d.requestCount),
                          status: 'info',
                        },
                      ],
                    }))
                  }
                }}
              >
                {costsByCategory.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey='categoryLabel' />}
                className='-translate-y-2 flex-wrap gap-2'
              />
            </PieChart>
          </ChartContainer>
        </ChartWrapper>

        {/* Cost by Property */}
        <ChartWrapper
          title='Cost by Property'
          description='Maintenance costs across properties'
          showDateFilter={false}
        >
          <ChartContainer config={propertyChartConfig} className='h-[300px] w-full'>
            <BarChart
              data={costsByProperty.slice(0, 8)}
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
                dataKey='propertyName'
                type='category'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey='actualCost'
                fill='var(--color-actualCost)'
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </ChartWrapper>
      </div>

      {/* Vendor costs and top expensive */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Cost by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Vendor</CardTitle>
            <CardDescription>Top vendors by total cost</CardDescription>
          </CardHeader>
          <CardContent>
            {costsByVendor.length === 0 ? (
              <div className='flex h-[200px] items-center justify-center text-muted-foreground'>
                No vendor data available
              </div>
            ) : (
              <div className='space-y-4'>
                {costsByVendor.slice(0, 5).map((vendor, idx) => {
                  const maxCost = costsByVendor[0].actualCost
                  const percentage = (vendor.actualCost / maxCost) * 100
                  return (
                    <div key={vendor.vendorId} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>{vendor.vendorName}</span>
                          <Badge variant='secondary' className='text-xs'>
                            {vendor.requestCount} jobs
                          </Badge>
                        </div>
                        <span className='font-semibold'>
                          {formatCurrency(vendor.actualCost)}
                        </span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full rounded-full transition-all'
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Avg: {formatCurrency(vendor.avgCostPerRequest)} per request
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Expensive Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Most Expensive Work Orders</CardTitle>
            <CardDescription>Top 10 by actual cost</CardDescription>
          </CardHeader>
          <CardContent>
            {topExpensive.length === 0 ? (
              <div className='flex h-[200px] items-center justify-center text-muted-foreground'>
                No completed work orders yet
              </div>
            ) : (
              <div className='space-y-3'>
                {topExpensive.map((request, idx) => (
                  <Link
                    key={request.id}
                    to='/app/maintenance/$workOrderId'
                    params={{ workOrderId: request.id }}
                    className='flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium'>
                        {idx + 1}
                      </span>
                      <div>
                        <p className='font-medium'>{request.title}</p>
                        <p className='text-xs text-muted-foreground'>
                          {request.propertyName} • Unit {request.unitNumber}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-red-600'>
                        {formatCurrency(request.actualCost)}
                      </p>
                      <p className='text-xs text-muted-foreground'>{request.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CostReportingPage() {
  return (
    <Suspense fallback={<CostsSkeleton />}>
      <CostsContent />
    </Suspense>
  )
}
