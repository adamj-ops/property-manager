'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LuBuilding2,
  LuCalendar,
  LuCircleCheck,
  LuCircleX,
  LuDog,
  LuMail,
  LuPencil,
  LuPhone,
  LuPlus,
  LuTrash2,
  LuUser,
} from 'react-icons/lu'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Typography } from '~/components/ui/typography'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableRowActions,
  DataTableToolbar,
  EditableBadgeCell,
  EditableCell,
} from '~/components/ui/data-table'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'

export const Route = createFileRoute('/app/tenants/')({
  component: TenantsListPage,
})

// Tenant type definition
interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  unit: string
  property: string
  rent: number
  petRent: number
  leaseStart: string
  leaseEnd: string
  status: 'current' | 'past' | 'pending'
  paymentStatus: 'current' | 'past_due'
  pets: { name: string; type: string; breed: string }[]
}

// Mock data for tenants
const initialTenants: Tenant[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(612) 555-0123',
    unit: '101',
    property: 'Humboldt Court',
    rent: 1250,
    petRent: 50,
    leaseStart: '2024-01-01',
    leaseEnd: '2024-12-31',
    status: 'current',
    paymentStatus: 'current',
    pets: [{ name: 'Max', type: 'Dog', breed: 'Golden Retriever' }],
  },
  {
    id: '2',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@email.com',
    phone: '(612) 555-0124',
    unit: '102',
    property: 'Humboldt Court',
    rent: 1050,
    petRent: 0,
    leaseStart: '2024-06-01',
    leaseEnd: '2025-05-31',
    status: 'current',
    paymentStatus: 'current',
    pets: [],
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@email.com',
    phone: '(612) 555-0156',
    unit: '204',
    property: 'Humboldt Court',
    rent: 1375,
    petRent: 0,
    leaseStart: '2024-03-01',
    leaseEnd: '2025-02-28',
    status: 'current',
    paymentStatus: 'past_due',
    pets: [],
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Parker',
    email: 'james.p@email.com',
    phone: '(612) 555-0198',
    unit: '305',
    property: 'Humboldt Court',
    rent: 1425,
    petRent: 50,
    leaseStart: '2023-06-01',
    leaseEnd: '2025-05-31',
    status: 'current',
    paymentStatus: 'current',
    pets: [{ name: 'Luna', type: 'Cat', breed: 'Tabby' }],
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.k@email.com',
    phone: '(612) 555-0167',
    unit: '402',
    property: 'Humboldt Court',
    rent: 1500,
    petRent: 0,
    leaseStart: '2024-08-15',
    leaseEnd: '2025-08-14',
    status: 'current',
    paymentStatus: 'current',
    pets: [],
  },
]

// Filter options
const statusOptions = [
  { label: 'Current', value: 'current', icon: LuCircleCheck },
  { label: 'Past', value: 'past', icon: LuCircleX },
  { label: 'Pending', value: 'pending', icon: LuCalendar },
]

const paymentStatusOptions = [
  {
    label: 'Current',
    value: 'current',
    variant: 'outline' as const,
    className: 'border-green-500 text-green-700',
  },
  {
    label: 'Past Due',
    value: 'past_due',
    variant: 'destructive' as const,
  },
]

const propertyOptions = [
  { label: 'Humboldt Court', value: 'Humboldt Court', icon: LuBuilding2 },
  { label: 'Maple Grove', value: 'Maple Grove', icon: LuBuilding2 },
  { label: 'Downtown Lofts', value: 'Downtown Lofts', icon: LuBuilding2 },
]

