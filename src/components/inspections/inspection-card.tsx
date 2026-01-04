import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  LuBuilding2,
  LuCalendar,
  LuChevronRight,
  LuClipboardCheck,
  LuFileText,
  LuPlay,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import type { InspectionStatus, InspectionType } from '~/services/inspections.schema'

interface InspectionCardProps {
  inspection: {
    id: string
    type: InspectionType
    status: InspectionStatus
    scheduledDate?: string | Date | null
    completedAt?: string | Date | null
    createdAt: string | Date
    notes?: string | null
    property: {
      id: string
      name: string
    }
    unit?: {
      id: string
      unitNumber: string
    } | null
    _count?: {
      items: number
    }
  }
  onStart?: (id: string) => void
}

const TYPE_LABELS: Record<InspectionType, string> = {
  MOVE_IN: 'Move-In',
  MOVE_OUT: 'Move-Out',
  ROUTINE: 'Routine',
  MAINTENANCE: 'Maintenance',
  ANNUAL: 'Annual',
}

const STATUS_STYLES: Record<
  InspectionStatus,
  { variant: 'default' | 'destructive' | 'outline' | 'secondary'; className: string }
> = {
  SCHEDULED: { variant: 'secondary', className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { variant: 'outline', className: 'border-green-500 text-green-700 bg-green-50' },
  CANCELLED: { variant: 'secondary', className: 'bg-gray-100 text-gray-600' },
}

export function InspectionCard({ inspection, onStart }: InspectionCardProps) {
  const statusStyle = STATUS_STYLES[inspection.status]
  const itemCount = inspection._count?.items || 0

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            {/* Type and Status */}
            <div className='flex items-center gap-2'>
              <LuClipboardCheck className='size-4 text-primary' />
              <span className='font-semibold'>{TYPE_LABELS[inspection.type]} Inspection</span>
              <Badge variant={statusStyle.variant} className={statusStyle.className}>
                {inspection.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Property and Unit */}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <LuBuilding2 className='size-4' />
              <span>{inspection.property.name}</span>
              {inspection.unit && (
                <Badge variant='outline'>Unit {inspection.unit.unitNumber}</Badge>
              )}
            </div>

            {/* Date Info */}
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              {inspection.scheduledDate && (
                <div className='flex items-center gap-1'>
                  <LuCalendar className='size-3' />
                  <span>
                    Scheduled: {format(new Date(inspection.scheduledDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
              {inspection.completedAt && (
                <div className='flex items-center gap-1'>
                  <LuCalendar className='size-3' />
                  <span>
                    Completed: {format(new Date(inspection.completedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Item Count */}
            {itemCount > 0 && (
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <LuFileText className='size-3' />
                <span>{itemCount} items inspected</span>
              </div>
            )}

            {/* Notes Preview */}
            {inspection.notes && (
              <p className='line-clamp-2 text-sm text-muted-foreground'>
                {inspection.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {inspection.status === 'SCHEDULED' && onStart && (
              <Button size='sm' onClick={() => onStart(inspection.id)}>
                <LuPlay className='mr-1 size-4' />
                Start
              </Button>
            )}
            <Button variant='ghost' size='icon' asChild>
              <Link
                to='/app/inspections/$inspectionId'
                params={{ inspectionId: inspection.id }}
              >
                <LuChevronRight className='size-4' />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
