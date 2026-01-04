import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import { LuArrowLeft, LuFilter, LuHouse, LuPlus, LuSearch, LuTrash2, LuPencil } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { usePropertyQuery } from '~/services/properties.query'
import { useUnitsQuery, useDeleteUnit } from '~/services/units.query'
import type { UnitStatus } from '~/services/units.schema'

export const Route = createFileRoute('/app/properties/$propertyId/units')({
  component: PropertyUnitsPage,
})

function PropertyUnitsPage() {
  const { propertyId } = Route.useParams()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <UnitsContent propertyId={propertyId} />
    </Suspense>
  )
}

interface Unit {
  id: string
  unitNumber: string
  status: UnitStatus
  bedrooms: number
  bathrooms: number
  sqFt: number | null
  marketRent: number
  currentRent: number | null
  petFriendly: boolean
  leases: {
    id: string
    status: string
    endDate: Date
    tenant: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

function UnitsContent({ propertyId }: { propertyId: string }) {
  const { data: property } = usePropertyQuery(propertyId)
  const { data } = useUnitsQuery({ propertyId })
  const deleteUnit = useDeleteUnit()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)

  const units = data.units as Unit[]

  // Filter units
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      !searchQuery ||
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalUnits = units.length
  const occupiedCount = units.filter((u) => u.status === 'OCCUPIED').length
  const vacantCount = units.filter((u) => u.status === 'VACANT').length
  const maintenanceCount = units.filter((u) => u.status === 'UNDER_RENOVATION').length

  const handleDeleteClick = (unit: Unit) => {
    setUnitToDelete(unit)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return

    try {
      await deleteUnit.mutateAsync(unitToDelete.id)
      toast.success('Unit deleted successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete unit'
      )
    } finally {
      setDeleteDialogOpen(false)
      setUnitToDelete(null)
    }
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/properties/$propertyId' params={{ propertyId }}>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <Typography.H2>Units</Typography.H2>
          <Typography.Muted>{property.name}</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/properties/$propertyId/units/new' params={{ propertyId }}>
            <LuPlus className='mr-2 size-4' />
            Add Unit
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUnits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{occupiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Vacant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{vacantCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Under Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>{maintenanceCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search units...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[180px]'>
            <LuFilter className='mr-2 size-4' />
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='VACANT'>Vacant</SelectItem>
            <SelectItem value='OCCUPIED'>Occupied</SelectItem>
            <SelectItem value='NOTICE_GIVEN'>Notice Given</SelectItem>
            <SelectItem value='UNDER_RENOVATION'>Under Renovation</SelectItem>
            <SelectItem value='OFF_MARKET'>Off Market</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Units List */}
      {filteredUnits.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <LuHouse className='size-12 text-muted-foreground' />
            <Typography.H4 className='mt-4'>No units found</Typography.H4>
            <Typography.Muted>
              {units.length === 0
                ? 'Add your first unit to get started.'
                : 'Try adjusting your search or filters.'}
            </Typography.Muted>
            {units.length === 0 && (
              <Button asChild className='mt-4'>
                <Link to='/app/properties/$propertyId/units/new' params={{ propertyId }}>
                  <LuPlus className='mr-2 size-4' />
                  Add Unit
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              propertyId={propertyId}
              onDelete={() => handleDeleteClick(unit)}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Unit {unitToDelete?.unitNumber}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface UnitCardProps {
  unit: Unit
  propertyId: string
  onDelete: () => void
}

function UnitCard({ unit, propertyId, onDelete }: UnitCardProps) {
  const statusConfig: Record<
    UnitStatus,
    { label: string; variant: 'default' | 'secondary' | 'outline'; className?: string }
  > = {
    OCCUPIED: { label: 'Occupied', variant: 'default', className: 'bg-green-500' },
    VACANT: { label: 'Vacant', variant: 'secondary' },
    NOTICE_GIVEN: { label: 'Notice Given', variant: 'outline', className: 'border-orange-500 text-orange-600' },
    UNDER_RENOVATION: { label: 'Maintenance', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
    OFF_MARKET: { label: 'Off Market', variant: 'outline' },
  }

  const status = statusConfig[unit.status]
  const activeLease = unit.leases.find((l) => l.status === 'ACTIVE')
  const tenant = activeLease?.tenant

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
              <LuHouse className='size-5 text-muted-foreground' />
            </div>
            <div>
              <CardTitle className='text-base'>Unit {unit.unitNumber}</CardTitle>
              <p className='text-sm text-muted-foreground'>
                {unit.bedrooms}BR / {unit.bathrooms}BA
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='size-8'>
                  <span className='sr-only'>Open menu</span>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <circle cx='12' cy='12' r='1' />
                    <circle cx='12' cy='5' r='1' />
                    <circle cx='12' cy='19' r='1' />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem asChild>
                  <Link
                    to='/app/properties/$propertyId/units/$unitId/edit'
                    params={{ propertyId, unitId: unit.id }}
                  >
                    <LuPencil className='mr-2 size-4' />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='text-destructive' onClick={onDelete}>
                  <LuTrash2 className='mr-2 size-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div>
            <p className='text-muted-foreground'>Size</p>
            <p className='font-medium'>{unit.sqFt ? `${unit.sqFt} sq ft` : 'N/A'}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Rent</p>
            <p className='font-medium'>
              ${(unit.currentRent || unit.marketRent).toLocaleString()}/mo
            </p>
          </div>
        </div>

        {tenant && (
          <div className='rounded-lg bg-muted p-3'>
            <p className='text-xs text-muted-foreground'>Current Tenant</p>
            <p className='text-sm font-medium'>
              {tenant.firstName} {tenant.lastName}
            </p>
            {activeLease && (
              <p className='text-xs text-muted-foreground'>
                Lease ends: {new Date(activeLease.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {unit.petFriendly && (
          <Badge variant='outline' className='text-xs'>
            Pet Friendly
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div className='space-y-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
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
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-10 w-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-20 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
