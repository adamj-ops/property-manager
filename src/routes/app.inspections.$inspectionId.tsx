import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  LuCircleAlert,
  LuArrowLeft,
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuClipboardCheck,
  LuLoaderCircle,
  LuPlay,
  LuX,
} from 'react-icons/lu'
import { toast } from 'sonner'
import { useState } from 'react'

import { RoomChecklist } from '~/components/inspections/room-checklist'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import {
  inspectionQueryOptions,
  useStartInspection,
  useCompleteInspection,
  useCancelInspection,
} from '~/services/inspections.query'
import type { InspectionStatus, InspectionType } from '~/services/inspections.schema'

export const Route = createFileRoute('/app/inspections/$inspectionId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(inspectionQueryOptions(params.inspectionId))
  },
  pendingComponent: InspectionDetailLoading,
  component: InspectionDetailPage,
})

function InspectionDetailLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
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

function InspectionDetailPage() {
  const { inspectionId } = Route.useParams()
  const navigate = useNavigate()
  const { data: inspection } = useSuspenseQuery(inspectionQueryOptions(inspectionId))

  const startInspection = useStartInspection()
  const completeInspection = useCompleteInspection()
  const cancelInspection = useCancelInspection()

  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [summary, setSummary] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const statusStyle = STATUS_STYLES[inspection.status as InspectionStatus]
  const isReadOnly = inspection.status === 'COMPLETED' || inspection.status === 'CANCELLED'

  const handleStart = async () => {
    try {
      await startInspection.mutateAsync(inspectionId)
      toast.success('Inspection started')
    } catch (error) {
      toast.error('Failed to start inspection')
    }
  }

  const handleComplete = async () => {
    try {
      await completeInspection.mutateAsync({
        id: inspectionId,
        summary: summary || undefined,
      })
      toast.success('Inspection completed')
      setShowCompleteDialog(false)
    } catch (error) {
      toast.error('Failed to complete inspection')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelInspection.mutateAsync({
        id: inspectionId,
        reason: cancelReason || undefined,
      })
      toast.success('Inspection cancelled')
      setShowCancelDialog(false)
      navigate({ to: '/app/inspections' })
    } catch (error) {
      toast.error('Failed to cancel inspection')
    }
  }

  // Calculate stats
  const items = inspection.items || []
  const totalItems = items.length
  const completedItems = items.filter((i: any) => i.condition).length
  const damageItems = items.filter((i: any) => i.hasDamage).length
  const totalRepairCost = items.reduce((sum: number, i: any) => sum + (i.estimatedRepairCost || 0), 0)

  return (
    <div className='w-full max-w-5xl space-y-6 py-6'>
      {/* Back Link */}
      <Button variant='ghost' asChild className='-ml-4'>
        <Link to='/app/inspections'>
          <LuArrowLeft className='mr-2 size-4' />
          Back to Inspections
        </Link>
      </Button>

      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2 className='flex items-center gap-2'>
              <LuClipboardCheck className='size-7' />
              {TYPE_LABELS[inspection.type as InspectionType]} Inspection
            </Typography.H2>
            <Badge variant={statusStyle.variant} className={statusStyle.className}>
              {(inspection.status as string).replace('_', ' ')}
            </Badge>
          </div>
          <div className='flex items-center gap-4 text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <LuBuilding2 className='size-4' />
              <span>{inspection.property?.name}</span>
              {inspection.unit && (
                <Badge variant='outline' className='ml-1'>
                  Unit {inspection.unit.unitNumber}
                </Badge>
              )}
            </div>
            {inspection.scheduledDate && (
              <div className='flex items-center gap-1'>
                <LuCalendar className='size-4' />
                <span>
                  {format(new Date(inspection.scheduledDate), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          {inspection.status === 'SCHEDULED' && (
            <>
              <Button variant='outline' onClick={() => setShowCancelDialog(true)}>
                <LuX className='mr-2 size-4' />
                Cancel
              </Button>
              <Button onClick={handleStart} disabled={startInspection.isPending}>
                {startInspection.isPending ? (
                  <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                ) : (
                  <LuPlay className='mr-2 size-4' />
                )}
                Start Inspection
              </Button>
            </>
          )}
          {inspection.status === 'IN_PROGRESS' && (
            <>
              <Button variant='outline' onClick={() => setShowCancelDialog(true)}>
                <LuX className='mr-2 size-4' />
                Cancel
              </Button>
              <Button onClick={() => setShowCompleteDialog(true)}>
                <LuCheck className='mr-2 size-4' />
                Complete Inspection
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Items Inspected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {completedItems}/{totalItems}
            </div>
          </CardContent>
        </Card>
        <Card className={damageItems > 0 ? 'border-red-300 bg-red-50/50' : ''}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Damage Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${damageItems > 0 ? 'text-red-600' : ''}`}>
              {damageItems}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Est. Repair Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${totalRepairCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {new Set(items.map((i: any) => i.room)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {inspection.notes && (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>{inspection.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Inspection Summary (if completed) */}
      {inspection.status === 'COMPLETED' && inspection.summary && (
        <Card className='border-green-200 bg-green-50/50'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-green-800'>Inspection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-green-700'>{inspection.summary}</p>
            {inspection.completedAt && (
              <p className='mt-2 text-sm text-green-600'>
                Completed on {format(new Date(inspection.completedAt), 'MMMM d, yyyy h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Start Notice */}
      {inspection.status === 'SCHEDULED' && (
        <Card className='border-blue-200 bg-blue-50/50'>
          <CardContent className='flex items-center gap-4 py-4'>
            <LuCircleAlert className='size-5 text-blue-600' />
            <div>
              <p className='font-medium text-blue-800'>Inspection Not Started</p>
              <p className='text-sm text-blue-600'>
                Click "Start Inspection" to begin adding items and documenting conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Checklist */}
      {(inspection.status === 'IN_PROGRESS' || inspection.status === 'COMPLETED') && (
        <div className='space-y-4'>
          <Typography.H3>Room Checklist</Typography.H3>
          <RoomChecklist
            inspectionId={inspectionId}
            items={items}
            readOnly={isReadOnly}
          />
        </div>
      )}

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Inspection</DialogTitle>
            <DialogDescription>
              Mark this inspection as complete. Add a summary of your findings.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='rounded-lg bg-muted p-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>Items Inspected:</span>
                  <span className='ml-2 font-medium'>{completedItems}/{totalItems}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Damage Found:</span>
                  <span className='ml-2 font-medium'>{damageItems}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Est. Repairs:</span>
                  <span className='ml-2 font-medium'>${totalRepairCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='summary'>Inspection Summary (Optional)</Label>
              <Textarea
                id='summary'
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder='Summarize the inspection findings...'
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={completeInspection.isPending}>
              {completeInspection.isPending ? (
                <LuLoaderCircle className='mr-2 size-4 animate-spin' />
              ) : (
                <LuCheck className='mr-2 size-4' />
              )}
              Complete Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Inspection</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this inspection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='cancelReason'>Reason for Cancellation (Optional)</Label>
            <Textarea
              id='cancelReason'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder='Why is this inspection being cancelled?'
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCancelDialog(false)}>
              Keep Inspection
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancel}
              disabled={cancelInspection.isPending}
            >
              {cancelInspection.isPending ? (
                <LuLoaderCircle className='mr-2 size-4 animate-spin' />
              ) : (
                <LuX className='mr-2 size-4' />
              )}
              Cancel Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