// Column definitions with editable cells
const columns: ColumnDef<Tenant>[] = [
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
    size: 40,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  },
  {
    accessorKey: 'name',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
    size: 250,
    cell: ({ row }) => {
      const isPastDue = row.original.paymentStatus === 'past_due'
      const isExpiringSoon =
        new Date(row.original.leaseEnd) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      return (
        <div className='flex items-center gap-3'>
          <div className='flex size-8 items-center justify-center rounded-full bg-primary/10'>
            <LuUser className='size-4 text-primary' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <Link
                to='/app/tenants/$tenantId'
                params={{ tenantId: row.original.id }}
                className='font-medium hover:underline'
              >
                {row.original.firstName} {row.original.lastName}
              </Link>
              {isPastDue && <Badge variant='destructive'>Past Due</Badge>}
              {isExpiringSoon && !isPastDue && (
                <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                  Expiring
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <LuMail className='size-3' />
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Unit' />,
    size: 120,
    cell: (props) => (
      <EditableCell
        {...props}
        type='text'
        className='font-medium'
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'property',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Property' />,
    size: 150,
    cell: (props) => (
      <EditableCell
        {...props}
        type='select'
        options={[
          { label: 'Humboldt Court', value: 'Humboldt Court' },
          { label: 'Maple Grove', value: 'Maple Grove' },
          { label: 'Downtown Lofts', value: 'Downtown Lofts' },
        ]}
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Phone' />,
    size: 140,
    cell: (props) => (
      <div className='flex items-center gap-1'>
        <LuPhone className='size-3 text-muted-foreground' />
        <EditableCell {...props} type='phone' />
      </div>
    ),
  },
  {
    accessorKey: 'rent',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Rent' />,
    size: 120,
    cell: (props) => <EditableCell {...props} type='currency' />,
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Payment' />,
    size: 120,
    cell: (props) => (
      <EditableBadgeCell
        {...props}
        options={paymentStatusOptions}
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'leaseEnd',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Lease End' />,
    size: 130,
    cell: (props) => (
      <div className='flex items-center gap-1'>
        <LuCalendar className='size-3 text-muted-foreground' />
        <EditableCell {...props} type='date' />
      </div>
    ),
  },
  {
    accessorKey: 'pets',
    header: 'Pets',
    size: 80,
    cell: ({ row }) => {
      const pets = row.original.pets
      if (pets.length === 0) return <span className='text-muted-foreground'>—</span>
      return (
        <div className='flex items-center gap-1 text-sm'>
          <LuDog className='size-3 text-muted-foreground' />
          {pets.length}
        </div>
      )
    },
    enableSorting: false,
    enableResizing: false,
  },
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => (
      <DataTableRowActions row={row}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/app/tenants/$tenantId' params={{ tenantId: row.original.id }}>
            <LuUser className='mr-2 size-4' />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LuPencil className='mr-2 size-4' />
          Edit tenant
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/app/communications'>
            <LuMail className='mr-2 size-4' />
            Send message
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>
          <LuTrash2 className='mr-2 size-4' />
          Delete tenant
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
    enableResizing: false,
  },
]

function TenantsListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tenants, setTenants] = useState(initialTenants)

  const activeTenants = tenants.filter((t) => t.status === 'current').length
  const tenantsWithPets = tenants.filter((t) => t.pets.length > 0).length
  const pastDueTenants = tenants.filter((t) => t.paymentStatus === 'past_due').length

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringLeases = tenants.filter((t) => {
    const leaseEnd = new Date(t.leaseEnd)
    return leaseEnd <= thirtyDaysFromNow && leaseEnd >= today
  }).length

  const handleDataChange = (newData: Tenant[]) => {
    setTenants(newData)
    // Here you would typically also save to the server
    console.log('Data updated:', newData)
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Tenants</Typography.H2>
          <Typography.Muted>Manage your tenant relationships</Typography.Muted>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <LuPlus className='mr-2 size-4' />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your property. Fill in the basic information to get started.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name</Label>
                  <Input id='firstName' placeholder='John' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name</Label>
                  <Input id='lastName' placeholder='Doe' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' placeholder='john.doe@email.com' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input id='phone' type='tel' placeholder='(612) 555-0123' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='property'>Property</Label>
                  <Select>
                    <SelectTrigger id='property'>
                      <SelectValue placeholder='Select property' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='humboldt'>Humboldt Court</SelectItem>
                      <SelectItem value='maple'>Maple Grove Apartments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='unit'>Unit</Label>
                  <Select>
                    <SelectTrigger id='unit'>
                      <SelectValue placeholder='Select unit' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='101'>Unit 101</SelectItem>
                      <SelectItem value='102'>Unit 102</SelectItem>
                      <SelectItem value='103'>Unit 103</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Add Tenant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>{expiringLeases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Past Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>{pastDueTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>With Pets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{tenantsWithPets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className='pt-6'>
          <DataTable
            columns={columns}
            data={tenants}
            onDataChange={handleDataChange}
            enableColumnResizing
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchKey='name'
                searchPlaceholder='Search tenants...'
                filterComponent={
                  <div className='flex gap-2'>
                    {table.getColumn('property') && (
                      <DataTableFacetedFilter
                        column={table.getColumn('property')}
                        title='Property'
                        options={propertyOptions}
                      />
                    )}
                    {table.getColumn('paymentStatus') && (
                      <DataTableFacetedFilter
                        column={table.getColumn('paymentStatus')}
                        title='Payment'
                        options={[
                          { label: 'Current', value: 'current' },
                          { label: 'Past Due', value: 'past_due' },
                        ]}
                      />
                    )}
                  </div>
                }
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Tips */}
      <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
        <p className='font-medium text-foreground'>Airtable-like features:</p>
        <ul className='mt-2 list-inside list-disc space-y-1'>
          <li>Click any cell to edit inline (Unit, Property, Phone, Rent, Payment Status, Lease End)</li>
          <li>Drag column borders to resize columns</li>
          <li>Use faceted filters to filter by Property or Payment status</li>
          <li>Click column headers to sort</li>
          <li>Use the View button to toggle column visibility</li>
        </ul>
      </div>
    </div>
  )
}
