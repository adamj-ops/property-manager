import {
  LuBird,
  LuCat,
  LuCheck,
  LuDog,
  LuFish,
  LuMoreVertical,
  LuPawPrint,
  LuX,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { PetStatus, PetType } from '~/services/pets.schema'

interface PetCardProps {
  pet: {
    id: string
    name: string
    type: PetType
    breed?: string | null
    color?: string | null
    weight?: number | null
    age?: number | null
    status: PetStatus
    vaccinated: boolean
    vaccinationExpiry?: string | Date | null
    rabiesTagNumber?: string | null
    imageUrl?: string | null
    tenant?: {
      id: string
      firstName: string
      lastName: string
    }
  }
  onApprove?: (id: string) => void
  onDeny?: (id: string) => void
  onRemove?: (id: string) => void
  onEdit?: (id: string) => void
  onView?: (id: string) => void
  showTenant?: boolean
}

const PET_ICONS: Record<PetType, typeof LuDog> = {
  DOG: LuDog,
  CAT: LuCat,
  BIRD: LuBird,
  FISH: LuFish,
  REPTILE: LuPawPrint,
  SMALL_MAMMAL: LuPawPrint,
  OTHER: LuPawPrint,
}

const STATUS_STYLES: Record<PetStatus, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; className: string }> = {
  PENDING: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  APPROVED: { variant: 'outline', className: 'border-green-500 text-green-700 bg-green-50' },
  DENIED: { variant: 'destructive', className: '' },
  REMOVED: { variant: 'secondary', className: 'bg-gray-100 text-gray-600' },
}

export function PetCard({
  pet,
  onApprove,
  onDeny,
  onRemove,
  onEdit,
  onView,
  showTenant = false,
}: PetCardProps) {
  const Icon = PET_ICONS[pet.type] || LuPawPrint
  const statusStyle = STATUS_STYLES[pet.status]

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          {/* Pet Icon/Image */}
          <div className='flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
            {pet.imageUrl ? (
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className='size-14 rounded-lg object-cover'
              />
            ) : (
              <Icon className='size-7 text-primary' />
            )}
          </div>

          {/* Pet Info */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold'>{pet.name}</h3>
                  <Badge variant={statusStyle.variant} className={statusStyle.className}>
                    {pet.status}
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {pet.breed || pet.type}
                  {pet.weight && ` • ${pet.weight} lbs`}
                  {pet.age && ` • ${pet.age} years old`}
                </p>
                {showTenant && pet.tenant && (
                  <p className='text-xs text-muted-foreground'>
                    Owner: {pet.tenant.firstName} {pet.tenant.lastName}
                  </p>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='size-8'>
                    <LuMoreVertical className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(pet.id)}>
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && pet.status !== 'REMOVED' && (
                    <DropdownMenuItem onClick={() => onEdit(pet.id)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {pet.status === 'PENDING' && (
                    <>
                      <DropdownMenuSeparator />
                      {onApprove && (
                        <DropdownMenuItem
                          onClick={() => onApprove(pet.id)}
                          className='text-green-600'
                        >
                          <LuCheck className='mr-2 size-4' />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {onDeny && (
                        <DropdownMenuItem
                          onClick={() => onDeny(pet.id)}
                          className='text-destructive'
                        >
                          <LuX className='mr-2 size-4' />
                          Deny
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {pet.status === 'APPROVED' && onRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onRemove(pet.id)}>
                        Mark as Removed
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Vaccination Status */}
            <div className='mt-2 flex flex-wrap gap-2'>
              {pet.vaccinated ? (
                <Badge variant='outline' className='border-green-500 text-green-700'>
                  <LuCheck className='mr-1 size-3' />
                  Vaccinated
                </Badge>
              ) : (
                <Badge variant='outline' className='border-yellow-500 text-yellow-700'>
                  Not Vaccinated
                </Badge>
              )}
              {pet.rabiesTagNumber && (
                <Badge variant='outline'>Tag: {pet.rabiesTagNumber}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions for Pending */}
        {pet.status === 'PENDING' && (onApprove || onDeny) && (
          <div className='mt-4 flex justify-end gap-2 border-t pt-3'>
            {onDeny && (
              <Button variant='outline' size='sm' onClick={() => onDeny(pet.id)}>
                <LuX className='mr-1 size-4' />
                Deny
              </Button>
            )}
            {onApprove && (
              <Button size='sm' onClick={() => onApprove(pet.id)}>
                <LuCheck className='mr-1 size-4' />
                Approve
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
