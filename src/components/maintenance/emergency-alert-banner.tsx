'use client'

import { Suspense } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LuTriangleAlert, LuCheck } from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Link } from '~/components/ui/link'
import { cx } from '~/libs/utils'
import {
  useUnacknowledgedEmergenciesQuery,
  useAcknowledgeEscalation,
} from '~/services/maintenance.query'

const escalationLevelConfig: Record<
  number,
  { label: string; className: string; pulseClassName: string }
> = {
  1: {
    label: 'Alert',
    className: 'bg-amber-500',
    pulseClassName: 'bg-amber-400',
  },
  2: {
    label: 'Escalated',
    className: 'bg-red-500',
    pulseClassName: 'bg-red-400',
  },
  3: {
    label: 'Critical',
    className: 'bg-red-700',
    pulseClassName: 'bg-red-600',
  },
}

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

function EmergencyAlertContent() {
  const { data: emergencies } = useUnacknowledgedEmergenciesQuery()
  const acknowledgeMutation = useAcknowledgeEscalation()

  if (!emergencies || emergencies.length === 0) {
    return null
  }

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await acknowledgeMutation.mutateAsync(id)
      toast.success('Emergency Acknowledged', {
        description: 'The escalation has been acknowledged. Please take action.',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to acknowledge escalation',
      })
    }
  }

  return (
    <div className='space-y-2'>
      {emergencies.map((emergency) => {
        const levelConfig = escalationLevelConfig[emergency.escalationLevel] || escalationLevelConfig[1]
        const timeSinceCreated = formatDistanceToNow(new Date(emergency.createdAt), { addSuffix: true })

        return (
          <Link
            key={emergency.id}
            to='/app/maintenance/$workOrderId'
            params={{ workOrderId: emergency.id }}
            className='block'
          >
            <div
              className={cx(
                'relative overflow-hidden rounded-lg px-4 py-3 text-white shadow-lg transition-transform hover:scale-[1.01]',
                levelConfig.className
              )}
            >
              {/* Animated pulse effect for critical emergencies */}
              {emergency.escalationLevel >= 2 && (
                <div
                  className={cx(
                    'absolute inset-0 animate-pulse opacity-30',
                    levelConfig.pulseClassName
                  )}
                />
              )}

              <div className='relative flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-10 items-center justify-center rounded-full bg-white/20'>
                    <LuTriangleAlert className='size-5' />
                  </div>

                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-bold uppercase tracking-wide opacity-80'>
                        {levelConfig.label} - {emergency.requestNumber}
                      </span>
                      <span className='rounded bg-white/20 px-1.5 py-0.5 text-xs'>
                        {categoryLabels[emergency.category] || emergency.category}
                      </span>
                    </div>
                    <p className='font-medium'>{emergency.title}</p>
                    <p className='text-sm opacity-80'>
                      {emergency.unit.property.name} • Unit {emergency.unit.unitNumber} • Created{' '}
                      {timeSinceCreated}
                    </p>
                  </div>
                </div>

                <Button
                  variant='secondary'
                  size='sm'
                  className='shrink-0 bg-white/20 text-white hover:bg-white/30'
                  onClick={(e) => handleAcknowledge(emergency.id, e)}
                  disabled={acknowledgeMutation.isPending}
                >
                  <LuCheck className='mr-1.5 size-4' />
                  Acknowledge
                </Button>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function EmergencyAlertSkeleton() {
  return null // No skeleton needed - if no emergencies, show nothing
}

export function EmergencyAlertBanner() {
  return (
    <Suspense fallback={<EmergencyAlertSkeleton />}>
      <EmergencyAlertContent />
    </Suspense>
  )
}
