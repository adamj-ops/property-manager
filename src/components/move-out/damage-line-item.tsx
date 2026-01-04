import { useState } from 'react'
import { LuImage, LuPencil, LuTrash2, LuX } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
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
import { Textarea } from '~/components/ui/textarea'

interface DamageItem {
  id: string
  description: string
  location?: string | null
  repairCost: number | string
  isNormalWear: boolean
  isPreExisting: boolean
  photoUrls: string[]
  notes?: string | null
}

interface DamageLineItemProps {
  item: DamageItem
  onUpdate?: (id: string, data: Partial<DamageItem>) => void
  onDelete?: (id: string) => void
  readOnly?: boolean
}

export function DamageLineItem({ item, onUpdate, onDelete, readOnly = false }: DamageLineItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DamageItem>>({})

  const cost = typeof item.repairCost === 'string' ? parseFloat(item.repairCost) : item.repairCost
  const isDeductible = !item.isNormalWear && !item.isPreExisting

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(item.id, editData)
    }
    setIsEditing(false)
    setEditData({})
  }

  const handleStartEdit = () => {
    setEditData({
      description: item.description,
      location: item.location || '',
      repairCost: cost,
      isNormalWear: item.isNormalWear,
      isPreExisting: item.isPreExisting,
      notes: item.notes || '',
    })
    setIsEditing(true)
  }

  return (
    <>
      <Card className={!isDeductible ? 'border-dashed opacity-75' : ''}>
        <CardContent className='p-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1 space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium'>{item.description}</span>
                {item.location && (
                  <Badge variant='outline' className='text-xs'>
                    {item.location}
                  </Badge>
                )}
                {item.isNormalWear && (
                  <Badge variant='secondary' className='text-xs'>
                    Normal Wear
                  </Badge>
                )}
                {item.isPreExisting && (
                  <Badge variant='secondary' className='text-xs'>
                    Pre-existing
                  </Badge>
                )}
              </div>
              {item.notes && (
                <p className='text-sm text-muted-foreground'>{item.notes}</p>
              )}
              {item.photoUrls.length > 0 && (
                <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <LuImage className='size-3' />
                  <span>{item.photoUrls.length} photo(s)</span>
                </div>
              )}
            </div>

            <div className='flex items-center gap-3'>
              <div className='text-right'>
                <div className={`font-semibold ${isDeductible ? 'text-red-600' : 'text-muted-foreground line-through'}`}>
                  ${cost.toFixed(2)}
                </div>
                {!isDeductible && (
                  <span className='text-xs text-muted-foreground'>Not deducted</span>
                )}
              </div>

              {!readOnly && (
                <div className='flex gap-1'>
                  <Button variant='ghost' size='icon' onClick={handleStartEdit}>
                    <LuPencil className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive'
                    onClick={() => onDelete?.(item.id)}
                  >
                    <LuTrash2 className='size-4' />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Damage Item</DialogTitle>
            <DialogDescription>Update the damage details and cost estimate.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='location'>Location</Label>
              <Input
                id='location'
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                placeholder='e.g., Living Room, Kitchen'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='repairCost'>Repair Cost ($)</Label>
              <Input
                id='repairCost'
                type='number'
                min='0'
                step='0.01'
                value={editData.repairCost || ''}
                onChange={(e) => setEditData({ ...editData, repairCost: parseFloat(e.target.value) })}
              />
            </div>

            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isNormalWear'
                  checked={editData.isNormalWear || false}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, isNormalWear: checked as boolean })
                  }
                />
                <Label htmlFor='isNormalWear' className='text-sm font-normal'>
                  Normal wear and tear (not deductible)
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isPreExisting'
                  checked={editData.isPreExisting || false}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, isPreExisting: checked as boolean })
                  }
                />
                <Label htmlFor='isPreExisting' className='text-sm font-normal'>
                  Pre-existing damage (not deductible)
                </Label>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder='Additional details about the damage...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface AddDamageItemFormProps {
  onAdd: (data: Omit<DamageItem, 'id'>) => void
  onCancel: () => void
}

export function AddDamageItemForm({ onAdd, onCancel }: AddDamageItemFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    repairCost: 0,
    isNormalWear: false,
    isPreExisting: false,
    photoUrls: [] as string[],
    notes: '',
  })

  const handleSubmit = () => {
    if (!formData.description || formData.repairCost < 0) return
    onAdd(formData)
  }

  return (
    <Card className='border-dashed border-primary'>
      <CardContent className='p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='font-medium'>Add Damage Item</span>
          <Button variant='ghost' size='icon' onClick={onCancel}>
            <LuX className='size-4' />
          </Button>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='new-description'>Description *</Label>
            <Input
              id='new-description'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Describe the damage'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='new-location'>Location</Label>
            <Input
              id='new-location'
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder='e.g., Living Room'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='new-repairCost'>Repair Cost ($) *</Label>
          <Input
            id='new-repairCost'
            type='number'
            min='0'
            step='0.01'
            value={formData.repairCost}
            onChange={(e) => setFormData({ ...formData, repairCost: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className='space-y-3'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='new-isNormalWear'
              checked={formData.isNormalWear}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isNormalWear: checked as boolean })
              }
            />
            <Label htmlFor='new-isNormalWear' className='text-sm font-normal'>
              Normal wear and tear (not deductible)
            </Label>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='new-isPreExisting'
              checked={formData.isPreExisting}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPreExisting: checked as boolean })
              }
            />
            <Label htmlFor='new-isPreExisting' className='text-sm font-normal'>
              Pre-existing damage (not deductible)
            </Label>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='new-notes'>Notes</Label>
          <Textarea
            id='new-notes'
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder='Additional details...'
            rows={2}
          />
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.description}>
            Add Damage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
