'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
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

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Skeleton } from '~/components/ui/skeleton'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Typography } from '~/components/ui/typography'
import {
  usePropertiesQuery,
  usePropertyStatsQuery,
  useDeleteProperty,
} from '~/services/properties.query'
import type { PropertyType, PropertyStatus } from '~/services/properties.schema'

export const Route = createFileRoute('/app/properties/')({
  component: PropertiesListPage,
})

// Property type from API
interface Property {
  id: string
  name: string
  addressLine1: string
  city: string
  state: string
  zipCode: string
  type: PropertyType
  status: PropertyStatus
  totalUnits: number
  yearBuilt: number | null
  units: {
    id: string
    status: string
    marketRent: number | null
    currentRent: number | null
  }[]
  _count: {
    units: number
    expenses: number
  }
}

function PropertiesListPage() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Properties</Typography.H2>
          <Typography.Muted>Manage your property portfolio</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/properties/new'>
            <LuPlus className='mr-2 size-4' />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<DataTableSkeleton />}>
        <PropertiesTable />
      </Suspense>
    </div>
  )
}

function StatsCards() {
  const { data: stats } = usePropertyStatsQuery()

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuBuilding2 className='size-4 text-muted-foreground' />
            Total Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.totalProperties}</div>
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
          <div className='text-2xl font-bold'>{stats.totalUnits}</div>
          <p className='text-xs text-muted-foreground'>{stats.occupiedUnits} occupied</p>
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
          <div className='text-2xl font-bold'>{stats.occupancyRate}%</div>
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
          <div className='text-2xl font-bold'>
            ${stats.totalMonthlyRent.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PropertiesTable() {
  const { data } = usePropertiesQuery()
  const deleteProperty = useDeleteProperty()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return

    try {
      await deleteProperty.mutateAsync(propertyToDelete.id)
      toast.success('Property deleted successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete property'
      )
    } finally {
      setDeleteDialogOpen(false)
      setPropertyToDelete(null)
    }
  }

  // Column definitions for data table
  const columns: ColumnDef<Property>[] = [
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
      accessorFn: (row) => {
        const occupiedUnits = row.units.filter((u) => u.status === 'OCCUPIED').length
        return `${occupiedUnits}/${row.units.length}`
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Occupancy' />
      ),
      cell: ({ row }) => {
        const occupiedUnits = row.original.units.filter((u) => u.status === 'OCCUPIED').length
        const totalUnits = row.original.units.length
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

        return (
          <div>
            <div className='font-medium'>
              {occupiedUnits}/{totalUnits} units
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
      accessorFn: (row) => {
        return row.units
          .filter((u) => u.status === 'OCCUPIED')
          .reduce((sum, u) => sum + Number(u.currentRent || u.marketRent || 0), 0)
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Revenue' />
      ),
      cell: ({ row }) => {
        const monthlyRevenue = row.original.units
          .filter((u) => u.status === 'OCCUPIED')
          .reduce((sum, u) => sum + Number(u.currentRent || u.marketRent || 0), 0)
        const expectedRevenue = row.original.units.reduce(
          (sum, u) => sum + Number(u.marketRent || 0),
          0
        )
        const collectionRate =
          expectedRevenue > 0 ? Math.round((monthlyRevenue / expectedRevenue) * 100) : 0

        return (
          <div>
            <div className='font-medium'>${monthlyRevenue.toLocaleString()}</div>
            <span className='text-xs text-muted-foreground'>
              {collectionRate}% of expected
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const vacantUnits = row.original.units.filter((u) => u.status === 'VACANT').length
        const hasIssues = vacantUnits > 0

        return (
          <div className='flex flex-wrap gap-1'>
            {vacantUnits > 0 && (
              <Badge variant='secondary' className='text-xs'>
                {vacantUnits} vacant
              </Badge>
            )}
            {!hasIssues && (
              <Badge variant='outline' className='border-green-500 text-green-600 text-xs'>
                Fully occupied
              </Badge>
            )}
            <Badge variant='outline' className='text-xs'>
              {formatPropertyType(row.original.type)}
            </Badge>
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
            <Link
              to='/app/properties/$propertyId'
              params={{ propertyId: row.original.id }}
            >
              <LuEye className='mr-2 size-4' />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to='/app/properties/$propertyId/units'
              params={{ propertyId: row.original.id }}
            >
              <LuUsers className='mr-2 size-4' />
              View units
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to='/app/properties/$propertyId/edit'
              params={{ propertyId: row.original.id }}
            >
              <LuPencil className='mr-2 size-4' />
              Edit property
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive'
            onClick={() => handleDeleteClick(row.original)}
          >
            <LuTrash2 className='mr-2 size-4' />
            Delete property
          </DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardContent className='pt-6'>
          <DataTable
            columns={columns}
            data={data.properties}
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchKey='name'
                searchPlaceholder='Search properties...'
              />
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{propertyToDelete?.name}"? This action
              cannot be undone and will also delete all associated units.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DataTableSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-64' />
          <div className='space-y-2'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatPropertyType(type: PropertyType): string {
  const typeMap: Record<PropertyType, string> = {
    SINGLE_FAMILY: 'Single Family',
    MULTI_FAMILY: 'Multi-Family',
    APARTMENT: 'Apartment',
    CONDO: 'Condo',
    TOWNHOUSE: 'Townhouse',
    COMMERCIAL: 'Commercial',
    MIXED_USE: 'Mixed Use',
  }
  return typeMap[type] || type
}
