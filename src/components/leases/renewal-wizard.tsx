import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LuArrowRight, LuCalendar, LuDollarSign, LuLoader2, LuRefreshCw } from 'react-icons/lu'
import { toast } from 'sonner'

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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { useCreateLeaseRenewal } from '~/services/lease-renewals.query'

interface RenewalWizardProps {
  lease: {
    id: string
    leaseNumber: string
    tenant: {
      id: string
      firstName: string
      lastName: string
    }
    unit: {
      id: string
      unitNumber: string
      property: {
        id: string
        name: string
      }
    }
    startDate: string | Date
    endDate: string | Date
    monthlyRent: number | string
    securityDeposit: number | string
    petRent?: number | string | null
    status: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DURATION_OPTIONS = [
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months (1 year)' },
  { value: '24', label: '24 months (2 years)' },
  { value: 'mtm', label: 'Month-to-Month' },
]

export function RenewalWizard({ lease, open, onOpenChange }: RenewalWizardProps) {
  const navigate = useNavigate()
  const createRenewal = useCreateLeaseRenewal()

  // Calculate defaults
  const currentRent = Number(lease.monthlyRent)
  const currentEndDate = new Date(lease.endDate)
  const defaultStartDate = new Date(currentEndDate)
  defaultStartDate.setDate(defaultStartDate.getDate() + 1)

  // Form state
  const [duration, setDuration] = useState('12')
  const [startDate, setStartDate] = useState(defaultStartDate.toISOString().split('T')[0])
  const [newRent, setNewRent] = useState(currentRent.toString())
  const [notes, setNotes] = useState('')

  // Calculate end date based on duration
  const calculateEndDate = (): Date => {
    const start = new Date(startDate)
    if (duration === 'mtm') {
      // Month-to-month: just add 1 month
      start.setMonth(start.getMonth() + 1)
      start.setDate(start.getDate() - 1)
    } else {
      const months = parseInt(duration)
      start.setMonth(start.getMonth() + months)
      start.setDate(start.getDate() - 1)
    }
    return start
  }

  const endDate = calculateEndDate()

  // Calculate rent increase
  const rentIncrease = Number(newRent) - currentRent
  const rentIncreasePercent = currentRent > 0 ? ((rentIncrease / currentRent) * 100).toFixed(1) : '0'

  const handleSubmit = async () => {
    try {
      const newLease = await createRenewal.mutateAsync({
        leaseId: lease.id,
        startDate: new Date(startDate),
        endDate: endDate,
        monthlyRent: Number(newRent),
        notes: notes || undefined,
      })

      toast.success('Lease renewal created successfully', {
        description: `New lease draft ${newLease.leaseNumber} created`,
      })

      onOpenChange(false)

      // Navigate to the new lease
      navigate({
        to: '/app/leases/$leaseId',
        params: { leaseId: newLease.id },
      })
    } catch (error) {
      toast.error('Failed to create renewal', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuRefreshCw className='size-5' />
            Renew Lease
          </DialogTitle>
          <DialogDescription>
            Create a new lease renewal for {lease.tenant.firstName} {lease.tenant.lastName} at Unit{' '}
            {lease.unit.unitNumber}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Current Lease Summary */}
          <Card className='bg-muted/50'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Current Lease</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4 text-sm md:grid-cols-3'>
              <div>
                <p className='text-muted-foreground'>Lease Number</p>
                <p className='font-medium'>{lease.leaseNumber}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Current Rent</p>
                <p className='font-medium'>${currentRent.toLocaleString()}/mo</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Expires</p>
                <p className='font-medium'>{new Date(lease.endDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* New Lease Terms */}
          <div className='space-y-4'>
            <h4 className='font-medium'>New Lease Terms</h4>

            <div className='grid gap-4 md:grid-cols-2'>
              {/* Duration */}
              <div className='space-y-2'>
                <Label htmlFor='duration'>Lease Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id='duration'>
                    <SelectValue placeholder='Select duration' />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className='space-y-2'>
                <Label htmlFor='startDate'>Start Date</Label>
                <div className='relative'>
                  <LuCalendar className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='startDate'
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              {/* New Monthly Rent */}
              <div className='space-y-2'>
                <Label htmlFor='newRent'>New Monthly Rent</Label>
                <div className='relative'>
                  <LuDollarSign className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='newRent'
                    type='number'
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    className='pl-10'
                    min={0}
                    step={0.01}
                  />
                </div>
                {rentIncrease !== 0 && (
                  <p className='text-xs text-muted-foreground'>
                    {rentIncrease > 0 ? (
                      <span className='text-orange-600'>
                        +${rentIncrease.toLocaleString()} ({rentIncreasePercent}% increase)
                      </span>
                    ) : (
                      <span className='text-green-600'>
                        -${Math.abs(rentIncrease).toLocaleString()} ({Math.abs(Number(rentIncreasePercent))}% decrease)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Calculated End Date */}
              <div className='space-y-2'>
                <Label>End Date (Calculated)</Label>
                <div className='flex h-10 items-center rounded-md border bg-muted px-3 text-sm'>
                  {endDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (Optional)</Label>
              <Textarea
                id='notes'
                placeholder='Add any notes about this renewal...'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Renewal Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>New Lease Period</span>
                <span className='font-medium'>
                  {new Date(startDate).toLocaleDateString()} – {endDate.toLocaleDateString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Monthly Rent</span>
                <span className='font-medium'>${Number(newRent).toLocaleString()}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Lease Status</span>
                <Badge variant='secondary'>Draft</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRenewal.isPending}>
            {createRenewal.isPending ? (
              <>
                <LuLoader2 className='mr-2 size-4 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                Create Renewal
                <LuArrowRight className='ml-2 size-4' />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
