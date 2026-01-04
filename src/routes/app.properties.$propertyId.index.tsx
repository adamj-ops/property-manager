import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import {
  LuArrowLeft,
  LuBuilding2,
  LuDollarSign,
  LuPencil,
  LuFileText,
  LuHouse,
  LuMapPin,
  LuMessageSquare,
  LuUsers,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { usePropertyQuery } from '~/services/properties.query'
import type { PropertyType } from '~/services/properties.schema'

export const Route = createFileRoute('/app/properties/$propertyId/')({
  component: PropertyDetailPage,
})

function PropertyDetailPage() {
  const { propertyId } = Route.useParams()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PropertyContent propertyId={propertyId} />
    </Suspense>
  )
}

function PropertyContent({ propertyId }: { propertyId: string }) {
  const { data: property } = usePropertyQuery(propertyId)

  // Calculate stats from units
  const totalUnits = property.units.length
  const occupiedUnits = property.units.filter((u) => u.leases.some((l) => l.status === 'ACTIVE')).length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const monthlyRevenue = property.units
    .filter((u) => u.leases.some((l) => l.status === 'ACTIVE'))
    .reduce((sum, u) => sum + Number(u.currentRent || u.marketRent), 0)

  const expectedRevenue = property.units.reduce(
    (sum, u) => sum + Number(u.marketRent),
    0
  )

  const collectionRate =
    expectedRevenue > 0 ? Math.round((monthlyRevenue / expectedRevenue) * 100) : 0

  // Get leases expiring in next 90 days
  const now = new Date()
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const expiringLeases = property.units
    .flatMap((unit) =>
      unit.leases
        .filter((lease) => {
          if (lease.status !== 'ACTIVE') return false
          const endDate = new Date(lease.endDate)
          return endDate >= now && endDate <= ninetyDaysFromNow
        })
        .map((lease) => ({
          unitNumber: unit.unitNumber,
          tenant: lease.tenant,
          endDate: new Date(lease.endDate),
          expiresIn: Math.ceil((new Date(lease.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        }))
    )
    .sort((a, b) => a.expiresIn - b.expiresIn)
    .slice(0, 5)

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/properties'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>{property.name}</Typography.H2>
            <Badge>{formatPropertyType(property.type)}</Badge>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuMapPin className='size-4' />
            <Typography.Muted>
              {property.addressLine1}, {property.city}, {property.state} {property.zipCode}
            </Typography.Muted>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link to='/app/properties/$propertyId/edit' params={{ propertyId }}>
              <LuPencil className='mr-2 size-4' />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link to='/app/properties/$propertyId/units' params={{ propertyId }}>
              <LuHouse className='mr-2 size-4' />
              Manage Units
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Occupancy</CardTitle>
            <LuBuilding2 className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{occupancyRate}%</div>
            <p className='text-xs text-muted-foreground'>
              {occupiedUnits} of {totalUnits} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Monthly Revenue</CardTitle>
            <LuDollarSign className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${monthlyRevenue.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>{collectionRate}% of expected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Active Tenants</CardTitle>
            <LuUsers className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{occupiedUnits}</div>
            <p className='text-xs text-muted-foreground'>
              {expiringLeases.length} leases expiring soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Units</CardTitle>
            <LuHouse className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUnits}</div>
            <p className='text-xs text-muted-foreground'>
              {totalUnits - occupiedUnits} vacant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Property Details */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-muted-foreground'>Year Built</p>
                  <p className='font-medium'>{property.yearBuilt || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Total Square Footage</p>
                  <p className='font-medium'>
                    {property.totalSqFt ? `${property.totalSqFt.toLocaleString()} sq ft` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Lot Size</p>
                  <p className='font-medium'>
                    {property.lotSize ? `${property.lotSize} acres` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-muted-foreground'>Parking Spaces</p>
                  <p className='font-medium'>
                    {property.parkingSpaces ? `${property.parkingSpaces} spaces` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Amenities</p>
                  <div className='flex flex-wrap gap-1'>
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((amenity) => (
                        <Badge key={amenity} variant='secondary'>
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <span className='text-sm text-muted-foreground'>None listed</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Status</p>
                  <Badge variant='outline'>{property.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2'>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/properties/$propertyId/units/new' params={{ propertyId }}>
                <LuHouse className='mr-2 size-4' />
                Add Unit
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/tenants/new'>
                <LuUsers className='mr-2 size-4' />
                Add Tenant
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/leases/new'>
                <LuFileText className='mr-2 size-4' />
                Create Lease
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/maintenance/new'>
                <LuWrench className='mr-2 size-4' />
                New Work Order
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/communications'>
                <LuMessageSquare className='mr-2 size-4' />
                Message Tenants
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Units Overview and Expiring Leases */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Units Overview */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Units Overview</CardTitle>
                <CardDescription>Unit breakdown by status</CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/properties/$propertyId/units' params={{ propertyId }}>
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {property.units.slice(0, 5).map((unit) => {
                const activeLease = unit.leases.find((l) => l.status === 'ACTIVE')
                const tenant = activeLease?.tenant

                return (
                  <div key={unit.id} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>Unit {unit.unitNumber}</p>
                      <p className='text-xs text-muted-foreground'>
                        {tenant
                          ? `${tenant.firstName} ${tenant.lastName}`
                          : 'Vacant'}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={activeLease ? 'default' : 'secondary'}
                        className={activeLease ? 'bg-green-500' : ''}
                      >
                        {activeLease ? 'Occupied' : 'Vacant'}
                      </Badge>
                      <span className='text-sm font-medium'>
                        ${Number(unit.currentRent || unit.marketRent).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
              {property.units.length === 0 && (
                <div className='text-center py-4'>
                  <p className='text-sm text-muted-foreground'>No units added yet</p>
                  <Button variant='outline' size='sm' className='mt-2' asChild>
                    <Link to='/app/properties/$propertyId/units/new' params={{ propertyId }}>
                      Add First Unit
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Leases */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Expiring Leases</CardTitle>
                <CardDescription>Leases expiring in the next 90 days</CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/leases'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {expiringLeases.length > 0 ? (
                expiringLeases.map((lease) => (
                  <div key={`${lease.unitNumber}-${lease.tenant?.id}`} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>Unit {lease.unitNumber}</p>
                      <p className='text-xs text-muted-foreground'>
                        {lease.tenant?.firstName} {lease.tenant?.lastName}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          lease.expiresIn <= 30
                            ? 'destructive'
                            : lease.expiresIn <= 60
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {lease.expiresIn} days
                      </Badge>
                      <Button variant='ghost' size='sm'>
                        Renew
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-4'>
                  <p className='text-sm text-muted-foreground'>
                    No leases expiring in the next 90 days
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='mt-1 h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-32 w-full' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-40 w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
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
