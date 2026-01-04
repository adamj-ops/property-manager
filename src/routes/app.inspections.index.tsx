import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { z } from 'zod'
import {
  LuClipboardCheck,
  LuFilter,
  LuLoaderCircle,
  LuPlus,
  LuSearch,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { InspectionCard } from '~/components/inspections/inspection-card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Typography } from '~/components/ui/typography'
import { inspectionsQueryOptions, useStartInspection } from '~/services/inspections.query'
import type { InspectionStatus } from '~/services/inspections.schema'

const searchSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE', 'ANNUAL']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/app/inspections/')({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(inspectionsQueryOptions({ limit: 100 }))
  },
  pendingComponent: InspectionsListLoading,
  component: InspectionsListPage,
})

function InspectionsListLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function InspectionsListPage() {
  const { status: statusFilter, type: typeFilter, search: urlSearch } = Route.useSearch()
  const navigate = useNavigate()
  const [localSearch, setLocalSearch] = useState(urlSearch || '')

  const startInspection = useStartInspection()

  const { data: inspectionsData } = useSuspenseQuery(inspectionsQueryOptions({ limit: 100 }))

  // Filter inspections
  const filteredInspections = useMemo(() => {
    let result = inspectionsData?.inspections || []

    if (statusFilter) {
      result = result.filter((i: any) => i.status === statusFilter)
    }

    if (typeFilter) {
      result = result.filter((i: any) => i.type === typeFilter)
    }

    if (localSearch) {
      const searchLower = localSearch.toLowerCase()
      result = result.filter(
        (i: any) =>
          i.property?.name?.toLowerCase().includes(searchLower) ||
          i.unit?.unitNumber?.toLowerCase().includes(searchLower) ||
          i.notes?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [inspectionsData, statusFilter, typeFilter, localSearch])

  // Stats
  const allInspections = inspectionsData?.inspections || []
  const scheduledCount = allInspections.filter((i: any) => i.status === 'SCHEDULED').length
  const inProgressCount = allInspections.filter((i: any) => i.status === 'IN_PROGRESS').length
  const completedCount = allInspections.filter((i: any) => i.status === 'COMPLETED').length

  // Filter handlers
  const handleFilterClick = (newStatus?: InspectionStatus) => {
    navigate({
      to: '/app/inspections',
      search: {
        status: newStatus,
        type: typeFilter,
        search: localSearch || undefined,
      },
      replace: true,
    })
  }

  const handleStart = async (id: string) => {
    try {
      await startInspection.mutateAsync(id)
      toast.success('Inspection started')
      navigate({
        to: '/app/inspections/$inspectionId',
        params: { inspectionId: id },
      })
    } catch (error) {
      toast.error('Failed to start inspection')
    }
  }

  const isAllActive = !statusFilter
  const isScheduledActive = statusFilter === 'SCHEDULED'
  const isInProgressActive = statusFilter === 'IN_PROGRESS'
  const isCompletedActive = statusFilter === 'COMPLETED'

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2 className='flex items-center gap-2'>
            <LuClipboardCheck className='size-7' />
            Inspections
          </Typography.H2>
          <Typography.Muted>Manage property inspections</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/inspections/new'>
            <LuPlus className='mr-2 size-4' />
            New Inspection
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{allInspections.length}</div>
          </CardContent>
        </Card>
        <Card className={scheduledCount > 0 ? 'border-blue-300 bg-blue-50/50' : ''}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{scheduledCount}</div>
          </CardContent>
        </Card>
        <Card className={inProgressCount > 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative min-w-64 flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by property, unit, or notes...'
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
            variant={isScheduledActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('SCHEDULED')}
          >
            Scheduled
            {scheduledCount > 0 && (
              <Badge variant='secondary' className='ml-1 bg-blue-200 text-blue-800'>
                {scheduledCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={isInProgressActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('IN_PROGRESS')}
          >
            In Progress
            {inProgressCount > 0 && (
              <Badge variant='secondary' className='ml-1 bg-yellow-200 text-yellow-800'>
                {inProgressCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={isCompletedActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('COMPLETED')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Inspections List */}
      <div className='space-y-4'>
        {filteredInspections.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <LuClipboardCheck className='size-12 text-muted-foreground' />
              <Typography.H4 className='mt-4'>No inspections found</Typography.H4>
              <Typography.Muted className='mt-2'>
                {localSearch || statusFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first inspection to get started'}
              </Typography.Muted>
              {!localSearch && !statusFilter && !typeFilter && (
                <Button asChild className='mt-4'>
                  <Link to='/app/inspections/new'>
                    <LuPlus className='mr-2 size-4' />
                    New Inspection
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {filteredInspections.map((inspection: any) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                onStart={handleStart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
