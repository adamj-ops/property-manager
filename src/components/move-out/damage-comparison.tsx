import { useState } from 'react'
import { LuArrowRight, LuCircleAlert, LuCircleCheck, LuImage, LuPlus } from 'react-icons/lu'

import { ConditionBadge } from '~/components/inspections/condition-rating'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'

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
}

interface ComparisonItem {
  room: string
  item: string
  moveIn: InspectionItem | null
  moveOut: InspectionItem | null
  conditionChanged: boolean
  damageAdded?: boolean
  itemRemoved?: boolean
}

interface DamageComparisonProps {
  comparison: ComparisonItem[]
  onAddDamage?: (item: ComparisonItem) => void
  readOnly?: boolean
}

export function DamageComparison({ comparison, onAddDamage, readOnly = false }: DamageComparisonProps) {
  // Group by room
  const groupedByRoom = comparison.reduce((acc, item) => {
    if (!acc[item.room]) {
      acc[item.room] = []
    }
    acc[item.room].push(item)
    return acc
  }, {} as Record<string, ComparisonItem[]>)

  const rooms = Object.keys(groupedByRoom).sort()

  return (
    <div className='space-y-4'>
      {rooms.map((room) => (
        <RoomComparisonCard
          key={room}
          room={room}
          items={groupedByRoom[room]}
          onAddDamage={onAddDamage}
          readOnly={readOnly}
        />
      ))}

      {comparison.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <LuCircleAlert className='size-12 text-muted-foreground' />
            <p className='mt-4 text-lg font-medium'>No Inspection Data</p>
            <p className='text-muted-foreground'>
              Both move-in and move-out inspections are required for comparison.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface RoomComparisonCardProps {
  room: string
  items: ComparisonItem[]
  onAddDamage?: (item: ComparisonItem) => void
  readOnly?: boolean
}

function RoomComparisonCard({ room, items, onAddDamage, readOnly }: RoomComparisonCardProps) {
  const [isOpen, setIsOpen] = useState(true)

  const hasChanges = items.some((i) => i.conditionChanged || i.damageAdded)
  const changedCount = items.filter((i) => i.conditionChanged || i.damageAdded).length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={hasChanges ? 'border-yellow-300' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className='cursor-pointer hover:bg-muted/50'>
            <CardTitle className='flex items-center justify-between text-base'>
              <span>{room}</span>
              <div className='flex items-center gap-2'>
                {changedCount > 0 && (
                  <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
                    {changedCount} change{changedCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant='outline'>{items.length} items</Badge>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className='space-y-3 pt-0'>
            {items.map((item, index) => (
              <ComparisonRow
                key={`${item.room}-${item.item}-${index}`}
                item={item}
                onAddDamage={onAddDamage}
                readOnly={readOnly}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

interface ComparisonRowProps {
  item: ComparisonItem
  onAddDamage?: (item: ComparisonItem) => void
  readOnly?: boolean
}

function ComparisonRow({ item, onAddDamage, readOnly }: ComparisonRowProps) {
  const hasChange = item.conditionChanged || item.damageAdded
  const moveInCondition = item.moveIn?.condition as any
  const moveOutCondition = item.moveOut?.condition as any

  return (
    <div
      className={`rounded-lg border p-3 ${
        hasChange ? 'border-yellow-300 bg-yellow-50/50' : 'bg-muted/30'
      }`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='font-medium'>{item.item}</span>
          {item.itemRemoved && (
            <Badge variant='destructive' className='text-xs'>
              Removed
            </Badge>
          )}
        </div>

        {!readOnly && hasChange && onAddDamage && (
          <Button variant='outline' size='sm' onClick={() => onAddDamage(item)}>
            <LuPlus className='mr-1 size-3' />
            Add Damage
          </Button>
        )}
      </div>

      <div className='mt-2 flex items-center gap-4'>
        {/* Move-In */}
        <div className='flex-1'>
          <div className='mb-1 text-xs text-muted-foreground'>Move-In</div>
          {item.moveIn ? (
            <div className='flex items-center gap-2'>
              <ConditionBadge condition={moveInCondition} />
              {item.moveIn.photoUrls.length > 0 && (
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <LuImage className='size-3' />
                  {item.moveIn.photoUrls.length}
                </span>
              )}
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>Not inspected</span>
          )}
        </div>

        {/* Arrow */}
        <LuArrowRight className='size-4 text-muted-foreground' />

        {/* Move-Out */}
        <div className='flex-1'>
          <div className='mb-1 text-xs text-muted-foreground'>Move-Out</div>
          {item.moveOut ? (
            <div className='flex items-center gap-2'>
              <ConditionBadge condition={moveOutCondition} />
              {item.moveOut.hasDamage && (
                <Badge variant='destructive' className='text-xs'>
                  Damaged
                </Badge>
              )}
              {item.moveOut.photoUrls.length > 0 && (
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <LuImage className='size-3' />
                  {item.moveOut.photoUrls.length}
                </span>
              )}
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>Not inspected</span>
          )}
        </div>

        {/* Status */}
        <div className='w-24 text-right'>
          {!hasChange ? (
            <span className='flex items-center justify-end gap-1 text-sm text-green-600'>
              <LuCircleCheck className='size-4' />
              OK
            </span>
          ) : (
            <span className='flex items-center justify-end gap-1 text-sm text-yellow-600'>
              <LuCircleAlert className='size-4' />
              Changed
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      {(item.moveIn?.notes || item.moveOut?.notes || item.moveOut?.damageDescription) && (
        <div className='mt-2 space-y-1 text-sm'>
          {item.moveIn?.notes && (
            <p className='text-muted-foreground'>
              <span className='font-medium'>Move-in note:</span> {item.moveIn.notes}
            </p>
          )}
          {item.moveOut?.notes && (
            <p className='text-muted-foreground'>
              <span className='font-medium'>Move-out note:</span> {item.moveOut.notes}
            </p>
          )}
          {item.moveOut?.damageDescription && (
            <p className='text-red-600'>
              <span className='font-medium'>Damage:</span> {item.moveOut.damageDescription}
              {item.moveOut.estimatedRepairCost && (
                <span className='ml-2 font-medium'>
                  Est. ${Number(item.moveOut.estimatedRepairCost).toFixed(2)}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
