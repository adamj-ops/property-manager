import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { z } from 'zod'
import {
  LuDog,
  LuFilter,
  LuLoader2,
  LuPawPrint,
  LuPlus,
  LuSearch,
} from 'react-icons/lu'

import { PetCard } from '~/components/pets/pet-card'
import { PetApprovalDialog } from '~/components/pets/pet-approval-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Typography } from '~/components/ui/typography'
import { petsQueryOptions } from '~/services/pets.query'
import type { PetStatus, PetType } from '~/services/pets.schema'

const searchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'REMOVED']).optional(),
  type: z.enum(['DOG', 'CAT', 'BIRD', 'FISH', 'REPTILE', 'SMALL_MAMMAL', 'OTHER']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/app/pets')({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(petsQueryOptions({ limit: 100 }))
  },
  pendingComponent: PetsListLoading,
  component: PetsListPage,
})

function PetsListLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoader2 className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function PetsListPage() {
  const { status: statusFilter, type: typeFilter, search: urlSearch } = Route.useSearch()
  const navigate = useNavigate()
  const [localSearch, setLocalSearch] = useState(urlSearch || '')

  // Dialog state
  const [selectedPet, setSelectedPet] = useState<any>(null)
  const [dialogMode, setDialogMode] = useState<'approve' | 'deny' | 'remove' | null>(null)

  const { data: petsData } = useSuspenseQuery(petsQueryOptions({ limit: 100 }))

  // Filter pets
  const filteredPets = useMemo(() => {
    let result = petsData?.pets || []

    if (statusFilter) {
      result = result.filter((p: any) => p.status === statusFilter)
    }

    if (typeFilter) {
      result = result.filter((p: any) => p.type === typeFilter)
    }

    if (localSearch) {
      const searchLower = localSearch.toLowerCase()
      result = result.filter(
        (p: any) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.breed?.toLowerCase().includes(searchLower) ||
          p.tenant?.firstName?.toLowerCase().includes(searchLower) ||
          p.tenant?.lastName?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [petsData, statusFilter, typeFilter, localSearch])

  // Stats
  const allPets = petsData?.pets || []
  const pendingCount = allPets.filter((p: any) => p.status === 'PENDING').length
  const approvedCount = allPets.filter((p: any) => p.status === 'APPROVED').length
  const deniedCount = allPets.filter((p: any) => p.status === 'DENIED').length

  // Filter handlers
  const handleFilterClick = (newStatus?: PetStatus) => {
    navigate({
      to: '/app/pets',
      search: {
        status: newStatus,
        type: typeFilter,
        search: localSearch || undefined,
      },
      replace: true,
    })
  }

  const isAllActive = !statusFilter
  const isPendingActive = statusFilter === 'PENDING'
  const isApprovedActive = statusFilter === 'APPROVED'
  const isDeniedActive = statusFilter === 'DENIED'

  // Action handlers
  const handleApprove = (pet: any) => {
    setSelectedPet(pet)
    setDialogMode('approve')
  }

  const handleDeny = (pet: any) => {
    setSelectedPet(pet)
    setDialogMode('deny')
  }

  const handleRemove = (pet: any) => {
    setSelectedPet(pet)
    setDialogMode('remove')
  }

  const handleDialogClose = () => {
    setSelectedPet(null)
    setDialogMode(null)
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2 className='flex items-center gap-2'>
            <LuPawPrint className='size-7' />
            Pet Applications
          </Typography.H2>
          <Typography.Muted>Manage pet applications and approvals</Typography.Muted>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Pets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{allPets.length}</div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>{deniedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative min-w-64 flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by pet name, breed, or owner...'
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
            variant={isPendingActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('PENDING')}
          >
            Pending
            {pendingCount > 0 && (
              <Badge variant='secondary' className='ml-1 bg-yellow-200 text-yellow-800'>
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={isApprovedActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('APPROVED')}
          >
            Approved
          </Button>
          <Button
            variant={isDeniedActive ? 'outline' : 'ghost'}
            size='sm'
            onClick={() => handleFilterClick('DENIED')}
          >
            Denied
          </Button>
        </div>
      </div>

      {/* Pets List */}
      <div className='space-y-4'>
        {filteredPets.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <LuDog className='size-12 text-muted-foreground' />
              <Typography.H4 className='mt-4'>No pets found</Typography.H4>
              <Typography.Muted className='mt-2'>
                {localSearch || statusFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'No pet applications have been submitted yet'}
              </Typography.Muted>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredPets.map((pet: any) => (
              <PetCard
                key={pet.id}
                pet={pet}
                showTenant
                onApprove={() => handleApprove(pet)}
                onDeny={() => handleDeny(pet)}
                onRemove={() => handleRemove(pet)}
                onView={() => {
                  // Navigate to tenant detail with pets tab
                  if (pet.tenant?.id) {
                    navigate({
                      to: '/app/tenants/$tenantId',
                      params: { tenantId: pet.tenant.id },
                    })
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <PetApprovalDialog
        pet={selectedPet}
        mode={dialogMode}
        open={!!dialogMode}
        onOpenChange={(open) => {
          if (!open) handleDialogClose()
        }}
      />
    </div>
  )
}
