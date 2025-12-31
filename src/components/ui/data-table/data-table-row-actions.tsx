'use client'

import { LuEllipsis } from 'react-icons/lu'
import type { Row } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  children: ReactNode
}

export function DataTableRowActions<TData>({
  children,
}: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex size-8 p-0 data-[state=open]:bg-muted'
        >
          <LuEllipsis className='size-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
