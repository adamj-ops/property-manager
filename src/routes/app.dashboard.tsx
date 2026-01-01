import { createFileRoute } from '@tanstack/react-router'
import { LuCircleAlert, LuArrowUpRight, LuBuilding2, LuDollarSign, LuTrendingUp, LuUsers, LuWrench } from 'react-icons/lu'

import {
  CollectionChart,
  LeaseExpirationChart,
  MaintenanceChart,
  OccupancyChart,
  RevenueChart,
} from '~/components/dashboard/charts'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Portfolio Overview</Typography.H2>
          <Typography.Muted>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/properties/new'>Add Property</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatsCard
          title='Monthly Revenue'
          value='$48,200'
          description='+12.5% from last month'
          icon={LuDollarSign}
          trend='up'
        />
        <StatsCard
          title='Occupancy Rate'
          value='94.2%'
          description='142 of 151 units occupied'
          icon={LuBuilding2}
          trend='up'
        />
        <StatsCard
          title='Active Tenants'
          value='142'
          description='3 leases expiring soon'
          icon={LuUsers}
          trend='neutral'
        />
        <StatsCard
          title='Open Work Orders'
          value='12'
          description='2 high priority'
          icon={LuWrench}
          trend='down'
        />
      </div>

      {/* Urgent Items */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <LuCircleAlert className='size-5 text-destructive' />
              <CardTitle>Urgent Items</CardTitle>
              <Badge variant='destructive'>3</Badge>
            </div>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/app/maintenance'>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <UrgentItem
            title='Unit 204 - Water leak inspection overdue'
            description='Inspection was due 2 days ago'
            action='Schedule Now'
            actionLink='/app/maintenance'
            priority='high'
          />
          <UrgentItem
            title='3 leases expiring in next 30 days'
            description='Units 101, 305, 402 need renewal'
            action='Start Renewal Process'
            actionLink='/app/leases'
            priority='medium'
          />
          <UrgentItem
            title='Unit 101 - Pet application pending approval'
            description='Submitted 3 days ago by Sarah Johnson'
            action='Review Application'
            actionLink='/app/tenants'
            priority='low'
          />
        </CardContent>
      </Card>

      {/* Properties and Quick Stats Grid */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Properties */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Properties</CardTitle>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/properties'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <PropertyCard
              name='Humboldt Court Community'
              location='Brooklyn Center, MN'
              units={45}
              occupied={42}
              revenue={42350}
              expected={45000}
            />
            <PropertyCard
              name='Maple Grove Apartments'
              location='Maple Grove, MN'
              units={28}
              occupied={27}
              revenue={31500}
              expected={32200}
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <QuickStat label='Work Orders' value='28' change='+12%' changeLabel='vs last month' />
              <QuickStat label='Messages' value='156' change='-8%' changeLabel='vs last month' />
              <QuickStat label='Inspections' value='18' change='+5%' changeLabel='completed' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='space-y-6'>
        <Typography.H3>Analytics</Typography.H3>

        {/* Revenue and Occupancy Charts */}
        <div className='grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy by Property</CardTitle>
              <CardDescription>Current occupancy rates across properties</CardDescription>
            </CardHeader>
            <CardContent>
              <OccupancyChart />
            </CardContent>
          </Card>
        </div>

        {/* Maintenance, Lease, and Collection Charts */}
        <div className='grid gap-6 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>Status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lease Expirations</CardTitle>
              <CardDescription>Upcoming renewals by month</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaseExpirationChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collection Rate</CardTitle>
              <CardDescription>Payment collection by property</CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <ActivityItem
              title='Rent payment received'
              description='Unit 305 - James Parker - $1,425'
              time='2 hours ago'
              type='payment'
            />
            <ActivityItem
              title='Maintenance request submitted'
              description='Unit 101 - Kitchen faucet dripping'
              time='5 hours ago'
              type='maintenance'
            />
            <ActivityItem
              title='Lease signed'
              description='Unit 210 - New tenant David Kim'
              time='1 day ago'
              type='lease'
            />
            <ActivityItem
              title='Inspection completed'
              description='Unit 402 - Quarterly inspection passed'
              time='2 days ago'
              type='inspection'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component: Stats Card
interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'neutral'
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='size-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground'>
          {trend === 'up' && <LuTrendingUp className='mr-1 inline size-3 text-green-500' />}
          {trend === 'down' && <LuArrowUpRight className='mr-1 inline size-3 rotate-90 text-red-500' />}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

// Component: Urgent Item
interface UrgentItemProps {
  title: string
  description: string
  action: string
  actionLink: string
  priority: 'high' | 'medium' | 'low'
}

function UrgentItem({ title, description, action, actionLink, priority }: UrgentItemProps) {
  const priorityColors = {
    high: 'bg-destructive/10 border-destructive/20',
    medium: 'bg-yellow-500/10 border-yellow-500/20',
    low: 'bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${priorityColors[priority]}`}>
      <div className='space-y-1'>
        <p className='text-sm font-medium'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <Button variant='outline' size='sm' asChild>
        <Link to={actionLink}>{action}</Link>
      </Button>
    </div>
  )
}

// Component: Property Card
interface PropertyCardProps {
  name: string
  location: string
  units: number
  occupied: number
  revenue: number
  expected: number
}

function PropertyCard({ name, location, units, occupied, revenue, expected }: PropertyCardProps) {
  const occupancyRate = Math.round((occupied / units) * 100)
  const collectionRate = Math.round((revenue / expected) * 100)

  return (
    <div className='rounded-lg border p-4'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='font-medium'>{name}</p>
          <p className='text-sm text-muted-foreground'>{location}</p>
        </div>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/app/properties/$propertyId' params={{ propertyId: '1' }}>
            View Details
          </Link>
        </Button>
      </div>
      <div className='mt-4 grid grid-cols-3 gap-4 text-sm'>
        <div>
          <p className='text-muted-foreground'>Units</p>
          <p className='font-medium'>
            {occupied}/{units} ({occupancyRate}%)
          </p>
        </div>
        <div>
          <p className='text-muted-foreground'>Collected</p>
          <p className='font-medium'>${revenue.toLocaleString()}</p>
        </div>
        <div>
          <p className='text-muted-foreground'>Collection Rate</p>
          <p className='font-medium'>{collectionRate}%</p>
        </div>
      </div>
    </div>
  )
}

// Component: Quick Stat
interface QuickStatProps {
  label: string
  value: string
  change: string
  changeLabel: string
}

function QuickStat({ label, value, change, changeLabel }: QuickStatProps) {
  const isPositive = change.startsWith('+')
  const isNegative = change.startsWith('-')

  return (
    <div className='space-y-1'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='text-2xl font-bold'>{value}</p>
      <p className='text-xs'>
        <span className={isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'}>
          {change}
        </span>{' '}
        <span className='text-muted-foreground'>{changeLabel}</span>
      </p>
    </div>
  )
}

// Component: Activity Item
interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'payment' | 'maintenance' | 'lease' | 'inspection'
}

function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const typeColors = {
    payment: 'bg-green-500',
    maintenance: 'bg-yellow-500',
    lease: 'bg-blue-500',
    inspection: 'bg-purple-500',
  }

  return (
    <div className='flex items-start gap-4'>
      <div className={`mt-1 size-2 rounded-full ${typeColors[type]}`} />
      <div className='flex-1'>
        <p className='text-sm font-medium'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <p className='text-xs text-muted-foreground'>{time}</p>
    </div>
  )
}
