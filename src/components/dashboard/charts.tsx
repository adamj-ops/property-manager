'use client'

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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart'

// Revenue Chart - Area chart showing monthly revenue trend
const revenueData = [
  { month: 'Jan', revenue: 42000, collected: 40500 },
  { month: 'Feb', revenue: 43200, collected: 42800 },
  { month: 'Mar', revenue: 44100, collected: 43000 },
  { month: 'Apr', revenue: 45500, collected: 44200 },
  { month: 'May', revenue: 46200, collected: 45800 },
  { month: 'Jun', revenue: 47000, collected: 46500 },
  { month: 'Jul', revenue: 47800, collected: 47200 },
  { month: 'Aug', revenue: 48200, collected: 47800 },
  { month: 'Sep', revenue: 48500, collected: 48000 },
  { month: 'Oct', revenue: 49000, collected: 48500 },
  { month: 'Nov', revenue: 49500, collected: 49000 },
  { month: 'Dec', revenue: 50000, collected: 49200 },
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

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly expected vs collected rent</CardDescription>
      </CardHeader>
      <CardContent>
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
            />
            <Area
              dataKey='collected'
              type='monotone'
              fill='var(--color-collected)'
              fillOpacity={0.4}
              stroke='var(--color-collected)'
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Occupancy Chart - Bar chart showing occupancy by property
const occupancyData = [
  { property: 'Humboldt Court', occupied: 42, vacant: 3 },
  { property: 'Maple Grove', occupied: 27, vacant: 1 },
  { property: 'Downtown Lofts', occupied: 35, vacant: 5 },
  { property: 'Riverside', occupied: 18, vacant: 2 },
  { property: 'Park View', occupied: 20, vacant: 0 },
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

export function OccupancyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy by Property</CardTitle>
        <CardDescription>Units occupied vs vacant</CardDescription>
      </CardHeader>
      <CardContent>
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
            />
            <Bar
              dataKey='vacant'
              stackId='a'
              fill='var(--color-vacant)'
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Maintenance Chart - Pie chart showing work order status
const maintenanceData = [
  { status: 'Completed', count: 45, fill: 'hsl(var(--chart-2))' },
  { status: 'In Progress', count: 12, fill: 'hsl(var(--chart-3))' },
  { status: 'Pending', count: 8, fill: 'hsl(var(--chart-4))' },
  { status: 'Overdue', count: 3, fill: 'hsl(var(--chart-5))' },
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

export function MaintenanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Order Status</CardTitle>
        <CardDescription>This month's maintenance requests</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}

// Lease Expiration Chart - Line chart showing upcoming expirations
const leaseExpirationData = [
  { month: 'Jan', expiring: 2, renewed: 2 },
  { month: 'Feb', expiring: 5, renewed: 4 },
  { month: 'Mar', expiring: 3, renewed: 3 },
  { month: 'Apr', expiring: 8, renewed: 6 },
  { month: 'May', expiring: 4, renewed: 4 },
  { month: 'Jun', expiring: 6, renewed: 5 },
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

export function LeaseExpirationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lease Renewals</CardTitle>
        <CardDescription>Expiring leases vs renewals (6 months)</CardDescription>
      </CardHeader>
      <CardContent>
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
              dot={{ fill: 'var(--color-expiring)', r: 4 }}
            />
            <Line
              dataKey='renewed'
              type='monotone'
              stroke='var(--color-renewed)'
              strokeWidth={2}
              dot={{ fill: 'var(--color-renewed)', r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Payment Collection Chart - Bar chart showing collection rate by month
const collectionData = [
  { month: 'Jul', onTime: 85, late: 12, unpaid: 3 },
  { month: 'Aug', onTime: 88, late: 10, unpaid: 2 },
  { month: 'Sep', onTime: 90, late: 8, unpaid: 2 },
  { month: 'Oct', onTime: 87, late: 11, unpaid: 2 },
  { month: 'Nov', onTime: 92, late: 6, unpaid: 2 },
  { month: 'Dec', onTime: 89, late: 9, unpaid: 2 },
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

export function CollectionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Collection</CardTitle>
        <CardDescription>Rent collection performance (%)</CardDescription>
      </CardHeader>
      <CardContent>
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
            />
            <Bar
              dataKey='late'
              stackId='a'
              fill='var(--color-late)'
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey='unpaid'
              stackId='a'
              fill='var(--color-unpaid)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
