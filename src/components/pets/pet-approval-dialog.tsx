import { useState } from 'react'
import { LuCheck, LuLoader2, LuX } from 'react-icons/lu'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
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
import { useApprovePet, useDenyPet, useRemovePet } from '~/services/pets.query'
import type { PetType } from '~/services/pets.schema'

interface Pet {
  id: string
  name: string
  type: PetType
  breed?: string | null
  status: string
  tenant?: {
    firstName: string
    lastName: string
  }
}

interface PetApprovalDialogProps {
  pet: Pet | null
  mode: 'approve' | 'deny' | 'remove' | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PetApprovalDialog({
  pet,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: PetApprovalDialogProps) {
  const [notes, setNotes] = useState('')
  const [denialReason, setDenialReason] = useState('')
  const [removalReason, setRemovalReason] = useState('')

  const approvePet = useApprovePet()
  const denyPet = useDenyPet()
  const removePet = useRemovePet()

  const isLoading = approvePet.isPending || denyPet.isPending || removePet.isPending

  const handleClose = () => {
    setNotes('')
    setDenialReason('')
    setRemovalReason('')
    onOpenChange(false)
  }

  const handleApprove = async () => {
    if (!pet) return

    try {
      await approvePet.mutateAsync({
        id: pet.id,
        notes: notes || undefined,
      })
      toast.success('Pet approved', {
        description: `${pet.name} has been approved`,
      })
      handleClose()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to approve pet', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleDeny = async () => {
    if (!pet) return

    if (!denialReason.trim()) {
      toast.error('Denial reason is required')
      return
    }

    try {
      await denyPet.mutateAsync({
        id: pet.id,
        denialReason: denialReason.trim(),
      })
      toast.success('Pet application denied', {
        description: `${pet.name}'s application has been denied`,
      })
      handleClose()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to deny pet', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleRemove = async () => {
    if (!pet) return

    try {
      await removePet.mutateAsync({
        id: pet.id,
        removalReason: removalReason || undefined,
      })
      toast.success('Pet marked as removed', {
        description: `${pet.name} has been marked as no longer at property`,
      })
      handleClose()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to remove pet', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  if (!pet) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {mode === 'approve' && <LuCheck className='size-5 text-green-600' />}
            {mode === 'deny' && <LuX className='size-5 text-destructive' />}
            {mode === 'approve' && 'Approve Pet Application'}
            {mode === 'deny' && 'Deny Pet Application'}
            {mode === 'remove' && 'Remove Pet'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'approve' && 'Approve this pet to live at the property.'}
            {mode === 'deny' && 'Deny this pet application. A reason is required.'}
            {mode === 'remove' && 'Mark this pet as no longer residing at the property.'}
          </DialogDescription>
        </DialogHeader>

        {/* Pet Summary */}
        <div className='rounded-lg border p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>{pet.name}</p>
              <p className='text-sm text-muted-foreground'>
                {pet.breed || pet.type}
              </p>
              {pet.tenant && (
                <p className='text-xs text-muted-foreground'>
                  Owner: {pet.tenant.firstName} {pet.tenant.lastName}
                </p>
              )}
            </div>
            <Badge variant='secondary'>{pet.status}</Badge>
          </div>
        </div>

        {/* Approval Notes */}
        {mode === 'approve' && (
          <div className='space-y-2'>
            <Label htmlFor='approval-notes'>Approval Notes (Optional)</Label>
            <Textarea
              id='approval-notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any notes about this approval...'
              rows={3}
            />
          </div>
        )}

        {/* Denial Reason */}
        {mode === 'deny' && (
          <div className='space-y-2'>
            <Label htmlFor='denial-reason'>
              Denial Reason <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='denial-reason'
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder='Explain why this pet application is being denied...'
              rows={3}
            />
            <p className='text-xs text-muted-foreground'>
              This reason will be shared with the tenant.
            </p>
          </div>
        )}

        {/* Removal Reason */}
        {mode === 'remove' && (
          <div className='space-y-2'>
            <Label htmlFor='removal-reason'>Removal Reason (Optional)</Label>
            <Textarea
              id='removal-reason'
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              placeholder='e.g., Pet passed away, tenant moved, etc.'
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          {mode === 'approve' && (
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? (
                <LuLoader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <LuCheck className='mr-2 size-4' />
              )}
              Approve
            </Button>
          )}
          {mode === 'deny' && (
            <Button
              variant='destructive'
              onClick={handleDeny}
              disabled={isLoading || !denialReason.trim()}
            >
              {isLoading ? (
                <LuLoader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <LuX className='mr-2 size-4' />
              )}
              Deny Application
            </Button>
          )}
          {mode === 'remove' && (
            <Button variant='secondary' onClick={handleRemove} disabled={isLoading}>
              {isLoading ? (
                <LuLoader2 className='mr-2 size-4 animate-spin' />
              ) : null}
              Mark as Removed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
