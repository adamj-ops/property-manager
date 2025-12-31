import { createFileRoute } from '@tanstack/react-router'
import { LuCalendar, LuDog, LuFilter, LuMail, LuPhone, LuPlus, LuSearch, LuUser } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/tenants/')({
  component: TenantsListPage,
})

// Mock data for tenants
const tenants = [
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

function TenantsListPage() {
  const activeTenants = tenants.filter(t => t.status === 'current').length
  const tenantsWithPets = tenants.filter(t => t.pets.length > 0).length
  const pastDueTenants = tenants.filter(t => t.paymentStatus === 'past_due').length

  // Calculate expiring leases
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
        <Button asChild>
          <Link to='/app/tenants/new'>
            <LuPlus className='mr-2 size-4' />
            Add Tenant
          </Link>
        </Button>
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

      {/* Search and Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative flex-1 min-w-64'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search tenants, units, or lease details...' className='pl-10' />
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            All
          </Button>
          <Button variant='ghost' size='sm'>
            Active
          </Button>
          <Button variant='ghost' size='sm'>
            Expiring Soon
          </Button>
          <Button variant='ghost' size='sm'>
            Past Due
          </Button>
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      {/* Tenants List */}
      <div className='space-y-4'>
        {tenants.map(tenant => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>
    </div>
  )
}

interface TenantCardProps {
  tenant: (typeof tenants)[0]
}

function TenantCard({ tenant }: TenantCardProps) {
  const isExpiringSoon = new Date(tenant.leaseEnd) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isPastDue = tenant.paymentStatus === 'past_due'

  return (
    <Card className={`hover:shadow-md transition-shadow ${isPastDue ? 'border-destructive/50' : ''}`}>
      <CardContent className='p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          {/* Tenant Info */}
          <div className='flex items-start gap-4'>
            <div className='flex size-12 items-center justify-center rounded-full bg-primary/10'>
              <LuUser className='size-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold'>
                  {tenant.firstName} {tenant.lastName}
                </h3>
                {isExpiringSoon && (
                  <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                    Expiring Soon
                  </Badge>
                )}
                {isPastDue && <Badge variant='destructive'>Past Due</Badge>}
              </div>
              <p className='text-sm text-muted-foreground'>
                Unit {tenant.unit} • {tenant.property}
              </p>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <LuMail className='size-3' />
                  {tenant.email}
                </span>
                <span className='flex items-center gap-1'>
                  <LuPhone className='size-3' />
                  {tenant.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Lease & Payment Info */}
          <div className='flex flex-wrap items-center gap-6'>
            <div className='text-sm'>
              <p className='text-muted-foreground'>Monthly Rent</p>
              <p className='font-medium'>
                ${tenant.rent + tenant.petRent}
                {tenant.petRent > 0 && (
                  <span className='text-muted-foreground'> (+ ${tenant.petRent} pet)</span>
                )}
              </p>
            </div>
            <div className='text-sm'>
              <p className='text-muted-foreground'>Lease End</p>
              <p className='flex items-center gap-1 font-medium'>
                <LuCalendar className='size-3' />
                {new Date(tenant.leaseEnd).toLocaleDateString()}
              </p>
            </div>
            {tenant.pets.length > 0 && (
              <div className='text-sm'>
                <p className='text-muted-foreground'>Pets</p>
                <p className='flex items-center gap-1 font-medium'>
                  <LuDog className='size-3' />
                  {tenant.pets.length} {tenant.pets.length === 1 ? 'pet' : 'pets'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link to='/app/communications'>Message</Link>
            </Button>
            <Button variant='outline' size='sm' asChild>
              <Link to='/app/tenants/$tenantId' params={{ tenantId: tenant.id }}>
                View Details
              </Link>
            </Button>
            {isExpiringSoon && (
              <Button size='sm' asChild>
                <Link to='/app/leases/new'>Renew</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
