import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { LuCalendar, LuFileText, LuFilter, LuLoaderCircle, LuPlus, LuSearch } from 'react-icons/lu'
import { z } from 'zod'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'
import { leasesQueryOptions, expiringLeasesQueryOptions } from '~/services/leases.query'

const searchSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'RENEWED', 'TERMINATED', 'MONTH_TO_MONTH']).optional(),
  expiringWithinDays: z.number().optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/app/leases/')({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(leasesQueryOptions({ limit: 100 })),
      context.queryClient.ensureQueryData(expiringLeasesQueryOptions()),
    ])
  },
  pendingComponent: LeasesListLoading,
  component: LeasesListPage,
})

function LeasesListLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

interface LeaseDisplay {
  id: string
  tenant: string
  tenantId: string
  unit: string
  unitId: string
  property: string
  propertyId: string
  rent: number
  petRent: number
  deposit: number
  startDate: string
  endDate: string
  status: string
  daysUntilExpiration: number
}

function LeasesListPage() {
  const { status, expiringWithinDays, search: urlSearch } = Route.useSearch()
  const navigate = useNavigate()
  const [localSearch, setLocalSearch] = useState(urlSearch || '')

  const { data: leasesData } = useSuspenseQuery(leasesQueryOptions({ limit: 100 }))
  const { data: expiringData } = useSuspenseQuery(expiringLeasesQueryOptions())

  // Calculate days until expiration
  const calculateDaysUntil = (date: string | Date): number => {
    const endDate = new Date(date)
    const now = new Date()
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Transform leases to display format
  const leases: LeaseDisplay[] = useMemo(() => {
    if (!leasesData?.leases) return []
    return leasesData.leases.map((l: any) => ({
      id: l.id,
      tenant: l.tenant
        ? `${l.tenant.firstName} ${l.tenant.lastName}`
        : 'Unknown Tenant',
      tenantId: l.tenantId,
      unit: l.unit?.unitNumber || 'N/A',
      unitId: l.unitId,
      property: l.unit?.property?.name || 'Unknown Property',
      propertyId: l.unit?.property?.id || '',
      rent: Number(l.monthlyRent) || 0,
      petRent: Number(l.petRent) || 0,
      deposit: Number(l.securityDeposit) || 0,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      daysUntilExpiration: calculateDaysUntil(l.endDate),
    }))
  }, [leasesData])

  // Apply filters
  const filteredLeases = useMemo(() => {
    let result = leases

    // Status filter
    if (status) {
      result = result.filter((l) => l.status === status)
    }

    // Expiring filter
    if (expiringWithinDays) {
      result = result.filter((l) => l.daysUntilExpiration <= expiringWithinDays && l.daysUntilExpiration > 0)
    }

    // Search filter
    if (localSearch) {
      const searchLower = localSearch.toLowerCase()
      result = result.filter(
        (l) =>
          l.tenant.toLowerCase().includes(searchLower) ||
          l.unit.toLowerCase().includes(searchLower) ||
          l.property.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [leases, status, expiringWithinDays, localSearch])

  // Stats calculations
  const activeLeases = leases.filter((l) => l.status === 'ACTIVE').length
  const expiringIn30 = expiringData?.within30Days?.length || 0
  const expiringIn60 = expiringData?.within60Days?.length || 0
  const totalMonthlyRent = leases
    .filter((l) => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.rent + l.petRent, 0)

  // Filter button handlers
  const handleFilterClick = (newStatus?: string, newExpiring?: number) => {
    navigate({
      to: '/app/leases',
      search: {
        status: newStatus as any,
        expiringWithinDays: newExpiring,
        search: localSearch || undefined,
      },
      replace: true,
    })
  }

  const isAllActive = !status && !expiringWithinDays
  const isActiveFilter = status === 'ACTIVE' && !expiringWithinDays
  const isExpiringSoonFilter = expiringWithinDays === 30
  const isExpiredFilter = status === 'EXPIRED'

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
        <div className='relative min-w-64 flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search leases...'
            className='pl-10'
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className='flex gap-2'>
          <Button
            variant={isAllActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick()}
          >
            All
          </Button>
          <Button
            variant={isActiveFilter ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('ACTIVE')}
          >
            Active
          </Button>
          <Button
            variant={isExpiringSoonFilter ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('ACTIVE', 30)}
          >
            Expiring Soon
          </Button>
          <Button
            variant={isExpiredFilter ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('EXPIRED')}
          >
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
        {filteredLeases.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <LuFileText className='size-12 text-muted-foreground' />
              <Typography.H4 className='mt-4'>No leases found</Typography.H4>
              <Typography.Muted className='mt-2'>
                {localSearch || status || expiringWithinDays
                  ? 'Try adjusting your filters'
                  : 'Create your first lease to get started'}
              </Typography.Muted>
              {!localSearch && !status && !expiringWithinDays && (
                <Button className='mt-4' asChild>
                  <Link to='/app/leases/new'>
                    <LuPlus className='mr-2 size-4' />
                    Create Lease
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLeases.map((lease) => <LeaseCard key={lease.id} lease={lease} />)
        )}
      </div>
    </div>
  )
}

interface LeaseCardProps {
  lease: LeaseDisplay
}

function LeaseCard({ lease }: LeaseCardProps) {
  const isExpiringSoon = lease.daysUntilExpiration <= 30 && lease.daysUntilExpiration > 0
  const isExpiringMedium = lease.daysUntilExpiration <= 60 && lease.daysUntilExpiration > 30
  const isExpired = lease.daysUntilExpiration <= 0

  const getStatusBadge = () => {
    if (lease.status === 'DRAFT') {
      return <Badge variant='secondary'>Draft</Badge>
    }
    if (lease.status === 'PENDING_SIGNATURE') {
      return <Badge variant='secondary' className='bg-blue-100 text-blue-700'>Pending Signature</Badge>
    }
    if (lease.status === 'EXPIRED' || isExpired) {
      return <Badge variant='destructive'>Expired</Badge>
    }
    if (lease.status === 'TERMINATED') {
      return <Badge variant='destructive'>Terminated</Badge>
    }
    if (lease.status === 'RENEWED') {
      return <Badge variant='outline'>Renewed</Badge>
    }
    if (isExpiringSoon) {
      return <Badge variant='destructive'>Expiring in {lease.daysUntilExpiration} days</Badge>
    }
    if (isExpiringMedium) {
      return <Badge variant='secondary' className='bg-orange-100 text-orange-700'>Expiring in {lease.daysUntilExpiration} days</Badge>
    }
    return <Badge variant='outline' className='border-green-500 text-green-700'>Active</Badge>
  }

  return (
    <Card className='transition-shadow hover:shadow-md'>
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
                {getStatusBadge()}
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
                {new Date(lease.startDate).toLocaleDateString()} -{' '}
                {new Date(lease.endDate).toLocaleDateString()}
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
            {(isExpiringSoon || isExpiringMedium) && lease.status === 'ACTIVE' && (
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
