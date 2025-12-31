import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight, LuEllipsis } from 'react-icons/lu'
import type { ComponentProps } from 'react'

import { cx } from '~/libs/utils'
import { buttonVariants } from '~/components/ui/button'

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      role='navigation'
      aria-label='pagination'
      className={cx('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cx('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cx('', className)} {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ComponentProps<'a'>, 'className' | 'children' | 'onClick'>

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size: 'icon',
        }),
        'cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label='Go to previous page'
      className={cx('gap-1 pl-2.5', className)}
      {...props}
    >
      <LuChevronLeft className='size-4' />
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label='Go to next page'
      className={cx('gap-1 pr-2.5', className)}
      {...props}
    >
      <LuChevronRight className='size-4' />
    </PaginationLink>
  )
}

function PaginationFirst({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label='Go to first page'
      className={cx('gap-1 pl-2.5', className)}
      {...props}
    >
      <LuChevronsLeft className='size-4' />
    </PaginationLink>
  )
}

function PaginationLast({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label='Go to last page'
      className={cx('gap-1 pr-2.5', className)}
      {...props}
    >
      <LuChevronsRight className='size-4' />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cx('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <LuEllipsis className='size-4' />
      <span className='sr-only'>More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
