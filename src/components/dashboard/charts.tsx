'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import type { DateRange } from 'react-day-picker'

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
  useChartDrillDown,
  type DrillDownData,
} from './chart-container'

// =============================================================================
// REVENUE CHART
// =============================================================================

const revenueData = [
  { month: 'Jan', revenue: 42000, collected: 40500, details: [
    { unit: '101', tenant: 'John Smith', expected: 1200, paid: 1200 },
    { unit: '102', tenant: 'Jane Doe', expected: 1350, paid: 1350 },
    { unit: '103', tenant: 'Bob Wilson', expected: 1100, paid: 950 },
  ]},
  { month: 'Feb', revenue: 43200, collected: 42800, details: [
    { unit: '101', tenant: 'John Smith', expected: 1200, paid: 1200 },
    { unit: '102', tenant: 'Jane Doe', expected: 1350, paid: 1350 },
    { unit: '104', tenant: 'Alice Brown', expected: 1400, paid: 1200 },
  ]},
  { month: 'Mar', revenue: 44100, collected: 43000, details: [
    { unit: '201', tenant: 'Mike Johnson', expected: 1500, paid: 1500 },
    { unit: '202', tenant: 'Sarah Davis', expected: 1250, paid: 1100 },
  ]},
  { month: 'Apr', revenue: 45500, collected: 44200, details: [] },
  { month: 'May', revenue: 46200, collected: 45800, details: [] },
  { month: 'Jun', revenue: 47000, collected: 46500, details: [] },
  { month: 'Jul', revenue: 47800, collected: 47200, details: [] },
  { month: 'Aug', revenue: 48200, collected: 47800, details: [] },
  { month: 'Sep', revenue: 48500, collected: 48000, details: [] },
  { month: 'Oct', revenue: 49000, collected: 48500, details: [] },
  { month: 'Nov', revenue: 49500, collected: 49000, details: [] },
  { month: 'Dec', revenue: 50000, collected: 49200, details: [] },
]

