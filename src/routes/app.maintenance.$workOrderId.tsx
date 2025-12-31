import { createFileRoute } from '@tanstack/react-router'
import {
  LuArrowLeft,
  LuCalendar,
  LuCheck,
  LuClock,
  LuDollarSign,
  LuMessageSquare,
  LuPhone,
  LuUpload,
  LuUser,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/maintenance/$workOrderId')({
  component: WorkOrderDetailPage,
})

// Mock data
const workOrder = {
  id: '2889',
  title: 'Water leak in bathroom',
  description: 'Water stain on ceiling near shower, possible leak from above. Tenant reports it has been getting worse over the past few days.',
  unit: '204',
  property: 'Humboldt Court Community',
  propertyId: '1',
  tenant: {
    name: 'Emily Rodriguez',
    phone: '(612) 555-0156',
    email: 'emily.r@email.com',
  },
  category: 'Plumbing',
  priority: 'high',
  status: 'in_progress',
  createdAt: '2024-12-30T16:15:00',
  assignedTo: {
    name: 'City Plumbing Co.',
    phone: '(612) 555-1234',
    contact: 'John Smith',
  },
  estimatedCost: 450,
  accessPermission: true,
  preferredTimes: 'Weekdays 9am-5pm',
}

const statusHistory = [
  { status: 'Created', time: '2024-12-30T16:15:00', user: 'Emily Rodriguez (Tenant)' },
  { status: 'Assigned', time: '2024-12-30T16:45:00', user: 'Property Manager' },
  { status: 'Scheduled', time: '2024-12-30T17:00:00', user: 'City Plumbing Co.' },
  { status: 'In Progress', time: '2024-12-31T09:00:00', user: 'John Smith' },
]

function WorkOrderDetailPage() {
  const { workOrderId } = Route.useParams()

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/maintenance'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>Work Order #{workOrder.id}</Typography.H2>
            <Badge variant='destructive'>High Priority</Badge>
            <Badge className='bg-blue-100 text-blue-800'>In Progress</Badge>
          </div>
          <Typography.Muted>
            Unit {workOrder.unit} • {workOrder.property}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuPhone className='mr-2 size-4' />
            Call Vendor
          </Button>
          <Button>
            <LuCheck className='mr-2 size-4' />
            Mark Complete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Work Order Details */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>{workOrder.title}</CardTitle>
            <CardDescription>
              Submitted on {new Date(workOrder.createdAt).toLocaleDateString()} at{' '}
              {new Date(workOrder.createdAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Description */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Description</h4>
              <p className='text-sm text-muted-foreground'>{workOrder.description}</p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Category</p>
                <p className='font-medium'>{workOrder.category}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Priority</p>
                <Badge variant='destructive'>{workOrder.priority}</Badge>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Estimated Cost</p>
                <p className='font-medium'>${workOrder.estimatedCost}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Access Permission</p>
                <p className='font-medium'>{workOrder.accessPermission ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <Separator />

            {/* Tenant Info */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium flex items-center gap-2'>
                <LuUser className='size-4' />
                Tenant Information
              </h4>
              <div className='rounded-lg bg-muted p-4'>
                <p className='font-medium'>{workOrder.tenant.name}</p>
                <p className='text-sm text-muted-foreground'>Unit {workOrder.unit}</p>
                <div className='mt-2 flex gap-4'>
                  <Button variant='outline' size='sm'>
                    <LuPhone className='mr-2 size-4' />
                    {workOrder.tenant.phone}
                  </Button>
                  <Button variant='outline' size='sm' asChild>
                    <Link to='/app/communications'>
                      <LuMessageSquare className='mr-2 size-4' />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vendor Info */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium flex items-center gap-2'>
                <LuWrench className='size-4' />
                Assigned Vendor
              </h4>
              <div className='rounded-lg bg-muted p-4'>
                <p className='font-medium'>{workOrder.assignedTo.name}</p>
                <p className='text-sm text-muted-foreground'>Contact: {workOrder.assignedTo.contact}</p>
                <Button variant='outline' size='sm' className='mt-2'>
                  <LuPhone className='mr-2 size-4' />
                  {workOrder.assignedTo.phone}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Select defaultValue='in_progress'>
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='open'>Open</SelectItem>
                    <SelectItem value='scheduled'>Scheduled</SelectItem>
                    <SelectItem value='in_progress'>In Progress</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Textarea placeholder='Add notes about this update...' className='min-h-20' />
              </div>
              <Button className='w-full'>Update Status</Button>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Attach photos of the issue or completed work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg border-2 border-dashed p-8 text-center'>
                <LuUpload className='mx-auto size-8 text-muted-foreground' />
                <p className='mt-2 text-sm text-muted-foreground'>Drag and drop or click to upload</p>
                <Button variant='outline' size='sm' className='mt-4'>
                  Upload Photos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Record Cost */}
          <Card>
            <CardHeader>
              <CardTitle>Record Cost</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Estimated</span>
                  <span>${workOrder.estimatedCost}</span>
                </div>
                <Separator />
                <div className='flex items-center gap-2'>
                  <LuDollarSign className='size-4 text-muted-foreground' />
                  <input
                    type='number'
                    placeholder='Actual cost'
                    className='flex-1 rounded border px-3 py-2 text-sm'
                  />
                </div>
              </div>
              <Button variant='outline' className='w-full'>
                Save Cost
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {statusHistory.map((entry, i) => (
              <div key={i} className='flex items-start gap-4'>
                <div className='mt-1'>
                  <div className='size-2 rounded-full bg-primary' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{entry.status}</span>
                    <span className='text-sm text-muted-foreground flex items-center gap-1'>
                      <LuClock className='size-3' />
                      {new Date(entry.time).toLocaleString()}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>{entry.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
