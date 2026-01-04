import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { LuArrowLeft, LuFilter, LuHouse, LuLayoutGrid, LuList, LuLoaderCircle, LuPlus, LuSearch, LuTrash2, LuPencil, LuX } from 'react-icons/lu'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Typography } from '~/components/ui/typography'
import { usePropertyQuery } from '~/services/properties.query'
import { useUnitsQuery, useDeleteUnit, useUpdateUnit, useBulkDeleteUnits } from '~/services/units.query'
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

// Status options for inline editing
const unitStatusOptions = [
  { value: 'VACANT', label: 'Vacant', variant: 'secondary' as const },
  { value: 'OCCUPIED', label: 'Occupied', variant: 'default' as const, className: 'bg-green-500' },
  { value: 'NOTICE_GIVEN', label: 'Notice Given', variant: 'outline' as const, className: 'border-orange-500 text-orange-600' },
  { value: 'UNDER_RENOVATION', label: 'Under Renovation', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
  { value: 'OFF_MARKET', label: 'Off Market', variant: 'outline' as const },
]

function UnitsContent({ propertyId }: { propertyId: string }) {
  const { data: property } = usePropertyQuery(propertyId)
  const { data } = useUnitsQuery({ propertyId })
  const deleteUnit = useDeleteUnit()
  const updateUnit = useUpdateUnit()
  const bulkDeleteUnits = useBulkDeleteUnits()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const units = data.units as Unit[]

  // Handler for inline status updates
  const handleStatusChange = useCallback(
    async (unit: Unit, newStatus: UnitStatus) => {
      try {
        await updateUnit.mutateAsync({ id: unit.id, status: newStatus })
        toast.success(`Unit ${unit.unitNumber} status updated`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update status')
      }
    },
    [updateUnit]
  )

  // Handler for inline rent updates
  const handleRentChange = useCallback(
    async (unit: Unit, field: 'marketRent' | 'currentRent', value: number) => {
      try {
        await updateUnit.mutateAsync({ id: unit.id, [field]: value })
        toast.success(`Unit ${unit.unitNumber} rent updated`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update rent')
      }
    },
    [updateUnit]
  )

  // Selection handlers
  const toggleUnitSelection = useCallback((unitId: string) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedUnitIds(new Set())
  }, [])

  // Bulk delete handler
  const handleBulkDeleteConfirm = async () => {
    try {
      const ids = Array.from(selectedUnitIds)
      const result = await bulkDeleteUnits.mutateAsync({ ids })
      toast.success(`Deleted ${result.deletedCount} unit(s)`)
      setSelectedUnitIds(new Set())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete units')
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  // Filter units
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      !searchQuery ||
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Toggle all selection (defined after filteredUnits)
  const toggleAllSelection = () => {
    if (selectedUnitIds.size === filteredUnits.length) {
      setSelectedUnitIds(new Set())
    } else {
      setSelectedUnitIds(new Set(filteredUnits.map((u) => u.id)))
    }
  }

  // Get selected units that can be deleted (no active leases)
  const selectedUnits = filteredUnits.filter((u) => selectedUnitIds.has(u.id))
  const selectedWithActiveLeases = selectedUnits.filter((u) =>
    u.leases.some((l) => l.status === 'ACTIVE')
  )
  const canBulkDelete = selectedUnits.length > 0 && selectedWithActiveLeases.length === 0

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
        <div className='flex rounded-lg border p-1'>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size='icon'
            className='size-8'
            onClick={() => setViewMode('table')}
          >
            <LuList className='size-4' />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size='icon'
            className='size-8'
            onClick={() => setViewMode('grid')}
          >
            <LuLayoutGrid className='size-4' />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUnitIds.size > 0 && (
        <div className='flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2'>
          <div className='flex items-center gap-2'>
            <div className='flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground'>
              {selectedUnitIds.size}
            </div>
            <span className='text-sm font-medium'>
              {selectedUnitIds.size === 1 ? 'unit selected' : 'units selected'}
            </span>
          </div>
          <div className='h-4 w-px bg-border' />
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setBulkDeleteDialogOpen(true)}
            disabled={!canBulkDelete}
          >
            <LuTrash2 className='mr-2 size-4' />
            Delete
          </Button>
          {selectedWithActiveLeases.length > 0 && (
            <span className='text-xs text-muted-foreground'>
              {selectedWithActiveLeases.length} unit(s) have active leases
            </span>
          )}
          <div className='flex-1' />
          <Button variant='ghost' size='sm' onClick={clearSelection}>
            <LuX className='mr-1 size-4' />
            Clear
          </Button>
        </div>
      )}

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
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className='pt-6'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>
                    <Checkbox
                      checked={selectedUnitIds.size === filteredUnits.length && filteredUnits.length > 0}
                      onCheckedChange={toggleAllSelection}
                      aria-label='Select all units'
                    />
                  </TableHead>
                  <TableHead className='w-24'>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-20'>Beds</TableHead>
                  <TableHead className='w-20'>Baths</TableHead>
                  <TableHead className='w-24'>Sq Ft</TableHead>
                  <TableHead className='w-28'>Market Rent</TableHead>
                  <TableHead className='w-28'>Current Rent</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className='w-16'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <UnitTableRow
                    key={unit.id}
                    unit={unit}
                    propertyId={propertyId}
                    isSelected={selectedUnitIds.has(unit.id)}
                    onToggleSelect={() => toggleUnitSelection(unit.id)}
                    onStatusChange={handleStatusChange}
                    onRentChange={handleRentChange}
                    onDelete={() => handleDeleteClick(unit)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              propertyId={propertyId}
              onStatusChange={handleStatusChange}
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedUnitIds.size} Unit(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUnitIds.size} unit(s)? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleBulkDeleteConfirm}
              disabled={bulkDeleteUnits.isPending}
            >
              {bulkDeleteUnits.isPending ? (
                <>
                  <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Table row component with inline editing
interface UnitTableRowProps {
  unit: Unit
  propertyId: string
  isSelected: boolean
  onToggleSelect: () => void
  onStatusChange: (unit: Unit, newStatus: UnitStatus) => Promise<void>
  onRentChange: (unit: Unit, field: 'marketRent' | 'currentRent', value: number) => Promise<void>
  onDelete: () => void
}

function UnitTableRow({ unit, propertyId, isSelected, onToggleSelect, onStatusChange, onRentChange, onDelete }: UnitTableRowProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const activeLease = unit.leases.find((l) => l.status === 'ACTIVE')
  const tenant = activeLease?.tenant
  const currentOption = unitStatusOptions.find((o) => o.value === unit.status)

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field)
    setEditValue(value)
  }

  const handleSaveRent = async (field: 'marketRent' | 'currentRent') => {
    const numValue = parseFloat(editValue)
    if (!isNaN(numValue) && numValue >= 0) {
      setIsSaving(true)
      try {
        await onRentChange(unit, field, numValue)
      } finally {
        setIsSaving(false)
      }
    }
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'marketRent' | 'currentRent') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRent(field)
    }
    if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  return (
    <TableRow className={`hover:bg-muted/30 ${isSelected ? 'bg-muted/50' : ''}`}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select unit ${unit.unitNumber}`}
        />
      </TableCell>
      <TableCell className='font-medium'>
        <Link
          to='/app/properties/$propertyId/units/$unitId/edit'
          params={{ propertyId, unitId: unit.id }}
          className='hover:underline'
        >
          {unit.unitNumber}
        </Link>
      </TableCell>
      <TableCell>
        <Select
          value={unit.status}
          onValueChange={(value) => onStatusChange(unit, value as UnitStatus)}
        >
          <SelectTrigger className='h-8 w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0'>
            <Badge
              variant={currentOption?.variant || 'secondary'}
              className={currentOption?.className}
            >
              {currentOption?.label || unit.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {unitStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <Badge variant={option.variant} className={option.className}>
                  {option.label}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>{unit.bedrooms}</TableCell>
      <TableCell>{unit.bathrooms}</TableCell>
      <TableCell>{unit.sqFt ? unit.sqFt.toLocaleString() : '—'}</TableCell>
      <TableCell>
        {editingField === 'marketRent' ? (
          <div className='flex items-center gap-1'>
            <span className='text-muted-foreground'>$</span>
            <Input
              type='number'
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveRent('marketRent')}
              onKeyDown={(e) => handleKeyDown(e, 'marketRent')}
              className='h-7 w-20'
              disabled={isSaving}
            />
            {isSaving && <LuLoaderCircle className='size-4 animate-spin' />}
          </div>
        ) : (
          <div
            onClick={() => handleStartEdit('marketRent', String(unit.marketRent))}
            className='cursor-pointer rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/50'
          >
            ${unit.marketRent.toLocaleString()}
          </div>
        )}
      </TableCell>
      <TableCell>
        {editingField === 'currentRent' ? (
          <div className='flex items-center gap-1'>
            <span className='text-muted-foreground'>$</span>
            <Input
              type='number'
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveRent('currentRent')}
              onKeyDown={(e) => handleKeyDown(e, 'currentRent')}
              className='h-7 w-20'
              disabled={isSaving}
            />
            {isSaving && <LuLoaderCircle className='size-4 animate-spin' />}
          </div>
        ) : (
          <div
            onClick={() => handleStartEdit('currentRent', String(unit.currentRent || unit.marketRent))}
            className='cursor-pointer rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/50'
          >
            {unit.currentRent ? `$${unit.currentRent.toLocaleString()}` : '—'}
          </div>
        )}
      </TableCell>
      <TableCell>
        {tenant ? (
          <div className='text-sm'>
            {tenant.firstName} {tenant.lastName}
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        )}
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  )
}

interface UnitCardProps {
  unit: Unit
  propertyId: string
  onStatusChange: (unit: Unit, newStatus: UnitStatus) => Promise<void>
  onDelete: () => void
}

function UnitCard({ unit, propertyId, onStatusChange, onDelete }: UnitCardProps) {
  const activeLease = unit.leases.find((l) => l.status === 'ACTIVE')
  const tenant = activeLease?.tenant
  const currentOption = unitStatusOptions.find((o) => o.value === unit.status)

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
            <Select
              value={unit.status}
              onValueChange={(value) => onStatusChange(unit, value as UnitStatus)}
            >
              <SelectTrigger className='h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0'>
                <Badge
                  variant={currentOption?.variant || 'secondary'}
                  className={currentOption?.className}
                >
                  {currentOption?.label || unit.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {unitStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <Badge variant={option.variant} className={option.className}>
                      {option.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
