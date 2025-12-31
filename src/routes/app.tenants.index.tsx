'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LuCalendar, LuDog, LuMail, LuPencil, LuPhone, LuPlus, LuTrash2, LuUser } from 'react-icons/lu'
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
  DataTableRowActions,
  DataTableToolbar,
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
const tenants: Tenant[] = [
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

// Column definitions for the data table
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
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const isPastDue = row.original.paymentStatus === 'past_due'
      const isExpiringSoon = new Date(row.original.leaseEnd) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unit' />
    ),
    cell: ({ row }) => (
      <div>
        <span className='font-medium'>Unit {row.original.unit}</span>
        <p className='text-xs text-muted-foreground'>{row.original.property}</p>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Contact' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1 text-sm'>
        <LuPhone className='size-3 text-muted-foreground' />
        {row.original.phone}
      </div>
    ),
  },
  {
    accessorKey: 'rent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rent' />
    ),
    cell: ({ row }) => {
      const total = row.original.rent + row.original.petRent
      return (
        <div className='font-medium'>
          ${total.toLocaleString()}
          {row.original.petRent > 0 && (
            <span className='ml-1 text-xs text-muted-foreground'>
              (+${row.original.petRent} pet)
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'leaseEnd',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Lease End' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1 text-sm'>
        <LuCalendar className='size-3 text-muted-foreground' />
        {new Date(row.original.leaseEnd).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: 'pets',
    header: 'Pets',
    cell: ({ row }) => {
      const pets = row.original.pets
      if (pets.length === 0) return <span className='text-muted-foreground'>—</span>
      return (
        <div className='flex items-center gap-1 text-sm'>
          <LuDog className='size-3 text-muted-foreground' />
          {pets.length} {pets.length === 1 ? 'pet' : 'pets'}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
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
  },
]

function TenantsListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const activeTenants = tenants.filter(t => t.status === 'current').length
  const tenantsWithPets = tenants.filter(t => t.pets.length > 0).length
  const pastDueTenants = tenants.filter(t => t.paymentStatus === 'past_due').length

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringLeases = tenants.filter(t => {
    const leaseEnd = new Date(t.leaseEnd)
    return leaseEnd <= thirtyDaysFromNow && leaseEnd >= today
  }).length

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
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchKey='name'
                searchPlaceholder='Search tenants...'
                actionComponent={
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      All
                    </Button>
                    <Button variant='ghost' size='sm'>
                      Active
                    </Button>
                    <Button variant='ghost' size='sm'>
                      Expiring
                    </Button>
                    <Button variant='ghost' size='sm'>
                      Past Due
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
