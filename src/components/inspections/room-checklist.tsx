import { useState } from 'react'
import {
  LuCamera,
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuPlus,
  LuTrash2,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { ConditionRating, ConditionBadge } from '~/components/inspections/condition-rating'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { ROOM_TEMPLATES, type Condition, type RoomType } from '~/services/inspections.schema'
import {
  useAddInspectionItem,
  useUpdateInspectionItem,
  useDeleteInspectionItem,
} from '~/services/inspections.query'

interface InspectionItem {
  id: string
  room: string
  item: string
  condition: string
  notes?: string | null
  photoUrls: string[]
  hasDamage: boolean
  damageDescription?: string | null
  estimatedRepairCost?: number | null
  tenantResponsible: boolean
}

interface RoomChecklistProps {
  inspectionId: string
  items: InspectionItem[]
  readOnly?: boolean
}

export function RoomChecklist({ inspectionId, items, readOnly = false }: RoomChecklistProps) {
  // Group items by room
  const itemsByRoom = items.reduce((acc, item) => {
    if (!acc[item.room]) {
      acc[item.room] = []
    }
    acc[item.room].push(item)
    return acc
  }, {} as Record<string, InspectionItem[]>)

  // Track expanded rooms
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(Object.keys(itemsByRoom)))

  const toggleRoom = (room: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(room)) {
      newExpanded.delete(room)
    } else {
      newExpanded.add(room)
    }
    setExpandedRooms(newExpanded)
  }

  // Get available rooms that haven't been fully checked
  const availableRooms = Object.keys(ROOM_TEMPLATES).filter((room) => {
    const existingItems = itemsByRoom[room] || []
    const templateItems = ROOM_TEMPLATES[room as RoomType]
    return existingItems.length < templateItems.length
  })

  return (
    <div className='space-y-4'>
      {/* Existing Rooms */}
      {Object.entries(itemsByRoom).map(([room, roomItems]) => (
        <RoomSection
          key={room}
          room={room}
          items={roomItems}
          inspectionId={inspectionId}
          isExpanded={expandedRooms.has(room)}
          onToggle={() => toggleRoom(room)}
          readOnly={readOnly}
        />
      ))}

      {/* Add Room Button */}
      {!readOnly && availableRooms.length > 0 && (
        <AddRoomSection
          inspectionId={inspectionId}
          availableRooms={availableRooms}
          existingRooms={Object.keys(itemsByRoom)}
        />
      )}
    </div>
  )
}

interface RoomSectionProps {
  room: string
  items: InspectionItem[]
  inspectionId: string
  isExpanded: boolean
  onToggle: () => void
  readOnly: boolean
}

function RoomSection({ room, items, inspectionId, isExpanded, onToggle, readOnly }: RoomSectionProps) {
  const completedCount = items.filter((i) => i.condition).length
  const damageCount = items.filter((i) => i.hasDamage).length

  return (
    <Card>
      <CardHeader
        className='cursor-pointer py-3'
        onClick={onToggle}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isExpanded ? (
              <LuChevronDown className='size-4' />
            ) : (
              <LuChevronRight className='size-4' />
            )}
            <CardTitle className='text-base'>{room}</CardTitle>
            <Badge variant='outline'>
              {completedCount}/{items.length} items
            </Badge>
            {damageCount > 0 && (
              <Badge variant='destructive'>{damageCount} damage</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className='space-y-4 pt-0'>
          {items.map((item) => (
            <InspectionItemRow
              key={item.id}
              item={item}
              inspectionId={inspectionId}
              readOnly={readOnly}
            />
          ))}

          {/* Add item to this room */}
          {!readOnly && (
            <AddItemToRoom room={room} inspectionId={inspectionId} existingItems={items} />
          )}
        </CardContent>
      )}
    </Card>
  )
}

interface InspectionItemRowProps {
  item: InspectionItem
  inspectionId: string
  readOnly: boolean
}

