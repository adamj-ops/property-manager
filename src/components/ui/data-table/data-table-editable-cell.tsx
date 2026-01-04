'use client'

import { useEffect, useState } from 'react'
import type { CellContext } from '@tanstack/react-table'
import { LuLoaderCircle } from 'react-icons/lu'

import { cx } from '~/libs/utils'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'

// Extend table meta to include updateData function
declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

interface EditableCellProps<TData, TValue> extends CellContext<TData, TValue> {
  type?: 'text' | 'number' | 'select' | 'date' | 'email' | 'phone' | 'currency'
  options?: { label: string; value: string }[]
  editable?: boolean
  className?: string
  /** Async callback for saving to API. If provided, will show loading state during save. */
  onSave?: (rowData: TData, columnId: string, value: TValue) => Promise<void>
}

export function EditableCell<TData, TValue>({
  getValue,
  row,
  column,
  table,
  type = 'text',
  options = [],
  editable = true,
  className,
  onSave,
}: EditableCellProps<TData, TValue>) {
  const initialValue = getValue() as string | number
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sync with external changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const onBlur = async () => {
    setIsEditing(false)
    if (value !== initialValue) {
      if (onSave) {
        setIsSaving(true)
        try {
          await onSave(row.original, column.id, value as TValue)
          table.options.meta?.updateData(row.index, column.id, value)
        } catch (error) {
          // Revert on error
          setValue(initialValue)
        } finally {
          setIsSaving(false)
        }
      } else {
        table.options.meta?.updateData(row.index, column.id, value)
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onBlur()
    }
    if (e.key === 'Escape') {
      setValue(initialValue)
      setIsEditing(false)
    }
    if (e.key === 'Tab') {
      onBlur()
      // Don't prevent default - let browser handle tab navigation
    }
  }

  if (!editable) {
    return <span className={className}>{formatValue(value, type)}</span>
  }

  // Saving state
  if (isSaving) {
    return (
      <div className='flex items-center gap-2 px-2 py-1 text-muted-foreground'>
        <LuLoaderCircle className='size-4 animate-spin' />
        <span className='text-sm'>Saving...</span>
      </div>
    )
  }

  // Editing state
  if (isEditing) {
    if (type === 'select' && options.length > 0) {
      return (
        <Select
          value={String(value)}
          onValueChange={(newValue) => {
            setValue(newValue)
            table.options.meta?.updateData(row.index, column.id, newValue)
            setIsEditing(false)
          }}
          open={true}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false)
          }}
        >
          <SelectTrigger className='h-8 w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        type={type === 'currency' ? 'number' : type === 'phone' ? 'tel' : type}
        value={value ?? ''}
        onChange={(e) => setValue(type === 'number' || type === 'currency' ? Number(e.target.value) : e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className={cx(
          'h-8 w-full min-w-[60px] px-2 py-1',
          type === 'currency' && 'text-right',
          className
        )}
      />
    )
  }

  // Display state
  return (
    <div
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      tabIndex={0}
      role='button'
      className={cx(
        'cursor-pointer rounded px-2 py-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'min-h-[32px] flex items-center',
        type === 'currency' && 'justify-end',
        className
      )}
    >
      {formatValue(value, type)}
    </div>
  )
}

function formatValue(value: string | number | null | undefined, type: string): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  switch (type) {
    case 'currency':
      return `$${Number(value).toLocaleString()}`
    case 'date':
      return new Date(String(value)).toLocaleDateString()
    case 'phone':
      return String(value)
    default:
      return String(value)
  }
}

// Badge-based editable cell for status fields
interface EditableBadgeCellProps<TData, TValue> extends CellContext<TData, TValue> {
  options: { label: string; value: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }[]
  editable?: boolean
  /** Async callback for saving to API. If provided, will show loading state during save. */
  onSave?: (rowData: TData, columnId: string, value: string) => Promise<void>
}

export function EditableBadgeCell<TData, TValue>({
  getValue,
  row,
  column,
  table,
  options,
  editable = true,
  onSave,
}: EditableBadgeCellProps<TData, TValue>) {
  const value = getValue() as string
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentOption = options.find((o) => o.value === value)

  if (!editable) {
    return (
      <Badge variant={currentOption?.variant || 'secondary'} className={currentOption?.className}>
        {currentOption?.label || value}
      </Badge>
    )
  }

  if (isSaving) {
    return (
      <Badge variant='outline' className='gap-1'>
        <LuLoaderCircle className='size-3 animate-spin' />
        Saving...
      </Badge>
    )
  }

  const handleValueChange = async (newValue: string) => {
    setIsOpen(false)
    if (newValue !== value) {
      if (onSave) {
        setIsSaving(true)
        try {
          await onSave(row.original, column.id, newValue)
          table.options.meta?.updateData(row.index, column.id, newValue)
        } finally {
          setIsSaving(false)
        }
      } else {
        table.options.meta?.updateData(row.index, column.id, newValue)
      }
    }
  }

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className='h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0'>
        <Badge
          variant={currentOption?.variant || 'secondary'}
          className={cx('cursor-pointer hover:opacity-80', currentOption?.className)}
        >
          {currentOption?.label || value}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <Badge variant={option.variant || 'secondary'} className={option.className}>
              {option.label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
