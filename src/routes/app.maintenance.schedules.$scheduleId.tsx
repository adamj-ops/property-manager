'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuArrowLeft,
  LuCalendar,
  LuCheck,
  LuClock,
  LuLoaderCircle,
  LuPause,
  LuPlay,
  LuTrash2,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { toast } from 'sonner'

import {
  useScheduleQuery,
  useUpdateSchedule,
  useDeleteSchedule,
  useExecuteSchedule,
  scheduleQueryOptions,
} from '~/services/schedules.query'
import { useVendorsQuery } from '~/services/vendors.query'
import {
  frequencyLabels,
  dayOfWeekLabels,
  type RecurrenceFrequency,
} from '~/services/schedules.schema'

export const Route = createFileRoute('/app/maintenance/schedules/$scheduleId')({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(scheduleQueryOptions(params.scheduleId))
  },
  component: ScheduleDetailPage,
})

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EMERGENCY: 'Emergency',
}

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function ScheduleSkeleton() {
  return (
    <div className='w-full max-w-4xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-10 w-10' />
        <Skeleton className='h-8 w-64' />
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <Skeleton className='h-96' />
        </div>
        <Skeleton className='h-64' />
      </div>
    </div>
  )
}

function ScheduleDetail() {
  const { scheduleId } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data: schedule } = useScheduleQuery(scheduleId)
  const { data: vendorsData } = useVendorsQuery({ status: 'ACTIVE' })

  const updateMutation = useUpdateSchedule()
  const deleteMutation = useDeleteSchedule()
  const executeMutation = useExecuteSchedule()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: schedule.name,
    title: schedule.title,
    description: schedule.description,
    frequency: schedule.frequency,
    priority: schedule.priority,
    vendorId: schedule.vendorId || '',
  })

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: scheduleId,
        isActive: !schedule.isActive,
      })
      toast.success(schedule.isActive ? 'Schedule Paused' : 'Schedule Activated', {
        description: schedule.isActive
          ? 'The schedule has been paused'
          : 'The schedule is now active',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to update schedule',
      })
    }
  }

  const handleExecuteNow = async () => {
    try {
      await executeMutation.mutateAsync(scheduleId)
      toast.success('Work Order Created', {
        description: 'A new work order has been created from this schedule',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to create work order',
      })
    }
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: scheduleId,
        ...editData,
        vendorId: editData.vendorId || undefined,
      })
      setIsEditing(false)
      toast.success('Schedule Updated', {
        description: 'The schedule has been updated successfully',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to update schedule',
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      await deleteMutation.mutateAsync(scheduleId)
      toast.success('Schedule Deleted', {
        description: 'The schedule has been deleted',
      })
      navigate({ to: '/app/maintenance/schedules' })
    } catch {
      toast.error('Error', {
        description: 'Failed to delete schedule',
      })
    }
  }

  return (
    <div className='w-full max-w-4xl space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/maintenance/schedules'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>{schedule.name}</Typography.H2>
            <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
              {schedule.isActive ? 'Active' : 'Paused'}
            </Badge>
          </div>
          <Typography.Muted>
            {schedule.unit
              ? `Unit ${schedule.unit.unitNumber} • ${schedule.unit.property.name}`
              : schedule.property?.name}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleExecuteNow}
            disabled={executeMutation.isPending}
          >
            {executeMutation.isPending ? (
              <LuLoaderCircle className='mr-2 size-4 animate-spin' />
            ) : (
              <LuPlay className='mr-2 size-4' />
            )}
            Run Now
          </Button>
          <Button
            variant={schedule.isActive ? 'secondary' : 'default'}
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {schedule.isActive ? (
              <>
                <LuPause className='mr-2 size-4' />
                Pause
              </>
            ) : (
              <>
                <LuCheck className='mr-2 size-4' />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Schedule Details</CardTitle>
              {!isEditing ? (
                <Button variant='outline' size='sm' onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size='sm' onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {isEditing ? (
              <>
                <div className='space-y-2'>
                  <Label>Schedule Name</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Work Order Title</Label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Frequency</Label>
                    <Select
                      value={editData.frequency}
                      onValueChange={(value) =>
                        setEditData({ ...editData, frequency: value as RecurrenceFrequency })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(frequencyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Priority</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Assigned Vendor</Label>
                  <Select
                    value={editData.vendorId}
                    onValueChange={(value) => setEditData({ ...editData, vendorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='No vendor assigned' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No vendor assigned</SelectItem>
                      {vendorsData?.vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Typography.Muted className='text-xs uppercase'>Work Order Title</Typography.Muted>
                  <p className='mt-1 font-medium'>{schedule.title}</p>
                </div>
                <div>
                  <Typography.Muted className='text-xs uppercase'>Description</Typography.Muted>
                  <p className='mt-1'>{schedule.description}</p>
                </div>
                <Separator />
                <div className='grid gap-4 md:grid-cols-3'>
                  <div>
                    <Typography.Muted className='text-xs uppercase'>Category</Typography.Muted>
                    <p className='mt-1'>{categoryLabels[schedule.category]}</p>
                  </div>
                  <div>
                    <Typography.Muted className='text-xs uppercase'>Priority</Typography.Muted>
                    <p className='mt-1'>{priorityLabels[schedule.priority]}</p>
                  </div>
                  <div>
                    <Typography.Muted className='text-xs uppercase'>Frequency</Typography.Muted>
                    <p className='mt-1'>{frequencyLabels[schedule.frequency]}</p>
                  </div>
                </div>
                <Separator />
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <Typography.Muted className='text-xs uppercase'>Start Date</Typography.Muted>
                    <p className='mt-1'>{new Date(schedule.startDate).toLocaleDateString()}</p>
                  </div>
                  {schedule.endDate && (
                    <div>
                      <Typography.Muted className='text-xs uppercase'>End Date</Typography.Muted>
                      <p className='mt-1'>{new Date(schedule.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {schedule.dayOfWeek !== null && (
                  <div>
                    <Typography.Muted className='text-xs uppercase'>Day of Week</Typography.Muted>
                    <p className='mt-1'>{dayOfWeekLabels[schedule.dayOfWeek]}</p>
                  </div>
                )}
                {schedule.vendor && (
                  <>
                    <Separator />
                    <div>
                      <Typography.Muted className='text-xs uppercase'>Assigned Vendor</Typography.Muted>
                      <p className='mt-1 font-medium'>{schedule.vendor.companyName}</p>
                      <p className='text-sm text-muted-foreground'>{schedule.vendor.phone}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Next Run</span>
                <span className='flex items-center gap-1 font-medium'>
                  <LuCalendar className='size-4' />
                  {new Date(schedule.nextRunAt).toLocaleDateString()}
                </span>
              </div>
              {schedule.lastRunAt && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Last Run</span>
                  <span className='flex items-center gap-1'>
                    <LuClock className='size-4' />
                    {new Date(schedule.lastRunAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Work Orders Created</span>
                <span className='font-medium'>{schedule._count.generatedRequests}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Work Orders */}
          {schedule.generatedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Work Orders</CardTitle>
                <CardDescription>Generated from this schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {schedule.generatedRequests.map((request) => (
                    <Link
                      key={request.id}
                      to='/app/maintenance/$workOrderId'
                      params={{ workOrderId: request.id }}
                      className='block rounded-lg border p-3 hover:bg-muted/50'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>{request.requestNumber}</span>
                        <Badge className={statusColors[request.status] || ''}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className='mt-1 text-sm text-muted-foreground'>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className='border-destructive/50'>
            <CardHeader>
              <CardTitle className='text-destructive'>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant='destructive'
                className='w-full'
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <LuTrash2 className='mr-2 size-4' />
                Delete Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ScheduleDetailPage() {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleDetail />
    </Suspense>
  )
}
