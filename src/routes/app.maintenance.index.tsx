'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LuCalendar,
  LuClock,
  LuEye,
  LuList,
  LuPencil,
  LuPlus,
  LuTrash2,
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

export const Route = createFileRoute('/app/maintenance/')({
  component: MaintenanceListPage,
})

// Work order type
interface WorkOrder {
  id: string
  title: string
  description: string
  unit: string
  property: string
  tenant: string
  category: string
  priority: 'emergency' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'scheduled' | 'overdue' | 'completed'
  createdAt: string
  assignedTo: string | null
  eta: string | null
  completedAt?: string
}

// Mock data for work orders
const workOrders: WorkOrder[] = [
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
    eta: null,
  },
]

// Priority and status configs
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

// Column definitions for data table
const columns: ColumnDef<WorkOrder>[] = [
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
      const priority = priorityConfig[row.original.priority]
      const status = statusConfig[row.original.status]

      return (
        <div className='flex items-center gap-3'>
          <div
            className={`flex size-10 items-center justify-center rounded-lg ${
              row.original.priority === 'emergency' ? 'bg-destructive/10' : 'bg-muted'
            }`}
          >
            {row.original.priority === 'emergency' ? (
              <LuTriangleAlert className='size-5 text-destructive' />
            ) : (
              <LuWrench className='size-5 text-muted-foreground' />
            )}
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>#{row.original.id}</span>
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
        <div className='font-medium'>Unit {row.original.unit}</div>
        <div className='text-xs text-muted-foreground'>{row.original.property}</div>
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
        <span className='text-sm'>{row.original.tenant}</span>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.category}</Badge>
    ),
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
    cell: ({ row }) =>
      row.original.assignedTo ? (
        <span className='text-sm'>{row.original.assignedTo}</span>
      ) : (
        <span className='text-sm text-muted-foreground'>Unassigned</span>
      ),
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
        <DropdownMenuItem>
          <LuPencil className='mr-2 size-4' />
          Edit work order
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>
          <LuTrash2 className='mr-2 size-4' />
          Delete
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
]

function MaintenanceListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

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
        <Button onClick={() => setDrawerOpen(true)}>
          <LuPlus className='mr-2 size-4' />
          New Work Order
        </Button>
      </div>

      {/* Drawer for New Work Order */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                <Label htmlFor='wo-title'>Title</Label>
                <Input id='wo-title' placeholder='Brief description of the issue' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='wo-property'>Property</Label>
                  <Select>
                    <SelectTrigger id='wo-property'>
                      <SelectValue placeholder='Select property' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='humboldt'>Humboldt Court</SelectItem>
                      <SelectItem value='maple'>Maple Grove</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='wo-unit'>Unit</Label>
                  <Select>
                    <SelectTrigger id='wo-unit'>
                      <SelectValue placeholder='Select unit' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='101'>Unit 101</SelectItem>
                      <SelectItem value='102'>Unit 102</SelectItem>
                      <SelectItem value='204'>Unit 204</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='wo-category'>Category</Label>
                  <Select>
                    <SelectTrigger id='wo-category'>
                      <SelectValue placeholder='Category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='plumbing'>Plumbing</SelectItem>
                      <SelectItem value='hvac'>HVAC</SelectItem>
                      <SelectItem value='electrical'>Electrical</SelectItem>
                      <SelectItem value='appliance'>Appliance</SelectItem>
                      <SelectItem value='general'>General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='wo-priority'>Priority</Label>
                  <Select>
                    <SelectTrigger id='wo-priority'>
                      <SelectValue placeholder='Priority' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='emergency'>Emergency</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='medium'>Medium</SelectItem>
                      <SelectItem value='low'>Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='wo-description'>Description</Label>
                <Textarea
                  id='wo-description'
                  placeholder='Detailed description of the issue...'
                  className='min-h-24'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='wo-assignee'>Assign To (Optional)</Label>
                <Select>
                  <SelectTrigger id='wo-assignee'>
                    <SelectValue placeholder='Select vendor' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='mikes'>Mike's HVAC Service</SelectItem>
                    <SelectItem value='city'>City Plumbing Co.</SelectItem>
                    <SelectItem value='electric'>Electric Pros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={() => setDrawerOpen(false)}>Create Work Order</Button>
              <DrawerClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuList className='size-4 text-muted-foreground' />
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{openOrders}</div>
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
            <div className='text-2xl font-bold text-blue-600'>{inProgressOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuCalendar className='size-4 text-yellow-600' />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{scheduledOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuTriangleAlert className='size-4 text-destructive' />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>{overdueOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuClock className='size-4 text-muted-foreground' />
              Avg. Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1.2 hrs</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className='pt-6'>
          <DataTable
            columns={columns}
            data={workOrders}
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchKey='title'
                searchPlaceholder='Search work orders...'
                actionComponent={
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      <LuList className='mr-2 size-4' />
                      List
                    </Button>
                    <Button variant='ghost' size='sm'>
                      <LuCalendar className='mr-2 size-4' />
                      Calendar
                    </Button>
                    <div className='border-l mx-2' />
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
                }
              />
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