const revenueConfig = {
  revenue: {
    label: 'Expected',
    color: 'hsl(var(--chart-1))',
  },
  collected: {
    label: 'Collected',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

interface RevenueChartProps {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  preset?: string
  onPresetChange?: (preset: string) => void
  showControls?: boolean
}

export function RevenueChart({
  dateRange,
  onDateRangeChange,
  preset = '12m',
  onPresetChange,
  showControls = true,
}: RevenueChartProps) {
  const { drillDownData, handleChartClick, closeDrillDown } = useChartDrillDown<typeof revenueData[0]>()

  const onBarClick = useCallback(
    (data: typeof revenueData[0]) => {
      handleChartClick(data, (d) => ({
        title: `Revenue Details - ${d.month}`,
        description: `Expected: $${d.revenue.toLocaleString()} | Collected: $${d.collected.toLocaleString()}`,
        items: d.details.length > 0
          ? d.details.map((detail, idx) => ({
              id: `${idx}`,
              label: `Unit ${detail.unit}`,
              subLabel: detail.tenant,
              value: `$${detail.paid.toLocaleString()}`,
              status: detail.paid >= detail.expected ? 'success' as const : 'warning' as const,
              metadata: { expected: `$${detail.expected}` },
            }))
          : [
              { id: '1', label: 'Humboldt Court', value: `$${Math.round(d.collected * 0.4).toLocaleString()}`, status: 'success' as const },
              { id: '2', label: 'Maple Grove', value: `$${Math.round(d.collected * 0.3).toLocaleString()}`, status: 'success' as const },
              { id: '3', label: 'Downtown Lofts', value: `$${Math.round(d.collected * 0.2).toLocaleString()}`, status: 'warning' as const },
              { id: '4', label: 'Riverside', value: `$${Math.round(d.collected * 0.1).toLocaleString()}`, status: 'success' as const },
            ],
      }))
    },
    [handleChartClick]
  )

  const chart = (
    <ChartContainer config={revenueConfig} className='h-[300px] w-full'>
      <AreaChart data={revenueData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='month'
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
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey='revenue'
          type='monotone'
          fill='var(--color-revenue)'
          fillOpacity={0.2}
          stroke='var(--color-revenue)'
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={((_: unknown, idx: number) => revenueData[idx] && onBarClick(revenueData[idx])) as any}
        />
        <Area
          dataKey='collected'
          type='monotone'
          fill='var(--color-collected)'
          fillOpacity={0.4}
          stroke='var(--color-collected)'
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={((_: unknown, idx: number) => revenueData[idx] && onBarClick(revenueData[idx])) as any}
        />
      </AreaChart>
    </ChartContainer>
  )

  if (!showControls) {
    return chart
  }

  return (
    <ChartWrapper
      title='Revenue Overview'
      description='Monthly expected vs collected rent'
      showDateFilter
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      preset={preset}
      onPresetChange={onPresetChange}
      drillDownData={drillDownData}
      onDrillDownClose={closeDrillDown}
    >
      {chart}
    </ChartWrapper>
  )
}

// =============================================================================
// OCCUPANCY CHART
// =============================================================================

const occupancyData = [
  { property: 'Humboldt Court', occupied: 42, vacant: 3, propertyId: '1', units: [
    { unit: '101', status: 'occupied', tenant: 'John Smith' },
    { unit: '102', status: 'occupied', tenant: 'Jane Doe' },
    { unit: '103', status: 'vacant', tenant: null },
  ]},
  { property: 'Maple Grove', occupied: 27, vacant: 1, propertyId: '2', units: [] },
  { property: 'Downtown Lofts', occupied: 35, vacant: 5, propertyId: '3', units: [] },
  { property: 'Riverside', occupied: 18, vacant: 2, propertyId: '4', units: [] },
  { property: 'Park View', occupied: 20, vacant: 0, propertyId: '5', units: [] },
]

const occupancyConfig = {
  occupied: {
    label: 'Occupied',
    color: 'hsl(var(--chart-2))',
  },
  vacant: {
    label: 'Vacant',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

interface OccupancyChartProps {
  showControls?: boolean
}

export function OccupancyChart({ showControls = true }: OccupancyChartProps) {
  const { drillDownData, handleChartClick, closeDrillDown } = useChartDrillDown<typeof occupancyData[0]>()

  const onBarClick = useCallback(
    (data: typeof occupancyData[0]) => {
      handleChartClick(data, (d) => ({
        title: `${d.property} - Occupancy`,
        description: `${d.occupied} occupied, ${d.vacant} vacant (${Math.round((d.occupied / (d.occupied + d.vacant)) * 100)}% occupancy)`,
        items: d.units.length > 0
          ? d.units.map((unit, idx) => ({
              id: `${idx}`,
              label: `Unit ${unit.unit}`,
              subLabel: unit.tenant ?? 'Available',
              value: unit.status === 'occupied' ? 'Occupied' : 'Vacant',
              status: unit.status === 'occupied' ? 'success' as const : 'warning' as const,
            }))
          : [
              ...Array(d.occupied).fill(null).map((_, i) => ({
                id: `occ-${i}`,
                label: `Unit ${100 + i}`,
                subLabel: 'Tenant Name',
                value: 'Occupied',
                status: 'success' as const,
              })).slice(0, 5),
              ...Array(d.vacant).fill(null).map((_, i) => ({
                id: `vac-${i}`,
                label: `Unit ${200 + i}`,
                subLabel: 'Available for rent',
                value: 'Vacant',
                status: 'warning' as const,
              })),
            ],
      }))
    },
    [handleChartClick]
  )

  const chart = (
    <ChartContainer config={occupancyConfig} className='h-[300px] w-full'>
      <BarChart
        data={occupancyData}
        layout='vertical'
        margin={{ left: 20, right: 12 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type='number' tickLine={false} axisLine={false} />
        <YAxis
          dataKey='property'
          type='category'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={100}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey='occupied'
          stackId='a'
          fill='var(--color-occupied)'
          radius={[0, 0, 0, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(data) => data && onBarClick(data as typeof occupancyData[0])}
        />
        <Bar
          dataKey='vacant'
          stackId='a'
          fill='var(--color-vacant)'
          radius={[0, 4, 4, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(data) => data && onBarClick(data as typeof occupancyData[0])}
        />
      </BarChart>
    </ChartContainer>
  )

  if (!showControls) {
    return chart
  }

  return (
    <ChartWrapper
      title='Occupancy by Property'
      description='Units occupied vs vacant'
      showDateFilter={false}
      drillDownData={drillDownData}
      onDrillDownClose={closeDrillDown}
    >
      {chart}
    </ChartWrapper>
  )
}

// =============================================================================
// MAINTENANCE CHART
// =============================================================================

const maintenanceData = [
  { status: 'Completed', count: 45, fill: 'hsl(var(--chart-2))', workOrders: [
    { id: 'WO-001', title: 'Plumbing repair', unit: '101', date: '2024-01-15' },
    { id: 'WO-002', title: 'HVAC maintenance', unit: '205', date: '2024-01-14' },
  ]},
  { status: 'In Progress', count: 12, fill: 'hsl(var(--chart-3))', workOrders: [
    { id: 'WO-003', title: 'Kitchen faucet', unit: '302', date: '2024-01-16' },
  ]},
  { status: 'Pending', count: 8, fill: 'hsl(var(--chart-4))', workOrders: [] },
  { status: 'Overdue', count: 3, fill: 'hsl(var(--chart-5))', workOrders: [] },
]

const maintenanceConfig = {
  count: {
    label: 'Work Orders',
  },
  Completed: {
    label: 'Completed',
    color: 'hsl(var(--chart-2))',
  },
  'In Progress': {
    label: 'In Progress',
    color: 'hsl(var(--chart-3))',
  },
  Pending: {
    label: 'Pending',
    color: 'hsl(var(--chart-4))',
  },
  Overdue: {
    label: 'Overdue',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

interface MaintenanceChartProps {
  showControls?: boolean
}

export function MaintenanceChart({ showControls = true }: MaintenanceChartProps) {
  const { drillDownData, handleChartClick, closeDrillDown } = useChartDrillDown<typeof maintenanceData[0]>()

  const onPieClick = useCallback(
    (data: typeof maintenanceData[0]) => {
      const statusIcons = {
        'Completed': 'success' as const,
        'In Progress': 'info' as const,
        'Pending': 'warning' as const,
        'Overdue': 'error' as const,
      }
      handleChartClick(data, (d) => ({
        title: `${d.status} Work Orders`,
        description: `${d.count} work orders with ${d.status.toLowerCase()} status`,
        items: d.workOrders.length > 0
          ? d.workOrders.map((wo) => ({
              id: wo.id,
              label: wo.title,
              subLabel: `Unit ${wo.unit}`,
              value: wo.id,
              status: statusIcons[d.status as keyof typeof statusIcons],
              metadata: { date: wo.date },
            }))
          : Array(d.count).fill(null).map((_, i) => ({
              id: `wo-${i}`,
              label: `Work Order #${1000 + i}`,
              subLabel: `Unit ${100 + (i % 10)}`,
              value: `WO-${1000 + i}`,
              status: statusIcons[d.status as keyof typeof statusIcons],
            })).slice(0, 10),
      }))
    },
    [handleChartClick]
  )

  const chart = (
    <ChartContainer config={maintenanceConfig} className='h-[300px] w-full'>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey='status' />} />
        <Pie
          data={maintenanceData}
          dataKey='count'
          nameKey='status'
          innerRadius={60}
          outerRadius={100}
          strokeWidth={2}
          stroke='hsl(var(--background))'
          style={{ cursor: 'pointer' }}
          onClick={((_: unknown, idx: number) => maintenanceData[idx] && onPieClick(maintenanceData[idx])) as any}
        >
          {maintenanceData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey='status' />}
          className='-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center'
        />
      </PieChart>
    </ChartContainer>
  )

  if (!showControls) {
    return chart
  }

  return (
    <ChartWrapper
      title='Work Order Status'
      description="This month's maintenance requests"
      showDateFilter={false}
      drillDownData={drillDownData}
      onDrillDownClose={closeDrillDown}
    >
      {chart}
    </ChartWrapper>
  )
}

// =============================================================================
// LEASE EXPIRATION CHART
// =============================================================================

const leaseExpirationData = [
  { month: 'Jan', expiring: 2, renewed: 2, leases: [
    { unit: '101', tenant: 'John Smith', expiryDate: '2024-01-31', renewed: true },
    { unit: '205', tenant: 'Jane Doe', expiryDate: '2024-01-15', renewed: true },
  ]},
  { month: 'Feb', expiring: 5, renewed: 4, leases: [] },
  { month: 'Mar', expiring: 3, renewed: 3, leases: [] },
  { month: 'Apr', expiring: 8, renewed: 6, leases: [] },
  { month: 'May', expiring: 4, renewed: 4, leases: [] },
  { month: 'Jun', expiring: 6, renewed: 5, leases: [] },
]

const leaseConfig = {
  expiring: {
    label: 'Expiring',
    color: 'hsl(var(--chart-4))',
  },
  renewed: {
    label: 'Renewed',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

interface LeaseExpirationChartProps {
  showControls?: boolean
}

export function LeaseExpirationChart({ showControls = true }: LeaseExpirationChartProps) {
  const { drillDownData, handleChartClick, closeDrillDown } = useChartDrillDown<typeof leaseExpirationData[0]>()

  const onLineClick = useCallback(
    (data: typeof leaseExpirationData[0]) => {
      handleChartClick(data, (d) => ({
        title: `Lease Expirations - ${d.month}`,
        description: `${d.expiring} expiring, ${d.renewed} renewed (${Math.round((d.renewed / d.expiring) * 100)}% renewal rate)`,
        items: d.leases.length > 0
          ? d.leases.map((lease, idx) => ({
              id: `${idx}`,
              label: `Unit ${lease.unit}`,
              subLabel: lease.tenant,
              value: lease.renewed ? 'Renewed' : 'Pending',
              status: lease.renewed ? 'success' as const : 'warning' as const,
              metadata: { expires: lease.expiryDate },
            }))
          : [
              ...Array(d.renewed).fill(null).map((_, i) => ({
                id: `renewed-${i}`,
                label: `Unit ${100 + i}`,
                subLabel: 'Tenant Name',
                value: 'Renewed',
                status: 'success' as const,
              })),
              ...Array(d.expiring - d.renewed).fill(null).map((_, i) => ({
                id: `pending-${i}`,
                label: `Unit ${200 + i}`,
                subLabel: 'Tenant Name',
                value: 'Pending Renewal',
                status: 'warning' as const,
              })),
            ],
      }))
    },
    [handleChartClick]
  )

  const chart = (
    <ChartContainer config={leaseConfig} className='h-[300px] w-full'>
      <LineChart data={leaseExpirationData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='month'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey='expiring'
          type='monotone'
          stroke='var(--color-expiring)'
          strokeWidth={2}
          dot={{ fill: 'var(--color-expiring)', r: 4, cursor: 'pointer' }}
          activeDot={{
            r: 6,
            cursor: 'pointer',
            onClick: ((_: unknown, payload: { payload?: typeof leaseExpirationData[0] }) => {
              if (payload?.payload) onLineClick(payload.payload)
            }) as any
          }}
        />
        <Line
          dataKey='renewed'
          type='monotone'
          stroke='var(--color-renewed)'
          strokeWidth={2}
          dot={{ fill: 'var(--color-renewed)', r: 4, cursor: 'pointer' }}
          activeDot={{
            r: 6,
            cursor: 'pointer',
            onClick: ((_: unknown, payload: { payload?: typeof leaseExpirationData[0] }) => {
              if (payload?.payload) onLineClick(payload.payload)
            }) as any
          }}
        />
      </LineChart>
    </ChartContainer>
  )

  if (!showControls) {
    return chart
  }

  return (
    <ChartWrapper
      title='Lease Renewals'
      description='Expiring leases vs renewals (6 months)'
      showDateFilter={false}
      drillDownData={drillDownData}
      onDrillDownClose={closeDrillDown}
    >
      {chart}
    </ChartWrapper>
  )
}

// =============================================================================
// COLLECTION CHART
// =============================================================================

const collectionData = [
  { month: 'Jul', onTime: 85, late: 12, unpaid: 3, payments: [
    { tenant: 'John Smith', unit: '101', amount: 1200, status: 'onTime', date: '2024-07-01' },
    { tenant: 'Jane Doe', unit: '102', amount: 1350, status: 'late', date: '2024-07-08' },
  ]},
  { month: 'Aug', onTime: 88, late: 10, unpaid: 2, payments: [] },
  { month: 'Sep', onTime: 90, late: 8, unpaid: 2, payments: [] },
  { month: 'Oct', onTime: 87, late: 11, unpaid: 2, payments: [] },
  { month: 'Nov', onTime: 92, late: 6, unpaid: 2, payments: [] },
  { month: 'Dec', onTime: 89, late: 9, unpaid: 2, payments: [] },
]

const collectionConfig = {
  onTime: {
    label: 'On Time',
    color: 'hsl(var(--chart-2))',
  },
  late: {
    label: 'Late (< 30 days)',
    color: 'hsl(var(--chart-3))',
  },
  unpaid: {
    label: 'Unpaid',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

interface CollectionChartProps {
  showControls?: boolean
}

export function CollectionChart({ showControls = true }: CollectionChartProps) {
  const { drillDownData, handleChartClick, closeDrillDown } = useChartDrillDown<typeof collectionData[0]>()

  const onBarClick = useCallback(
    (data: typeof collectionData[0]) => {
      const statusMap = {
        onTime: 'success' as const,
        late: 'warning' as const,
        unpaid: 'error' as const,
      }
      handleChartClick(data, (d) => ({
        title: `Payment Collection - ${d.month}`,
        description: `${d.onTime}% on time, ${d.late}% late, ${d.unpaid}% unpaid`,
        items: d.payments.length > 0
          ? d.payments.map((payment, idx) => ({
              id: `${idx}`,
              label: payment.tenant,
              subLabel: `Unit ${payment.unit}`,
              value: `$${payment.amount.toLocaleString()}`,
              status: statusMap[payment.status as keyof typeof statusMap],
              metadata: { date: payment.date },
            }))
          : [
              ...Array(Math.round(d.onTime / 10)).fill(null).map((_, i) => ({
                id: `ontime-${i}`,
                label: `Tenant ${i + 1}`,
                subLabel: `Unit ${100 + i}`,
                value: `$${(1000 + i * 100).toLocaleString()}`,
                status: 'success' as const,
              })),
              ...Array(Math.round(d.late / 10)).fill(null).map((_, i) => ({
                id: `late-${i}`,
                label: `Tenant ${10 + i}`,
                subLabel: `Unit ${200 + i}`,
                value: `$${(1200 + i * 50).toLocaleString()}`,
                status: 'warning' as const,
              })),
              ...Array(Math.round(d.unpaid / 10) || 1).fill(null).map((_, i) => ({
                id: `unpaid-${i}`,
                label: `Tenant ${20 + i}`,
                subLabel: `Unit ${300 + i}`,
                value: `$${(1100 + i * 75).toLocaleString()}`,
                status: 'error' as const,
              })).slice(0, 2),
            ],
      }))
    },
    [handleChartClick]
  )

  const chart = (
    <ChartContainer config={collectionConfig} className='h-[300px] w-full'>
      <BarChart data={collectionData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='month'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}%`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey='onTime'
          stackId='a'
          fill='var(--color-onTime)'
          radius={[0, 0, 0, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(data) => data && onBarClick(data as typeof collectionData[0])}
        />
        <Bar
          dataKey='late'
          stackId='a'
          fill='var(--color-late)'
          radius={[0, 0, 0, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(data) => data && onBarClick(data as typeof collectionData[0])}
        />
        <Bar
          dataKey='unpaid'
          stackId='a'
          fill='var(--color-unpaid)'
          radius={[4, 4, 0, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(data) => data && onBarClick(data as typeof collectionData[0])}
        />
      </BarChart>
    </ChartContainer>
  )

  if (!showControls) {
    return chart
  }

  return (
    <ChartWrapper
      title='Payment Collection'
      description='Rent collection performance (%)'
      showDateFilter
      drillDownData={drillDownData}
      onDrillDownClose={closeDrillDown}
    >
      {chart}
    </ChartWrapper>
  )
}
