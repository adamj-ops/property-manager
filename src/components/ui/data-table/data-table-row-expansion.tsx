'use client'

import type { Row } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { cx } from '~/libs/utils'

interface DataTableRowExpansionProps<TData> {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Row<TData> | null
  title?: string | ((row: Row<TData>) => string)
  description?: string | ((row: Row<TData>) => string)
  children: ReactNode | ((row: Row<TData>) => ReactNode)
  side?: 'left' | 'right'
  className?: string
  // Navigation between rows
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  // Footer actions
  footer?: ReactNode | ((row: Row<TData>) => ReactNode)
}

export function DataTableRowExpansion<TData>({
  open,
  onOpenChange,
  row,
  title,
  description,
  children,
  side = 'right',
  className,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  footer,
}: DataTableRowExpansionProps<TData>) {
  if (!row) return null

  const resolvedTitle = typeof title === 'function' ? title(row) : title
  const resolvedDescription = typeof description === 'function' ? description(row) : description
  const resolvedChildren = typeof children === 'function' ? children(row) : children
  const resolvedFooter = typeof footer === 'function' ? footer(row) : footer

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cx('w-full sm:max-w-xl overflow-y-auto', className)}
      >
        <SheetHeader className='pr-8'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              {resolvedTitle && <SheetTitle>{resolvedTitle}</SheetTitle>}
              {resolvedDescription && (
                <SheetDescription>{resolvedDescription}</SheetDescription>
              )}
            </div>
            {/* Row navigation */}
            {(onPrevious || onNext) && (
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className='h-8 w-8'
                >
                  <LuChevronLeft className='h-4 w-4' />
                  <span className='sr-only'>Previous row</span>
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onNext}
                  disabled={!hasNext}
                  className='h-8 w-8'
                >
                  <LuChevronRight className='h-4 w-4' />
                  <span className='sr-only'>Next row</span>
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          {resolvedChildren}
        </div>

        {resolvedFooter && (
          <div className='mt-6 flex justify-end gap-2 border-t pt-4'>
            {resolvedFooter}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// Helper component for displaying field/value pairs in the expansion panel
interface FieldDisplayProps {
  label: string
  value: ReactNode
  className?: string
}

export function FieldDisplay({ label, value, className }: FieldDisplayProps) {
  return (
    <div className={cx('space-y-1', className)}>
      <dt className='text-sm font-medium text-muted-foreground'>{label}</dt>
      <dd className='text-sm'>{value ?? <span className='text-muted-foreground'>—</span>}</dd>
    </div>
  )
}

// Helper component for grouping fields
interface FieldGroupProps {
  title?: string
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

export function FieldGroup({ title, children, columns = 2, className }: FieldGroupProps) {
  return (
    <div className={cx('space-y-3', className)}>
      {title && (
        <h4 className='text-sm font-semibold border-b pb-2'>{title}</h4>
      )}
      <dl
        className={cx(
          'grid gap-4',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3'
        )}
      >
        {children}
      </dl>
    </div>
  )
}
