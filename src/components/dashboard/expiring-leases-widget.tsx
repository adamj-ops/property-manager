import { useSuspenseQuery } from '@tanstack/react-query'
import { LuCalendar, LuLoaderCircle, LuRefreshCw } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { expiringLeasesQueryOptions } from '~/services/leases.query'

interface ExpiringLease {
  id: string
  endDate: string | Date
  tenant: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  unit: {
    id: string
    unitNumber: string
    property: {
      id: string
      name: string
    }
  }
}

function calculateDaysUntil(date: string | Date): number {
  const endDate = new Date(date)
  const now = new Date()
  return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function LeaseItem({ lease }: { lease: ExpiringLease }) {
  const daysUntil = calculateDaysUntil(lease.endDate)
  const isUrgent = daysUntil <= 14
  const isWarning = daysUntil > 14 && daysUntil <= 30

  return (
    <div className='flex items-center justify-between rounded-lg border p-3'>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <p className='truncate text-sm font-medium'>
            {lease.tenant.firstName} {lease.tenant.lastName}
          </p>
          <Badge
            variant='outline'
            className={
              isUrgent
                ? 'border-red-500 bg-red-50 text-red-700'
                : isWarning
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-500 bg-gray-50 text-gray-700'
            }
          >
            {daysUntil <= 0 ? 'Expired' : `${daysUntil}d`}
          </Badge>
        </div>
        <p className='truncate text-xs text-muted-foreground'>
          Unit {lease.unit.unitNumber} • {lease.unit.property.name}
        </p>
      </div>
      <Button variant='ghost' size='sm' asChild>
        <Link to='/app/leases/$leaseId' params={{ leaseId: lease.id }}>
          <LuRefreshCw className='mr-1 size-3' />
          Renew
        </Link>
      </Button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-6 text-center'>
      <LuCalendar className='size-8 text-muted-foreground' />
      <p className='mt-2 text-sm text-muted-foreground'>{message}</p>
    </div>
  )
}

export function ExpiringLeasesWidget() {
  const { data, isLoading } = useSuspenseQuery(expiringLeasesQueryOptions())

  const counts = {
    within30Days: data?.within30Days?.length || 0,
    within60Days: data?.within60Days?.length || 0,
    within90Days: data?.within90Days?.length || 0,
  }
  const totalCount = counts.within30Days + counts.within60Days + counts.within90Days

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LuCalendar className='size-5' />
            Expiring Leases
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <LuLoaderCircle className='size-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <LuCalendar className='size-5 text-orange-500' />
            <CardTitle>Expiring Leases</CardTitle>
            {totalCount > 0 && (
              <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                {totalCount}
              </Badge>
            )}
          </div>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/app/leases' search={{ expiringWithinDays: 90 }}>
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <EmptyState message='No leases expiring in the next 90 days' />
        ) : (
          <Tabs defaultValue='30' className='w-full'>
            <TabsList className='mb-4 grid w-full grid-cols-3'>
              <TabsTrigger value='30' className='relative'>
                30 Days
                {counts.within30Days > 0 && (
                  <Badge
                    variant='destructive'
                    className='absolute -right-1 -top-1 size-5 p-0 text-xs'
                  >
                    {counts.within30Days}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='60' className='relative'>
                60 Days
                {counts.within60Days > 0 && (
                  <Badge
                    variant='secondary'
                    className='absolute -right-1 -top-1 size-5 bg-yellow-500 p-0 text-xs text-white'
                  >
                    {counts.within60Days}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='90' className='relative'>
                90 Days
                {counts.within90Days > 0 && (
                  <Badge
                    variant='secondary'
                    className='absolute -right-1 -top-1 size-5 p-0 text-xs'
                  >
                    {counts.within90Days}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='30' className='mt-0'>
              {counts.within30Days === 0 ? (
                <EmptyState message='No leases expiring in 30 days' />
              ) : (
                <div className='space-y-2'>
                  {data.within30Days.slice(0, 5).map((lease: ExpiringLease) => (
                    <LeaseItem key={lease.id} lease={lease} />
                  ))}
                  {counts.within30Days > 5 && (
                    <Button variant='link' className='w-full' asChild>
                      <Link to='/app/leases' search={{ expiringWithinDays: 30 }}>
                        View all {counts.within30Days} leases
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value='60' className='mt-0'>
              {counts.within60Days === 0 ? (
                <EmptyState message='No leases expiring in 30-60 days' />
              ) : (
                <div className='space-y-2'>
                  {data.within60Days.slice(0, 5).map((lease: ExpiringLease) => (
                    <LeaseItem key={lease.id} lease={lease} />
                  ))}
                  {counts.within60Days > 5 && (
                    <Button variant='link' className='w-full' asChild>
                      <Link to='/app/leases' search={{ expiringWithinDays: 60 }}>
                        View all {counts.within60Days} leases
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value='90' className='mt-0'>
              {counts.within90Days === 0 ? (
                <EmptyState message='No leases expiring in 60-90 days' />
              ) : (
                <div className='space-y-2'>
                  {data.within90Days.slice(0, 5).map((lease: ExpiringLease) => (
                    <LeaseItem key={lease.id} lease={lease} />
                  ))}
                  {counts.within90Days > 5 && (
                    <Button variant='link' className='w-full' asChild>
                      <Link to='/app/leases' search={{ expiringWithinDays: 90 }}>
                        View all {counts.within90Days} leases
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Loading fallback component for Suspense
export function ExpiringLeasesWidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuCalendar className='size-5' />
          Expiring Leases
        </CardTitle>
      </CardHeader>
      <CardContent className='flex items-center justify-center py-8'>
        <LuLoaderCircle className='size-6 animate-spin text-muted-foreground' />
      </CardContent>
    </Card>
  )
}
