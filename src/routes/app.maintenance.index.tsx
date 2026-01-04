'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import {
  LuCalendar,
  LuCheck,
  LuClock,
  LuEye,
  LuList,
  LuLoaderCircle,
  LuPencil,
  LuPlus,
  LuTriangleAlert,
  LuUser,
  LuWrench,
} from 'react-icons/lu'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '~/components/ui/drawer'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  DataTableToolbar,
} from '~/components/ui/data-table'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { Skeleton } from '~/components/ui/skeleton'
import { toast } from 'sonner'

import {
  useMaintenanceRequestsQuery,
  useMaintenanceStatsQuery,
  useCreateMaintenanceRequest,
  maintenanceRequestsQueryOptions,
  maintenanceStatsQueryOptions,
  unacknowledgedEmergenciesQueryOptions,
} from '~/services/maintenance.query'
import { usePropertiesQuery } from '~/services/properties.query'
import { useUnitsQuery } from '~/services/units.query'
import { EmergencyAlertBanner } from '~/components/maintenance/emergency-alert-banner'
import { WorkOrderCalendar } from '~/components/maintenance/work-order-calendar'
import type { MaintenanceFilters, MaintenanceCategory, MaintenancePriority } from '~/services/maintenance.schema'

export const Route = createFileRoute('/app/maintenance/')({
  loader: async ({ context }) => {
    // Prefetch data
    await Promise.all([
      context.queryClient.ensureQueryData(maintenanceRequestsQueryOptions({})),
      context.queryClient.ensureQueryData(maintenanceStatsQueryOptions()),
      context.queryClient.ensureQueryData(unacknowledgedEmergenciesQueryOptions()),
    ])
  },
  component: MaintenanceListPage,
})

// Type for the maintenance request from the API
interface MaintenanceRequest {
  id: string
  requestNumber: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  scheduledDate: string | null
  completedAt: string | null
  estimatedCost: number | null
  actualCost: number | null
  unit: {
    id: string
    unitNumber: string
    property: {
      id: string
      name: string
      addressLine1: string
    }
  }
  tenant: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
  } | null
  vendor: {
    id: string
    companyName: string
    phone: string
  } | null
  assignedTo: {
    id: string
    name: string
  } | null
  _count: {
    comments: number
    expenses: number
  }
}

