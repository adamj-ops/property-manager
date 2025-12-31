import { createFileRoute } from '@tanstack/react-router'
import {
  LuArrowLeft,
  LuBuilding2,
  LuCalendar,
  LuDollarSign,
  LuPencil,
  LuFileText,
  LuHouse,
  LuMapPin,
  LuMessageSquare,
  LuTrendingUp,
  LuUsers,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/properties/$propertyId/')({
  component: PropertyDetailPage,
})

// Mock data for a property
const property = {
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
  sqFt: 45000,
  lotSize: '2.5 acres',
  parking: '90 spaces',
  amenities: ['Laundry Facility', 'Community Room', 'Playground', 'Parking'],
}

const recentActivity = [
  { type: 'payment', description: 'Rent payment received - Unit 305', time: '2 hours ago' },
  { type: 'maintenance', description: 'Work order completed - Unit 210', time: '5 hours ago' },
  { type: 'lease', description: 'Lease renewed - Unit 402', time: '1 day ago' },
  { type: 'inspection', description: 'Quarterly inspection - Unit 101', time: '2 days ago' },
]

const upcomingLeaseExpirations = [
  { unit: '101', tenant: 'Sarah Johnson', expiresIn: 31 },
  { unit: '305', tenant: 'James Parker', expiresIn: 45 },
  { unit: '402', tenant: 'David Kim', expiresIn: 60 },
]

function PropertyDetailPage() {
  const { propertyId } = Route.useParams()
  const occupancyRate = Math.round((property.occupiedUnits / property.totalUnits) * 100)
  const collectionRate = Math.round((property.monthlyRevenue / property.expectedRevenue) * 100)

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
            <Badge>{property.type}</Badge>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuMapPin className='size-4' />
            <Typography.Muted>
              {property.address}, {property.city}, {property.state} {property.zipCode}
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
              {property.occupiedUnits} of {property.totalUnits} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Monthly Revenue</CardTitle>
            <LuDollarSign className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${property.monthlyRevenue.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>{collectionRate}% collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Active Tenants</CardTitle>
            <LuUsers className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{property.occupiedUnits}</div>
            <p className='text-xs text-muted-foreground'>3 leases expiring soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Open Work Orders</CardTitle>
            <LuWrench className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>3</div>
            <p className='text-xs text-muted-foreground'>1 high priority</p>
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
                  <p className='font-medium'>{property.yearBuilt}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Total Square Footage</p>
                  <p className='font-medium'>{property.sqFt.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Lot Size</p>
                  <p className='font-medium'>{property.lotSize}</p>
                </div>
              </div>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-muted-foreground'>Parking</p>
                  <p className='font-medium'>{property.parking}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Amenities</p>
                  <div className='flex flex-wrap gap-1'>
                    {property.amenities.map(amenity => (
                      <Badge key={amenity} variant='secondary'>
                        {amenity}
                      </Badge>
                    ))}
                  </div>
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

      {/* Activity and Expiring Leases */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentActivity.map((activity, index) => (
                <div key={index} className='flex items-start gap-4'>
                  <div
                    className={`mt-1 size-2 rounded-full ${
                      activity.type === 'payment'
                        ? 'bg-green-500'
                        : activity.type === 'maintenance'
                          ? 'bg-yellow-500'
                          : activity.type === 'lease'
                            ? 'bg-blue-500'
                            : 'bg-purple-500'
                    }`}
                  />
                  <div className='flex-1'>
                    <p className='text-sm'>{activity.description}</p>
                    <p className='text-xs text-muted-foreground'>{activity.time}</p>
                  </div>
                </div>
              ))}
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
              {upcomingLeaseExpirations.map(lease => (
                <div key={lease.unit} className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>Unit {lease.unit}</p>
                    <p className='text-xs text-muted-foreground'>{lease.tenant}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={lease.expiresIn <= 30 ? 'destructive' : lease.expiresIn <= 60 ? 'secondary' : 'outline'}
                    >
                      {lease.expiresIn} days
                    </Badge>
                    <Button variant='ghost' size='sm'>
                      Renew
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
