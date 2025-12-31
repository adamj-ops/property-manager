import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuFilter, LuHouse, LuPlus, LuSearch } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/properties/$propertyId/units')({
  component: PropertyUnitsPage,
})

// Mock data for units
const units = [
  {
    id: '1',
    number: '101',
    type: '2BR/1BA',
    sqFt: 850,
    rent: 1250,
    status: 'occupied',
    tenant: 'Sarah Johnson',
    leaseEnd: '2024-12-31',
  },
  {
    id: '2',
    number: '102',
    type: '1BR/1BA',
    sqFt: 650,
    rent: 1050,
    status: 'occupied',
    tenant: 'Mike Chen',
    leaseEnd: '2025-06-30',
  },
  {
    id: '3',
    number: '103',
    type: '2BR/1BA',
    sqFt: 850,
    rent: 1275,
    status: 'vacant',
    tenant: null,
    leaseEnd: null,
  },
  {
    id: '4',
    number: '104',
    type: 'Studio',
    sqFt: 450,
    rent: 875,
    status: 'occupied',
    tenant: 'Emily Rodriguez',
    leaseEnd: '2025-02-28',
  },
  {
    id: '5',
    number: '105',
    type: '2BR/2BA',
    sqFt: 950,
    rent: 1425,
    status: 'maintenance',
    tenant: null,
    leaseEnd: null,
  },
  {
    id: '6',
    number: '201',
    type: '2BR/1BA',
    sqFt: 850,
    rent: 1250,
    status: 'occupied',
    tenant: 'James Parker',
    leaseEnd: '2025-05-31',
  },
]

function PropertyUnitsPage() {
  const { propertyId } = Route.useParams()
  const occupiedCount = units.filter(u => u.status === 'occupied').length
  const vacantCount = units.filter(u => u.status === 'vacant').length
  const maintenanceCount = units.filter(u => u.status === 'maintenance').length

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
          <Typography.Muted>Humboldt Court Community</Typography.Muted>
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
            <div className='text-2xl font-bold'>{units.length}</div>
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
          <Input placeholder='Search units...' className='pl-10' />
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      {/* Units List */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {units.map(unit => (
          <UnitCard key={unit.id} unit={unit} propertyId={propertyId} />
        ))}
      </div>
    </div>
  )
}

interface UnitCardProps {
  unit: (typeof units)[0]
  propertyId: string
}

function UnitCard({ unit, propertyId }: UnitCardProps) {
  const statusConfig = {
    occupied: { label: 'Occupied', variant: 'default' as const, className: 'bg-green-500' },
    vacant: { label: 'Vacant', variant: 'secondary' as const, className: 'bg-yellow-500' },
    maintenance: { label: 'Maintenance', variant: 'outline' as const, className: 'bg-orange-500' },
  }

  const status = statusConfig[unit.status]

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
              <LuHouse className='size-5 text-muted-foreground' />
            </div>
            <div>
              <CardTitle className='text-base'>Unit {unit.number}</CardTitle>
              <p className='text-sm text-muted-foreground'>{unit.type}</p>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div>
            <p className='text-muted-foreground'>Size</p>
            <p className='font-medium'>{unit.sqFt} sq ft</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Rent</p>
            <p className='font-medium'>${unit.rent}/mo</p>
          </div>
        </div>

        {unit.tenant && (
          <div className='rounded-lg bg-muted p-3'>
            <p className='text-xs text-muted-foreground'>Current Tenant</p>
            <p className='text-sm font-medium'>{unit.tenant}</p>
            {unit.leaseEnd && (
              <p className='text-xs text-muted-foreground'>
                Lease ends: {new Date(unit.leaseEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <Button variant='outline' size='sm' className='w-full' asChild>
          <Link to='/app/properties/$propertyId/units/$unitId' params={{ propertyId, unitId: unit.id }}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