// Priority and status configs
const priorityConfig: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' | 'default' }> = {
  EMERGENCY: { label: 'Emergency', variant: 'destructive' },
  HIGH: { label: 'High', variant: 'destructive' },
  MEDIUM: { label: 'Medium', variant: 'secondary' },
  LOW: { label: 'Low', variant: 'outline' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: 'Submitted', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  PENDING_PARTS: { label: 'Pending Parts', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  ON_HOLD: { label: 'On Hold', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

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

// Column definitions for data table
const columns: ColumnDef<MaintenanceRequest>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Work Order' />
    ),
    cell: ({ row }) => {
      const priority = priorityConfig[row.original.priority] || priorityConfig.MEDIUM
      const status = statusConfig[row.original.status] || statusConfig.SUBMITTED

      return (
        <div className='flex items-center gap-3'>
          <div
            className={`flex size-10 items-center justify-center rounded-lg ${
              row.original.priority === 'EMERGENCY' ? 'bg-destructive/10' : 'bg-muted'
            }`}
          >
            {row.original.priority === 'EMERGENCY' ? (
              <LuTriangleAlert className='size-5 text-destructive' />
            ) : (
              <LuWrench className='size-5 text-muted-foreground' />
            )}
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>{row.original.requestNumber}</span>
              <Badge variant={priority.variant} className='text-xs'>
                {priority.label}
              </Badge>
              <Badge className={`text-xs ${status.className}`}>{status.label}</Badge>
            </div>
            <Link
              to='/app/maintenance/$workOrderId'
              params={{ workOrderId: row.original.id }}
              className='font-medium hover:underline'
            >
              {row.original.title}
            </Link>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Location' />
    ),
    cell: ({ row }) => (
      <div>
        <div className='font-medium'>Unit {row.original.unit.unitNumber}</div>
        <div className='text-xs text-muted-foreground'>{row.original.unit.property.name}</div>
      </div>
    ),
  },
  {
    accessorKey: 'tenant',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tenant' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <LuUser className='size-3 text-muted-foreground' />
        <span className='text-sm'>
          {row.original.tenant
            ? `${row.original.tenant.firstName} ${row.original.tenant.lastName}`
            : 'No tenant assigned'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline'>{categoryLabels[row.original.category] || row.original.category}</Badge>
    ),
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
    cell: ({ row }) => {
      if (row.original.vendor) {
        return <span className='text-sm'>{row.original.vendor.companyName}</span>
      }
      if (row.original.assignedTo) {
        return <span className='text-sm'>{row.original.assignedTo.name}</span>
      }
      return <span className='text-sm text-muted-foreground'>Unassigned</span>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => (
      <div className='text-sm'>
        <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
        <div className='text-xs text-muted-foreground'>
          {new Date(row.original.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions row={row}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/app/maintenance/$workOrderId' params={{ workOrderId: row.original.id }}>
            <LuEye className='mr-2 size-4' />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/app/maintenance/$workOrderId' params={{ workOrderId: row.original.id }}>
            <LuPencil className='mr-2 size-4' />
            Edit work order
          </Link>
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
]

// Stats skeleton component
function StatsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-5'>
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-12' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Stats component
function MaintenanceStats() {
  const { data: stats } = useMaintenanceStatsQuery()

  return (
    <div className='grid gap-4 md:grid-cols-5'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuList className='size-4 text-muted-foreground' />
            Open
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.open}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuWrench className='size-4 text-blue-600' />
            In Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>{stats.inProgress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuCheck className='size-4 text-green-600' />
            Completed (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>{stats.completedLast30Days}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuTriangleAlert className='size-4 text-destructive' />
            Emergencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-destructive'>{stats.emergencyOpen}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuClock className='size-4 text-muted-foreground' />
            Total Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.open + stats.inProgress}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Table skeleton component
function TableSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// View toggle toolbar component
interface ViewToolbarProps {
  filters: Partial<MaintenanceFilters>
  setFilters: (f: Partial<MaintenanceFilters>) => void
  viewMode: 'list' | 'calendar'
  setViewMode: (mode: 'list' | 'calendar') => void
}

function ViewToolbar({ filters, setFilters, viewMode, setViewMode }: ViewToolbarProps) {
  return (
    <div className='flex gap-2'>
      <Button
        variant={viewMode === 'list' ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setViewMode('list')}
      >
        <LuList className='mr-2 size-4' />
        List
      </Button>
      <Button
        variant={viewMode === 'calendar' ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setViewMode('calendar')}
      >
        <LuCalendar className='mr-2 size-4' />
        Calendar
      </Button>
      <div className='border-l mx-2' />
      <Button
        variant={!filters.status ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setFilters({ ...filters, status: undefined })}
      >
        All
      </Button>
      <Button
        variant={filters.status === 'SUBMITTED' ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setFilters({ ...filters, status: 'SUBMITTED' })}
      >
        Open
      </Button>
      <Button
        variant={filters.status === 'IN_PROGRESS' ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setFilters({ ...filters, status: 'IN_PROGRESS' })}
      >
        In Progress
      </Button>
      <Button
        variant={filters.status === 'COMPLETED' ? 'outline' : 'ghost'}
        size='sm'
        onClick={() => setFilters({ ...filters, status: 'COMPLETED' })}
      >
        Completed
      </Button>
    </div>
  )
}

// Data table component
function MaintenanceDataTable({
  filters,
  setFilters,
  viewMode,
  setViewMode,
}: ViewToolbarProps) {
  const { data } = useMaintenanceRequestsQuery(filters)

  // Transform the data to match our type
  const requests = useMemo(() => data.requests as unknown as MaintenanceRequest[], [data.requests])

  return (
    <Card>
      <CardContent className='pt-6'>
        <DataTable
          columns={columns}
          data={requests}
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              searchKey='title'
              searchPlaceholder='Search work orders...'
              actionComponent={
                <ViewToolbar
                  filters={filters}
                  setFilters={setFilters}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              }
            />
          )}
        />
        {data.total > 0 && (
          <div className='mt-4 text-sm text-muted-foreground'>
            Showing {Math.min(data.limit, data.total)} of {data.total} work orders
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Calendar view component
function MaintenanceCalendarView({
  filters,
  setFilters,
  viewMode,
  setViewMode,
}: ViewToolbarProps) {
  // Fetch all work orders (with high limit for calendar)
  const { data } = useMaintenanceRequestsQuery({ ...filters, limit: 500 })

  // Transform the data
  const requests = useMemo(() => data.requests as unknown as MaintenanceRequest[], [data.requests])

  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <Card>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <ViewToolbar
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <WorkOrderCalendar workOrders={requests} />

      {/* Info */}
      <div className='text-sm text-muted-foreground'>
        Showing {requests.filter(r => r.scheduledDate).length} scheduled work orders of {data.total} total
      </div>
    </div>
  )
}

// Create work order drawer
function CreateWorkOrderDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const createMutation = useCreateMaintenanceRequest()

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unitId: '',
    category: '' as MaintenanceCategory | '',
    priority: 'MEDIUM' as MaintenancePriority,
    permissionToEnter: true,
    preferredTimes: '',
  })

  // Fetch properties for the dropdown
  const { data: propertiesData } = usePropertiesQuery({})

  // Fetch units for the selected property
  const { data: unitsData } = useUnitsQuery(
    selectedPropertyId ? { propertyId: selectedPropertyId } : {}
  )

  const handleSubmit = async () => {
    if (!formData.unitId || !formData.title || !formData.description || !formData.category) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields',
      })
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        unitId: formData.unitId,
        title: formData.title,
        description: formData.description,
        category: formData.category as MaintenanceCategory,
        priority: formData.priority,
        permissionToEnter: formData.permissionToEnter,
        preferredTimes: formData.preferredTimes || undefined,
      })

      toast.success('Work Order Created', {
        description: `Work order ${result.requestNumber} has been created successfully.`,
      })

      onOpenChange(false)
      // Reset form
      setFormData({
        title: '',
        description: '',
        unitId: '',
        category: '',
        priority: 'MEDIUM',
        permissionToEnter: true,
        preferredTimes: '',
      })
      setSelectedPropertyId('')

      // Navigate to the new work order
      navigate({ to: '/app/maintenance/$workOrderId', params: { workOrderId: result.id } })
    } catch {
      toast.error('Error', {
        description: 'Failed to create work order. Please try again.',
      })
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className='mx-auto w-full max-w-lg'>
          <DrawerHeader>
            <DrawerTitle>Create Work Order</DrawerTitle>
            <DrawerDescription>
              Submit a new maintenance request. Fill in the details below.
            </DrawerDescription>
          </DrawerHeader>
          <div className='grid gap-4 px-4 pb-4'>
            <div className='space-y-2'>
              <Label htmlFor='wo-title'>Title *</Label>
              <Input
                id='wo-title'
                placeholder='Brief description of the issue'
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='wo-property'>Property *</Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={(value) => {
                    setSelectedPropertyId(value)
                    setFormData({ ...formData, unitId: '' })
                  }}
                >
                  <SelectTrigger id='wo-property'>
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
                <Label htmlFor='wo-unit'>Unit *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  disabled={!selectedPropertyId}
                >
                  <SelectTrigger id='wo-unit'>
                    <SelectValue placeholder={selectedPropertyId ? 'Select unit' : 'Select property first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsData?.units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='wo-category'>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as MaintenanceCategory })}
                >
                  <SelectTrigger id='wo-category'>
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
                <Label htmlFor='wo-priority'>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as MaintenancePriority })}
                >
                  <SelectTrigger id='wo-priority'>
                    <SelectValue placeholder='Select priority' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='EMERGENCY'>Emergency</SelectItem>
                    <SelectItem value='HIGH'>High</SelectItem>
                    <SelectItem value='MEDIUM'>Medium</SelectItem>
                    <SelectItem value='LOW'>Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='wo-description'>Description *</Label>
              <Textarea
                id='wo-description'
                placeholder='Detailed description of the issue...'
                className='min-h-24'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='wo-times'>Preferred Access Times</Label>
              <Input
                id='wo-times'
                placeholder='e.g., Weekdays 9am-5pm'
                value={formData.preferredTimes}
                onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='wo-permission'
                checked={formData.permissionToEnter}
                onCheckedChange={(checked) => setFormData({ ...formData, permissionToEnter: checked === true })}
              />
              <Label htmlFor='wo-permission' className='text-sm'>
                Tenant grants permission to enter
              </Label>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
              Create Work Order
            </Button>
            <DrawerClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function MaintenanceListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<Partial<MaintenanceFilters>>({})
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Emergency Alerts */}
      <EmergencyAlertBanner />

      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Maintenance</Typography.H2>
          <Typography.Muted>Manage work orders and maintenance requests</Typography.Muted>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <LuPlus className='mr-2 size-4' />
          New Work Order
        </Button>
      </div>

      {/* Drawer for New Work Order */}
      <CreateWorkOrderDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <MaintenanceStats />
      </Suspense>

      {/* View Toggle and Content */}
      {viewMode === 'list' ? (
        <Suspense fallback={<TableSkeleton />}>
          <MaintenanceDataTable
            filters={filters}
            setFilters={setFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<CalendarSkeleton />}>
          <MaintenanceCalendarView
            filters={filters}
            setFilters={setFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </Suspense>
      )}
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className='rounded-lg border'>
      <div className='flex items-center justify-between border-b p-4'>
        <Skeleton className='h-7 w-40' />
        <Skeleton className='h-8 w-20' />
      </div>
      <div className='grid grid-cols-7 border-b'>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className='h-8 w-full' />
        ))}
      </div>
      <div className='grid grid-cols-7'>
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className='h-[120px] w-full' />
        ))}
      </div>
    </div>
  )
}
