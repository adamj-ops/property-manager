import { createFileRoute } from '@tanstack/react-router'
import { LuCalendar, LuFileText, LuFilter, LuPlus, LuSearch } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/leases/')({
  component: LeasesListPage,
})

// Mock data for leases
const leases = [
  {
    id: '1',
    tenant: 'Sarah Johnson & Mike Chen',
    unit: '101',
    property: 'Humboldt Court',
    rent: 1250,
    petRent: 50,
    deposit: 1250,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    daysUntilExpiration: 31,
  },
  {
    id: '2',
    tenant: 'Emily Rodriguez',
    unit: '204',
    property: 'Humboldt Court',
    rent: 1375,
    petRent: 0,
    deposit: 1375,
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    status: 'active',
    daysUntilExpiration: 59,
  },
  {
    id: '3',
    tenant: 'James & Lisa Parker',
    unit: '305',
    property: 'Humboldt Court',
    rent: 1425,
    petRent: 50,
    deposit: 1425,
    startDate: '2023-06-01',
    endDate: '2025-05-31',
    status: 'active',
    daysUntilExpiration: 152,
  },
  {
    id: '4',
    tenant: 'David Kim',
    unit: '402',
    property: 'Humboldt Court',
    rent: 1500,
    petRent: 0,
    deposit: 1500,
    startDate: '2024-08-15',
    endDate: '2025-08-14',
    status: 'active',
    daysUntilExpiration: 227,
  },
]

function LeasesListPage() {
  const activeLeases = leases.filter(l => l.status === 'active').length
  const expiringIn30 = leases.filter(l => l.daysUntilExpiration <= 30).length
  const expiringIn60 = leases.filter(l => l.daysUntilExpiration <= 60 && l.daysUntilExpiration > 30).length
  const totalMonthlyRent = leases.reduce((sum, l) => sum + l.rent + l.petRent, 0)

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Leases</Typography.H2>
          <Typography.Muted>Manage lease agreements</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/leases/new'>
            <LuPlus className='mr-2 size-4' />
            Create Lease
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Active Leases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeLeases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring in 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>{expiringIn30}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring in 60 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>{expiringIn60}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Monthly Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalMonthlyRent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative flex-1 min-w-64'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search leases...' className='pl-10' />
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
            Expired
          </Button>
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      {/* Leases List */}
      <div className='space-y-4'>
        {leases.map(lease => (
          <LeaseCard key={lease.id} lease={lease} />
        ))}
      </div>
    </div>
  )
}

interface LeaseCardProps {
  lease: (typeof leases)[0]
}

function LeaseCard({ lease }: LeaseCardProps) {
  const isExpiringSoon = lease.daysUntilExpiration <= 30
  const isExpiringMedium = lease.daysUntilExpiration <= 60 && lease.daysUntilExpiration > 30

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          {/* Lease Info */}
          <div className='flex items-start gap-4'>
            <div className='flex size-12 items-center justify-center rounded-lg bg-primary/10'>
              <LuFileText className='size-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold'>{lease.tenant}</h3>
                {isExpiringSoon && <Badge variant='destructive'>Expiring in {lease.daysUntilExpiration} days</Badge>}
                {isExpiringMedium && (
                  <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                    Expiring in {lease.daysUntilExpiration} days
                  </Badge>
                )}
              </div>
              <p className='text-sm text-muted-foreground'>
                Unit {lease.unit} • {lease.property}
              </p>
            </div>
          </div>

          {/* Lease Details */}
          <div className='flex flex-wrap items-center gap-6'>
            <div className='text-sm'>
              <p className='text-muted-foreground'>Monthly Rent</p>
              <p className='font-medium'>${(lease.rent + lease.petRent).toLocaleString()}</p>
            </div>
            <div className='text-sm'>
              <p className='text-muted-foreground'>Lease Period</p>
              <p className='flex items-center gap-1 font-medium'>
                <LuCalendar className='size-3' />
                {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className='text-sm'>
              <p className='text-muted-foreground'>Security Deposit</p>
              <p className='font-medium'>${lease.deposit.toLocaleString()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link to='/app/leases/$leaseId' params={{ leaseId: lease.id }}>
                View
              </Link>
            </Button>
            {(isExpiringSoon || isExpiringMedium) && (
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
