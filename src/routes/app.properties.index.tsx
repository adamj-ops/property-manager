import { createFileRoute } from '@tanstack/react-router'
import { LuBuilding2, LuFilter, LuPlus, LuSearch } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/properties/')({
  component: PropertiesListPage,
})

// Mock data for properties
const properties = [
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

function PropertiesListPage() {
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
        <Button asChild>
          <Link to='/app/properties/new'>
            <LuPlus className='mr-2 size-4' />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUnits}</div>
            <p className='text-xs text-muted-foreground'>{totalOccupied} occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{Math.round((totalOccupied / totalUnits) * 100)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search properties...' className='pl-10' />
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      {/* Property Cards */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {properties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}

interface PropertyCardProps {
  property: (typeof properties)[0]
}

function PropertyCard({ property }: PropertyCardProps) {
  const occupancyRate = Math.round((property.occupiedUnits / property.totalUnits) * 100)
  const collectionRate = Math.round((property.monthlyRevenue / property.expectedRevenue) * 100)
  const vacantUnits = property.totalUnits - property.occupiedUnits

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
              <LuBuilding2 className='size-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-base'>{property.name}</CardTitle>
              <p className='text-sm text-muted-foreground'>
                {property.city}, {property.state}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground'>Units</p>
            <p className='font-medium'>
              {property.occupiedUnits}/{property.totalUnits}
              <span className='ml-1 text-muted-foreground'>({occupancyRate}%)</span>
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Revenue</p>
            <p className='font-medium'>${property.monthlyRevenue.toLocaleString()}/mo</p>
          </div>
        </div>

        {/* Status badges */}
        <div className='flex flex-wrap gap-2'>
          {vacantUnits > 0 && (
            <Badge variant='secondary'>
              {vacantUnits} vacant
            </Badge>
          )}
          {property.openWorkOrders > 0 && (
            <Badge variant='outline' className='border-yellow-500 text-yellow-600'>
              {property.openWorkOrders} work orders
            </Badge>
          )}
          {property.expiringLeases > 0 && (
            <Badge variant='outline' className='border-orange-500 text-orange-600'>
              {property.expiringLeases} expiring
            </Badge>
          )}
          {vacantUnits === 0 && property.openWorkOrders === 0 && property.expiringLeases === 0 && (
            <Badge variant='outline' className='border-green-500 text-green-600'>
              All good
            </Badge>
          )}
        </div>

        <div className='flex gap-2 pt-2'>
          <Button variant='outline' size='sm' className='flex-1' asChild>
            <Link to='/app/properties/$propertyId' params={{ propertyId: property.id }}>
              View Details
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/app/properties/$propertyId/units' params={{ propertyId: property.id }}>
              Units
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
