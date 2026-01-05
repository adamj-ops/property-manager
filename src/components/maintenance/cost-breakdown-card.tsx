'use client'

import { Suspense } from 'react'
import { LuDollarSign, LuWrench, LuPackage, LuTruck, LuUser } from 'react-icons/lu'
import { Cell, Pie, PieChart } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart'
import { useCostLineItemSummaryQuery } from '~/services/cost-line-items.query'

interface CostBreakdownCardProps {
  requestId: string
}

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

function CostBreakdownCardContent({ requestId }: CostBreakdownCardProps) {
  const { data: summary } = useCostLineItemSummaryQuery(requestId)

  if (summary.itemCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LuDollarSign className='size-5' />
            Cost Breakdown
          </CardTitle>
          <CardDescription>No cost items added yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center text-muted-foreground'>
            Add cost items to see the breakdown
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = summary.byType
    .filter((item) => item.total > 0)
    .map((item, index) => ({
      name: item.label,
      value: item.total,
      icon: item.icon,
      count: item.count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))

  const chartConfig: ChartConfig = chartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2'>
          <LuDollarSign className='size-5' />
          Cost Breakdown
        </CardTitle>
        <CardDescription>
          {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} totaling{' '}
          {formatCurrency(summary.totalCost)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Pie Chart */}
          <div className='flex items-center justify-center'>
            <ChartContainer config={chartConfig} className='h-[180px] w-[180px]'>
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey='value'
                  nameKey='name'
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke='hsl(var(--background))'
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          {/* Summary Stats */}
          <div className='space-y-3'>
            {/* Main categories */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-lg border p-3'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <LuWrench className='size-4' />
                  <span className='text-xs'>Labor</span>
                </div>
                <p className='mt-1 text-lg font-semibold'>
                  {formatCurrency(summary.laborCost)}
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <LuPackage className='size-4' />
                  <span className='text-xs'>Parts</span>
                </div>
                <p className='mt-1 text-lg font-semibold'>
                  {formatCurrency(summary.partsCost)}
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <LuTruck className='size-4' />
                  <span className='text-xs'>Materials</span>
                </div>
                <p className='mt-1 text-lg font-semibold'>
                  {formatCurrency(summary.materialsCost)}
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <LuDollarSign className='size-4' />
                  <span className='text-xs'>Other</span>
                </div>
                <p className='mt-1 text-lg font-semibold'>
                  {formatCurrency(summary.otherCosts)}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className='space-y-2 pt-2 border-t'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Total Cost</span>
                <span className='font-semibold'>
                  {formatCurrency(summary.totalCost)}
                </span>
              </div>
              {summary.tenantCharges > 0 && (
                <>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center gap-1'>
                      <LuUser className='size-4' />
                      Tenant Charges
                    </span>
                    <span className='font-semibold text-orange-600'>
                      -{formatCurrency(summary.tenantCharges)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-t pt-2'>
                    <span className='font-medium'>Net Cost</span>
                    <span className='font-bold text-lg text-green-600'>
                      {formatCurrency(summary.netCost)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Type breakdown list */}
        {chartData.length > 0 && (
          <div className='mt-4 pt-4 border-t'>
            <p className='text-sm font-medium mb-2'>By Type</p>
            <div className='grid gap-2'>
              {summary.byType
                .filter((item) => item.total > 0)
                .map((item, index) => (
                  <div
                    key={item.type}
                    className='flex items-center justify-between text-sm'
                  >
                    <div className='flex items-center gap-2'>
                      <div
                        className='size-3 rounded-full'
                        style={{
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      <span>
                        {item.icon} {item.label}
                      </span>
                      <span className='text-muted-foreground'>
                        ({item.count})
                      </span>
                    </div>
                    <span className='font-mono'>
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CostBreakdownCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-32' />
      </CardHeader>
      <CardContent>
        <div className='grid gap-6 md:grid-cols-2'>
          <div className='flex items-center justify-center'>
            <Skeleton className='size-[180px] rounded-full' />
          </div>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='h-[72px]' />
              ))}
            </div>
            <div className='space-y-2 pt-2'>
              <Skeleton className='h-5 w-full' />
              <Skeleton className='h-5 w-full' />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CostBreakdownCard({ requestId }: CostBreakdownCardProps) {
  return (
    <Suspense fallback={<CostBreakdownCardSkeleton />}>
      <CostBreakdownCardContent requestId={requestId} />
    </Suspense>
  )
}
