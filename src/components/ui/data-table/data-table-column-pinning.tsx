'use client'

import { LuPinOff, LuPin } from 'react-icons/lu'
import type { Column } from '@tanstack/react-table'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface DataTableColumnPinningProps<TData> {
  column: Column<TData, unknown>
}

export function DataTableColumnPinning<TData>({ column }: DataTableColumnPinningProps<TData>) {
  const isPinned = column.getIsPinned()

  if (!column.getCanPin()) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 w-6 p-0'
        >
          {isPinned ? (
            <LuPin className='size-3 text-primary' />
          ) : (
            <LuPinOff className='size-3 text-muted-foreground' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => column.pin('left')}
          disabled={isPinned === 'left'}
        >
          <LuPin className='mr-2 size-4' />
          Pin to left
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => column.pin('right')}
          disabled={isPinned === 'right'}
        >
          <LuPin className='mr-2 size-4 rotate-180' />
          Pin to right
        </DropdownMenuItem>
        {isPinned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.pin(false)}>
              <LuPinOff className='mr-2 size-4' />
              Unpin
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Updated column header that includes pinning
import { LuArrowDown, LuArrowUp, LuChevronsUpDown, LuEyeOff } from 'react-icons/lu'
import type { ComponentProps } from 'react'

import { cx } from '~/libs/utils'

interface DataTableColumnHeaderWithPinProps<TData, TValue> extends ComponentProps<'div'> {
  column: Column<TData, TValue>
  title: string
  enablePinning?: boolean
}

export function DataTableColumnHeaderWithPin<TData, TValue>({
  column,
  title,
  className,
  enablePinning = true,
}: DataTableColumnHeaderWithPinProps<TData, TValue>) {
  const isPinned = column.getIsPinned()

  if (!column.getCanSort() && !enablePinning) {
    return <div className={cx(className)}>{title}</div>
  }

  return (
    <div className={cx('flex items-center gap-1', className)}>
      {column.getCanSort() ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='-ml-3 h-8 data-[state=open]:bg-accent'
            >
              <span>{title}</span>
              {column.getIsSorted() === 'desc' ? (
                <LuArrowDown className='ml-2 size-4' />
              ) : column.getIsSorted() === 'asc' ? (
                <LuArrowUp className='ml-2 size-4' />
              ) : (
                <LuChevronsUpDown className='ml-2 size-4' />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <LuArrowUp className='mr-2 size-3.5 text-muted-foreground/70' />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <LuArrowDown className='mr-2 size-3.5 text-muted-foreground/70' />
              Desc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <LuEyeOff className='mr-2 size-3.5 text-muted-foreground/70' />
              Hide
            </DropdownMenuItem>
            {enablePinning && column.getCanPin() && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => column.pin('left')}
                  disabled={isPinned === 'left'}
                >
                  <LuPin className='mr-2 size-3.5 text-muted-foreground/70' />
                  Pin left
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => column.pin('right')}
                  disabled={isPinned === 'right'}
                >
                  <LuPin className='mr-2 size-3.5 text-muted-foreground/70 rotate-180' />
                  Pin right
                </DropdownMenuItem>
                {isPinned && (
                  <DropdownMenuItem onClick={() => column.pin(false)}>
                    <LuPinOff className='mr-2 size-3.5 text-muted-foreground/70' />
                    Unpin
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span>{title}</span>
      )}
      {isPinned && <LuPin className='size-3 text-primary' />}
    </div>
  )
}
