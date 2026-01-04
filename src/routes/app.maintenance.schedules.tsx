'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuCalendar,
  LuCheck,
  LuClock,
  LuPause,
  LuPlay,
  LuPlus,
  LuRepeat,
  LuSearch,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { toast } from 'sonner'

import {
  useSchedulesQuery,
  useScheduleStatsQuery,
  useCreateSchedule,
  useUpdateSchedule,
  useExecuteSchedule,
  schedulesQueryOptions,
  scheduleStatsQueryOptions,
} from '~/services/schedules.query'
import { usePropertiesQuery } from '~/services/properties.query'
import { useUnitsQuery } from '~/services/units.query'
import { useVendorsQuery } from '~/services/vendors.query'
import {
  frequencyLabels,
  type RecurrenceFrequency,
  type CreateScheduleInput,
} from '~/services/schedules.schema'

export const Route = createFileRoute('/app/maintenance/schedules')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(schedulesQueryOptions({})),
      context.queryClient.ensureQueryData(scheduleStatsQueryOptions()),
    ])
  },
  component: SchedulesPage,
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

function SchedulesSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-24' />
        ))}
      </div>
      <Skeleton className='h-96' />
    </div>
  )
}

function StatsCards() {
  const { data: stats } = useScheduleStatsQuery()

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>Total Schedules</CardTitle>
          <LuRepeat className='size-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>Active Schedules</CardTitle>
          <LuPlay className='size-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>Due This Week</CardTitle>
          <LuClock className='size-4 text-amber-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.upcomingThisWeek}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateScheduleDialog() {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateSchedule()

  const { data: propertiesData } = usePropertiesQuery({})
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const { data: unitsData } = useUnitsQuery(
    selectedPropertyId ? { propertyId: selectedPropertyId } : {}
  )
  const { data: vendorsData } = useVendorsQuery({ status: 'ACTIVE' })

  const [formData, setFormData] = useState<Partial<CreateScheduleInput>>({
    frequency: 'MONTHLY',
    priority: 'MEDIUM',
    intervalCount: 1,
    autoAssignVendor: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createMutation.mutateAsync(formData as CreateScheduleInput)
      toast.success('Schedule Created', {
        description: 'The recurring maintenance schedule has been created',
      })
      setOpen(false)
      setFormData({
        frequency: 'MONTHLY',
        priority: 'MEDIUM',
        intervalCount: 1,
        autoAssignVendor: false,
      })
      setSelectedPropertyId('')
    } catch {
      toast.error('Error', {
        description: 'Failed to create schedule',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LuPlus className='mr-2 size-4' />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Recurring Schedule</DialogTitle>
          <DialogDescription>
            Set up automatic work order creation on a schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Schedule Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Schedule Name</Label>
            <Input
              id='name'
              placeholder='e.g., Quarterly HVAC Filter Change'
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Location Selection */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Property</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={(value) => {
                  setSelectedPropertyId(value)
                  setFormData({ ...formData, propertyId: value, unitId: undefined })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
                <SelectContent>
                  {propertiesData?.properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Unit (optional)</Label>
              <Select
                value={formData.unitId || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitId: value || undefined })
                }
                disabled={!selectedPropertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All units' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All units in property</SelectItem>
                  {unitsData?.units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Work Order Details */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as CreateScheduleInput['category'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
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
                value={formData.priority || 'MEDIUM'}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as CreateScheduleInput['priority'] })
                }
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
            <Label htmlFor='title'>Work Order Title</Label>
            <Input
              id='title'
              placeholder='e.g., Replace HVAC filter'
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Detailed description of the work to be performed...'
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Recurrence Settings */}
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Frequency</Label>
              <Select
                value={formData.frequency || 'MONTHLY'}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value as RecurrenceFrequency })
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
              <Label htmlFor='startDate'>Start Date</Label>
              <Input
                id='startDate'
                type='date'
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: new Date(e.target.value) })
                }
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='endDate'>End Date (optional)</Label>
              <Input
                id='endDate'
                type='date'
                value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Vendor Assignment */}
          <div className='space-y-2'>
            <Label>Assign Vendor (optional)</Label>
            <Select
              value={formData.vendorId || ''}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  vendorId: value || undefined,
                  autoAssignVendor: !!value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='No vendor auto-assigned' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>No vendor auto-assigned</SelectItem>
                {vendorsData?.vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SchedulesList() {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<string>('all')

  const { data } = useSchedulesQuery({
    search: search || undefined,
    isActive: filterActive === 'all' ? undefined : filterActive === 'active',
  })

  const updateMutation = useUpdateSchedule()
  const executeMutation = useExecuteSchedule()

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, isActive: !currentlyActive })
      toast.success(currentlyActive ? 'Schedule Paused' : 'Schedule Activated', {
        description: currentlyActive
          ? 'The schedule has been paused'
          : 'The schedule is now active',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to update schedule',
      })
    }
  }

  const handleExecuteNow = async (id: string) => {
    try {
      await executeMutation.mutateAsync(id)
      toast.success('Work Order Created', {
        description: 'A new work order has been created from this schedule',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to create work order',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Recurring Schedules</CardTitle>
            <CardDescription>
              Manage automated maintenance work order creation
            </CardDescription>
          </div>
          <CreateScheduleDialog />
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className='mb-4 flex gap-4'>
          <div className='relative flex-1'>
            <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search schedules...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className='w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Schedules</SelectItem>
              <SelectItem value='active'>Active Only</SelectItem>
              <SelectItem value='inactive'>Paused Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schedule List */}
        {data.schedules.length === 0 ? (
          <div className='py-12 text-center'>
            <LuRepeat className='mx-auto size-12 text-muted-foreground' />
            <Typography.H4 className='mt-4'>No schedules yet</Typography.H4>
            <Typography.Muted className='mt-2'>
              Create a recurring schedule to automate maintenance work orders
            </Typography.Muted>
          </div>
        ) : (
          <div className='space-y-4'>
            {data.schedules.map((schedule) => (
              <div
                key={schedule.id}
                className='flex items-center justify-between rounded-lg border p-4'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <Link
                      to='/app/maintenance/schedules/$scheduleId'
                      params={{ scheduleId: schedule.id }}
                      className='font-medium hover:underline'
                    >
                      {schedule.name}
                    </Link>
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                      {schedule.isActive ? 'Active' : 'Paused'}
                    </Badge>
                    <Badge variant='outline'>{frequencyLabels[schedule.frequency]}</Badge>
                    <Badge variant='outline'>{categoryLabels[schedule.category]}</Badge>
                  </div>
                  <div className='mt-1 flex items-center gap-4 text-sm text-muted-foreground'>
                    <span className='flex items-center gap-1'>
                      <LuWrench className='size-3' />
                      {schedule.title}
                    </span>
                    <span className='flex items-center gap-1'>
                      <LuCalendar className='size-3' />
                      Next: {new Date(schedule.nextRunAt).toLocaleDateString()}
                    </span>
                    <span>
                      {schedule.unit
                        ? `Unit ${schedule.unit.unitNumber} • ${schedule.unit.property.name}`
                        : schedule.property?.name}
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExecuteNow(schedule.id)}
                    disabled={executeMutation.isPending}
                  >
                    <LuPlay className='mr-1 size-3' />
                    Run Now
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                    disabled={updateMutation.isPending}
                  >
                    {schedule.isActive ? (
                      <LuPause className='size-4' />
                    ) : (
                      <LuCheck className='size-4' />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.total > data.schedules.length && (
          <div className='mt-4 text-center text-sm text-muted-foreground'>
            Showing {data.schedules.length} of {data.total} schedules
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SchedulesContent() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div>
        <Typography.H2>Recurring Maintenance</Typography.H2>
        <Typography.Muted>
          Set up automated work order creation on a schedule
        </Typography.Muted>
      </div>

      <Suspense fallback={<Skeleton className='h-24' />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<Skeleton className='h-96' />}>
        <SchedulesList />
      </Suspense>
    </div>
  )
}

function SchedulesPage() {
  return (
    <Suspense fallback={<SchedulesSkeleton />}>
      <SchedulesContent />
    </Suspense>
  )
}
