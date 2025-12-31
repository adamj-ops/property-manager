'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LuBuilding2,
  LuDollarSign,
  LuEye,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuUsers,
  LuWrench,
} from 'react-icons/lu'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
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

export const Route = createFileRoute('/app/properties/')({
  component: PropertiesListPage,
})

// Property type
interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  type: string
  totalUnits: number
  occupiedUnits: number
  monthlyRevenue: number
  expectedRevenue: number
  yearBuilt: number
  openWorkOrders: number
  expiringLeases: number
}

// Mock data for properties
const properties: Property[] = [
  {
    id: '1',
    name: 'Humboldt Court Community',
    address: '1234 Humboldt Ave N',
    city: 'Brooklyn Center',
    state: 'MN',
    zipCode: '55430',
    type: 'Multi-Family',
    totalUnits: 45,
    occupiedUnits: 42,
    monthlyRevenue: 42350,
    expectedRevenue: 45000,
    yearBuilt: 1975,
    openWorkOrders: 3,
    expiringLeases: 2,
  },
  {
    id: '2',
    name: 'Maple Grove Apartments',
    address: '5678 Maple Lane',
    city: 'Maple Grove',
    state: 'MN',
    zipCode: '55369',
    type: 'Multi-Family',
    totalUnits: 28,
    occupiedUnits: 27,
    monthlyRevenue: 31500,
    expectedRevenue: 32200,
    yearBuilt: 1998,
    openWorkOrders: 1,
    expiringLeases: 1,
  },
  {
    id: '3',
    name: 'Downtown Lofts',
    address: '100 Main Street',
    city: 'Minneapolis',
    state: 'MN',
    zipCode: '55401',
    type: 'Multi-Family',
    totalUnits: 24,
    occupiedUnits: 24,
    monthlyRevenue: 38400,
    expectedRevenue: 38400,
    yearBuilt: 2015,
    openWorkOrders: 0,
    expiringLeases: 0,
  },
]

// Column definitions for data table
const columns: ColumnDef<Property>[] = [
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Property' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
          <LuBuilding2 className='size-5 text-primary' />
        </div>
        <div>
          <Link
            to='/app/properties/$propertyId'
            params={{ propertyId: row.original.id }}
            className='font-medium hover:underline'
          >
            {row.original.name}
          </Link>
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <LuMapPin className='size-3' />
            {row.original.city}, {row.original.state}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'occupancy',
    accessorFn: (row) => `${row.occupiedUnits}/${row.totalUnits}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Occupancy' />
    ),
    cell: ({ row }) => {
      const occupancyRate = Math.round(
        (row.original.occupiedUnits / row.original.totalUnits) * 100
      )
      return (
        <div>
          <div className='font-medium'>
            {row.original.occupiedUnits}/{row.original.totalUnits} units
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-16 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full bg-primary'
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <span className='text-xs text-muted-foreground'>{occupancyRate}%</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'monthlyRevenue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Revenue' />
    ),
    cell: ({ row }) => {
      const collectionRate = Math.round(
        (row.original.monthlyRevenue / row.original.expectedRevenue) * 100
      )
      return (
        <div>
          <div className='font-medium'>
            ${row.original.monthlyRevenue.toLocaleString()}
          </div>
          <span className='text-xs text-muted-foreground'>
            {collectionRate}% collected
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const vacantUnits = row.original.totalUnits - row.original.occupiedUnits
      const hasIssues = vacantUnits > 0 || row.original.openWorkOrders > 0 || row.original.expiringLeases > 0

      return (
        <div className='flex flex-wrap gap-1'>
          {vacantUnits > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {vacantUnits} vacant
            </Badge>
          )}
          {row.original.openWorkOrders > 0 && (
            <Badge variant='outline' className='border-yellow-500 text-yellow-600 text-xs'>
              {row.original.openWorkOrders} WO
            </Badge>
          )}
          {row.original.expiringLeases > 0 && (
            <Badge variant='outline' className='border-orange-500 text-orange-600 text-xs'>
              {row.original.expiringLeases} expiring
            </Badge>
          )}
          {!hasIssues && (
            <Badge variant='outline' className='border-green-500 text-green-600 text-xs'>
              All good
            </Badge>
          )}
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
          <Link to='/app/properties/$propertyId' params={{ propertyId: row.original.id }}>
            <LuEye className='mr-2 size-4' />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/app/properties/$propertyId/units' params={{ propertyId: row.original.id }}>
            <LuUsers className='mr-2 size-4' />
            View units
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LuPencil className='mr-2 size-4' />
          Edit property
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>
          <LuTrash2 className='mr-2 size-4' />
          Delete property
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
]

function PropertiesListPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0)
  const totalOccupied = properties.reduce((sum, p) => sum + p.occupiedUnits, 0)
  const totalRevenue = properties.reduce((sum, p) => sum + p.monthlyRevenue, 0)

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Properties</Typography.H2>
          <Typography.Muted>Manage your property portfolio</Typography.Muted>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <LuPlus className='mr-2 size-4' />
              Add Property
            </Button>
          </SheetTrigger>
          <SheetContent className='sm:max-w-[540px]'>
            <SheetHeader>
              <SheetTitle>Add New Property</SheetTitle>
              <SheetDescription>
                Add a new property to your portfolio. Fill in the details below.
              </SheetDescription>
            </SheetHeader>
            <div className='grid gap-4 py-6'>
              <div className='space-y-2'>
                <Label htmlFor='propertyName'>Property Name</Label>
                <Input id='propertyName' placeholder='e.g., Sunrise Apartments' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='address'>Street Address</Label>
                <Input id='address' placeholder='123 Main Street' />
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input id='city' placeholder='Minneapolis' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='state'>State</Label>
                  <Select>
                    <SelectTrigger id='state'>
                      <SelectValue placeholder='State' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MN'>Minnesota</SelectItem>
                      <SelectItem value='WI'>Wisconsin</SelectItem>
                      <SelectItem value='IA'>Iowa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='zip'>ZIP Code</Label>
                  <Input id='zip' placeholder='55401' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='type'>Property Type</Label>
                  <Select>
                    <SelectTrigger id='type'>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='multi-family'>Multi-Family</SelectItem>
                      <SelectItem value='single-family'>Single Family</SelectItem>
                      <SelectItem value='commercial'>Commercial</SelectItem>
                      <SelectItem value='mixed-use'>Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='units'>Total Units</Label>
                  <Input id='units' type='number' placeholder='0' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='yearBuilt'>Year Built</Label>
                  <Input id='yearBuilt' type='number' placeholder='2000' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='expectedRevenue'>Expected Monthly Revenue</Label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                      $
                    </span>
                    <Input id='expectedRevenue' type='number' placeholder='0' className='pl-7' />
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button variant='outline' onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setSheetOpen(false)}>Add Property</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuBuilding2 className='size-4 text-muted-foreground' />
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuUsers className='size-4 text-muted-foreground' />
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUnits}</div>
            <p className='text-xs text-muted-foreground'>{totalOccupied} occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuWrench className='size-4 text-muted-foreground' />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round((totalOccupied / totalUnits) * 100)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <LuDollarSign className='size-4 text-muted-foreground' />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className='pt-6'>
          <DataTable
            columns={columns}
            data={properties}
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchKey='name'
                searchPlaceholder='Search properties...'
                actionComponent={
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      All
                    </Button>
                    <Button variant='ghost' size='sm'>
                      Multi-Family
                    </Button>
                    <Button variant='ghost' size='sm'>
                      Single Family
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
