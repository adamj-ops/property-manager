'use client'

import type { Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { LuCheck, LuCopy, LuDownload, LuPencil, LuTrash2, LuX } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cx } from '~/libs/utils'

interface BulkAction<TData> {
  label: string
  icon?: ReactNode
  onClick: (rows: TData[]) => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

interface DataTableBulkActionsProps<TData> {
  table: Table<TData>
  actions?: BulkAction<TData>[]
  onDelete?: (rows: TData[]) => void
  onExport?: (rows: TData[]) => void
  onDuplicate?: (rows: TData[]) => void
  className?: string
  children?: ReactNode
}

export function DataTableBulkActions<TData>({
  table,
  actions = [],
  onDelete,
  onExport,
  onDuplicate,
  className,
  children,
}: DataTableBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const hasSelection = selectedCount > 0

  if (!hasSelection) return null

  const selectedData = selectedRows.map((row) => row.original)

  // Build default actions
  const defaultActions: BulkAction<TData>[] = []

  if (onDuplicate) {
    defaultActions.push({
      label: 'Duplicate',
      icon: <LuCopy className='h-4 w-4' />,
      onClick: onDuplicate,
    })
  }

  if (onExport) {
    defaultActions.push({
      label: 'Export',
      icon: <LuDownload className='h-4 w-4' />,
      onClick: onExport,
    })
  }

  if (onDelete) {
    defaultActions.push({
      label: 'Delete',
      icon: <LuTrash2 className='h-4 w-4' />,
      onClick: onDelete,
      variant: 'destructive',
    })
  }

  const allActions = [...actions, ...defaultActions]

  return (
    <div
      className={cx(
        'flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2',
        className
      )}
    >
      {/* Selection count */}
      <div className='flex items-center gap-2'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
          {selectedCount}
        </div>
        <span className='text-sm font-medium'>
          {selectedCount === 1 ? 'item selected' : 'items selected'}
        </span>
      </div>

      <div className='h-4 w-px bg-border' />

      {/* Quick actions */}
      <div className='flex items-center gap-1'>
        {allActions.slice(0, 3).map((action, index) => (
          <Button
            key={index}
            variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
            size='sm'
            onClick={() => action.onClick(selectedData)}
            disabled={action.disabled}
            className='h-8'
          >
            {action.icon}
            <span className='ml-1'>{action.label}</span>
          </Button>
        ))}

        {/* More actions dropdown if > 3 */}
        {allActions.length > 3 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-8'>
                More...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              {allActions.slice(3).map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => action.onClick(selectedData)}
                  disabled={action.disabled}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {action.icon}
                  <span className='ml-2'>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Custom children */}
        {children}
      </div>

      <div className='flex-1' />

      {/* Clear selection */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => table.resetRowSelection()}
        className='h-8'
      >
        <LuX className='h-4 w-4 mr-1' />
        Clear
      </Button>
    </div>
  )
}

// Floating bulk actions bar (fixed at bottom)
export function DataTableBulkActionsFloating<TData>(
  props: DataTableBulkActionsProps<TData>
) {
  const selectedCount = props.table.getFilteredSelectedRowModel().rows.length

  if (selectedCount === 0) return null

  return (
    <div className='fixed bottom-4 left-1/2 z-50 -translate-x-1/2 shadow-lg'>
      <DataTableBulkActions {...props} className='bg-background border-2' />
    </div>
  )
}