function InspectionItemRow({ item, inspectionId, readOnly }: InspectionItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [condition, setCondition] = useState<Condition>(item.condition as Condition)
  const [notes, setNotes] = useState(item.notes || '')
  const [hasDamage, setHasDamage] = useState(item.hasDamage)
  const [damageDescription, setDamageDescription] = useState(item.damageDescription || '')
  const [repairCost, setRepairCost] = useState(item.estimatedRepairCost?.toString() || '')
  const [tenantResponsible, setTenantResponsible] = useState(item.tenantResponsible)

  const updateItem = useUpdateInspectionItem()
  const deleteItem = useDeleteInspectionItem()

  const handleSave = async () => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        condition,
        notes: notes || undefined,
        hasDamage,
        damageDescription: hasDamage ? damageDescription : undefined,
        estimatedRepairCost: hasDamage && repairCost ? Number(repairCost) : undefined,
        tenantResponsible: hasDamage ? tenantResponsible : false,
      })
      toast.success('Item updated')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id)
      toast.success('Item removed')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  if (readOnly) {
    return (
      <div className='rounded-lg border p-3'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='font-medium'>{item.item}</p>
            <div className='mt-1'>
              <ConditionBadge condition={item.condition} size='sm' />
            </div>
          </div>
          {item.hasDamage && (
            <Badge variant='destructive'>Damage</Badge>
          )}
        </div>
        {item.notes && (
          <p className='mt-2 text-sm text-muted-foreground'>{item.notes}</p>
        )}
        {item.hasDamage && item.damageDescription && (
          <div className='mt-2 rounded bg-red-50 p-2 text-sm'>
            <p className='font-medium text-red-800'>Damage: {item.damageDescription}</p>
            {item.estimatedRepairCost && (
              <p className='text-red-600'>Est. Repair: ${item.estimatedRepairCost}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!isEditing) {
    return (
      <div
        className='cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50'
        onClick={() => setIsEditing(true)}
      >
        <div className='flex items-start justify-between'>
          <div>
            <p className='font-medium'>{item.item}</p>
            <div className='mt-1'>
              <ConditionBadge condition={item.condition} size='sm' />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {item.hasDamage && (
              <Badge variant='destructive'>Damage</Badge>
            )}
            {item.photoUrls.length > 0 && (
              <Badge variant='outline'>
                <LuCamera className='mr-1 size-3' />
                {item.photoUrls.length}
              </Badge>
            )}
          </div>
        </div>
        {item.notes && (
          <p className='mt-2 text-sm text-muted-foreground'>{item.notes}</p>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <p className='font-medium'>{item.item}</p>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleDelete}
          className='size-8 text-destructive'
        >
          <LuTrash2 className='size-4' />
        </Button>
      </div>

      <div className='space-y-2'>
        <Label>Condition</Label>
        <ConditionRating value={condition} onChange={setCondition} size='sm' />
      </div>

      <div className='space-y-2'>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Add notes...'
          rows={2}
        />
      </div>

      <div className='flex items-center justify-between'>
        <Label>Has Damage?</Label>
        <Switch checked={hasDamage} onCheckedChange={setHasDamage} />
      </div>

      {hasDamage && (
        <div className='space-y-4 rounded-lg bg-red-50 p-3'>
          <div className='space-y-2'>
            <Label>Damage Description</Label>
            <Textarea
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder='Describe the damage...'
              rows={2}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Estimated Repair Cost ($)</Label>
              <Input
                type='number'
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                placeholder='0.00'
                min={0}
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label>Tenant Responsible?</Label>
              <Switch checked={tenantResponsible} onCheckedChange={setTenantResponsible} />
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateItem.isPending}>
          <LuCheck className='mr-1 size-4' />
          Save
        </Button>
      </div>
    </div>
  )
}

interface AddItemToRoomProps {
  room: string
  inspectionId: string
  existingItems: InspectionItem[]
}

function AddItemToRoom({ room, inspectionId, existingItems }: AddItemToRoomProps) {
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useAddInspectionItem()

  const templateItems = ROOM_TEMPLATES[room as RoomType] || []
  const existingItemNames = existingItems.map((i) => i.item)
  const availableItems = templateItems.filter((item) => !existingItemNames.includes(item))

  const handleAddItem = async (item: string) => {
    try {
      await addItem.mutateAsync({
        inspectionId,
        room,
        item,
        condition: 'GOOD',
      })
      toast.success(`Added ${item}`)
    } catch (error) {
      toast.error('Failed to add item')
    }
  }

  if (!isAdding) {
    return (
      <Button variant='ghost' size='sm' onClick={() => setIsAdding(true)}>
        <LuPlus className='mr-1 size-4' />
        Add Item
      </Button>
    )
  }

  return (
    <div className='space-y-2 rounded-lg border p-3'>
      <p className='text-sm font-medium'>Select item to add:</p>
      <div className='flex flex-wrap gap-2'>
        {availableItems.map((item) => (
          <Button
            key={item}
            variant='outline'
            size='sm'
            onClick={() => handleAddItem(item)}
            disabled={addItem.isPending}
          >
            {item}
          </Button>
        ))}
        <Button variant='ghost' size='sm' onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

interface AddRoomSectionProps {
  inspectionId: string
  availableRooms: string[]
  existingRooms: string[]
}

function AddRoomSection({ inspectionId, availableRooms, existingRooms }: AddRoomSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useAddInspectionItem()

  const handleAddRoom = async (room: string) => {
    const templateItems = ROOM_TEMPLATES[room as RoomType] || []
    if (templateItems.length === 0) return

    try {
      // Add the first item from the template to create the room
      await addItem.mutateAsync({
        inspectionId,
        room,
        item: templateItems[0],
        condition: 'GOOD',
      })
      toast.success(`Added ${room}`)
      setIsAdding(false)
    } catch (error) {
      toast.error('Failed to add room')
    }
  }

  if (!isAdding) {
    return (
      <Button variant='outline' onClick={() => setIsAdding(true)}>
        <LuPlus className='mr-2 size-4' />
        Add Room
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className='py-3'>
        <CardTitle className='text-base'>Add Room</CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='flex flex-wrap gap-2'>
          {availableRooms
            .filter((room) => !existingRooms.includes(room))
            .map((room) => (
              <Button
                key={room}
                variant='outline'
                size='sm'
                onClick={() => handleAddRoom(room)}
                disabled={addItem.isPending}
              >
                {room}
              </Button>
            ))}
          <Button variant='ghost' size='sm' onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
