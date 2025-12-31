import { createFileRoute } from '@tanstack/react-router'
import { LuTriangleAlert, LuCalendar, LuClock, LuFilter, LuList, LuPlus, LuSearch, LuWrench } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/maintenance/')({
  component: MaintenanceListPage,
})

// Mock data for work orders
const workOrders = [
  {
    id: '2891',
    title: 'No heat in unit',
    description: 'Furnace not working, tenant reports no heat since this morning.',
    unit: '305',
    property: 'Humboldt Court',
    tenant: 'James Parker',
    category: 'HVAC',
    priority: 'emergency',
    status: 'in_progress',
    createdAt: '2024-12-31T07:23:00',
    assignedTo: "Mike's HVAC Service",
    eta: '2024-12-31T14:00:00',
  },
  {
    id: '2889',
    title: 'Water leak in bathroom',
    description: 'Water stain on ceiling near shower, possible leak from above.',
    unit: '204',
    property: 'Humboldt Court',
    tenant: 'Emily Rodriguez',
    category: 'Plumbing',
    priority: 'high',
    status: 'overdue',
    createdAt: '2024-12-30T16:15:00',
    assignedTo: 'City Plumbing Co.',
    eta: null,
  },
  {
    id: '2847',
    title: 'Kitchen faucet dripping',
    description: 'Faucet drips constantly, wasting water.',
    unit: '101',
    property: 'Humboldt Court',
    tenant: 'Sarah Johnson',
    category: 'Plumbing',
    priority: 'low',
    status: 'scheduled',
    createdAt: '2024-12-28T10:30:00',
    assignedTo: 'City Plumbing Co.',
    eta: '2025-01-02T15:00:00',
  },
  {
    id: '2845',
    title: 'Smoke detector beeping',
    description: 'Low battery warning on living room smoke detector.',
    unit: '402',
    property: 'Humboldt Court',
    tenant: 'David Kim',
    category: 'Electrical',
    priority: 'medium',
    status: 'open',
    createdAt: '2024-12-27T14:00:00',
    assignedTo: null,
    eta: null,
  },
  {
    id: '2756',
    title: 'Thermostat not working',
    description: 'Digital thermostat display is blank.',
    unit: '101',
    property: 'Humboldt Court',
    tenant: 'Sarah Johnson',
    category: 'HVAC',
    priority: 'medium',
    status: 'completed',
    createdAt: '2024-11-15T09:00:00',
    assignedTo: "Mike's HVAC Service",
    completedAt: '2024-11-16T11:30:00',
  },
]

function MaintenanceListPage() {
  const openOrders = workOrders.filter(w => w.status === 'open').length
  const inProgressOrders = workOrders.filter(w => w.status === 'in_progress').length
  const scheduledOrders = workOrders.filter(w => w.status === 'scheduled').length
  const overdueOrders = workOrders.filter(w => w.status === 'overdue').length

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Maintenance</Typography.H2>
          <Typography.Muted>Manage work orders and maintenance requests</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/maintenance/new'>
            <LuPlus className='mr-2 size-4' />
            New Work Order
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{openOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{inProgressOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{scheduledOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>{overdueOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1.2 hrs</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative flex-1 min-w-64'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search work orders...' className='pl-10' />
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            <LuList className='mr-2 size-4' />
            List
          </Button>
          <Button variant='ghost' size='sm'>
            <LuCalendar className='mr-2 size-4' />
            Calendar
          </Button>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            All
          </Button>
          <Button variant='ghost' size='sm'>
            Open
          </Button>
          <Button variant='ghost' size='sm'>
            In Progress
          </Button>
          <Button variant='ghost' size='sm'>
            Completed
          </Button>
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      {/* Work Orders List */}
      <div className='space-y-4'>
        {workOrders.filter(w => w.status !== 'completed').map(order => (
          <WorkOrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Completed Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {workOrders.filter(w => w.status === 'completed').map(order => (
              <WorkOrderCard key={order.id} order={order} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface WorkOrderCardProps {
  order: (typeof workOrders)[0]
}

function WorkOrderCard({ order }: WorkOrderCardProps) {
  const priorityConfig = {
    emergency: { label: 'Emergency', variant: 'destructive' as const },
    high: { label: 'High', variant: 'destructive' as const },
    medium: { label: 'Medium', variant: 'secondary' as const },
    low: { label: 'Low', variant: 'outline' as const },
  }

  const statusConfig = {
    open: { label: 'Open', className: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    scheduled: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  }

  const priority = priorityConfig[order.priority]
  const status = statusConfig[order.status]

  return (
    <Card className={`hover:shadow-md transition-shadow ${order.status === 'overdue' ? 'border-destructive/50' : ''}`}>
      <CardContent className='p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          {/* Order Info */}
          <div className='flex items-start gap-4'>
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${
                order.priority === 'emergency' ? 'bg-destructive/10' : 'bg-muted'
              }`}
            >
              {order.priority === 'emergency' ? (
                <LuTriangleAlert className='size-5 text-destructive' />
              ) : (
                <LuWrench className='size-5 text-muted-foreground' />
              )}
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>#{order.id}</span>
                <Badge variant={priority.variant}>{priority.label}</Badge>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <h3 className='font-semibold'>{order.title}</h3>
              <p className='text-sm text-muted-foreground'>
                Unit {order.unit} • {order.property} • {order.tenant}
              </p>
              <p className='text-sm text-muted-foreground'>{order.description}</p>
            </div>
          </div>

          {/* Details & Actions */}
          <div className='flex flex-col items-end gap-2'>
            <div className='text-right text-sm'>
              <p className='text-muted-foreground'>Category</p>
              <p className='font-medium'>{order.category}</p>
            </div>
            {order.assignedTo && (
              <div className='text-right text-sm'>
                <p className='text-muted-foreground'>Assigned To</p>
                <p className='font-medium'>{order.assignedTo}</p>
              </div>
            )}
            {order.eta && (
              <div className='text-right text-sm'>
                <p className='text-muted-foreground flex items-center gap-1 justify-end'>
                  <LuClock className='size-3' />
                  ETA
                </p>
                <p className='font-medium'>{new Date(order.eta).toLocaleString()}</p>
              </div>
            )}
            <div className='flex gap-2 mt-2'>
              <Button variant='outline' size='sm' asChild>
                <Link to='/app/maintenance/$workOrderId' params={{ workOrderId: order.id }}>
                  View
                </Link>
              </Button>
              {order.status !== 'completed' && <Button size='sm'>Update Status</Button>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
