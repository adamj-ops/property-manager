'use client'

import { createContext, useContext } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cx } from '~/libs/utils'

// Card Context for variant propagation
type CardContextType = {
  variant: 'default' | 'accent'
}

const CardContext = createContext<CardContextType>({
  variant: 'default',
})

const useCardContext = () => {
  return useContext(CardContext)
}

// Card Variants
const cardVariants = cva('flex flex-col items-stretch text-card-foreground rounded-xl', {
  variants: {
    variant: {
      default: 'bg-card border border-border shadow-xs',
      accent: 'bg-muted shadow-xs p-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const cardHeaderVariants = cva('flex items-center justify-between flex-wrap px-5 min-h-14 gap-2.5', {
  variants: {
    variant: {
      default: 'border-b border-border',
      accent: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const cardContentVariants = cva('grow p-5', {
  variants: {
    variant: {
      default: '',
      accent: 'bg-card rounded-t-xl [&:last-child]:rounded-b-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const cardFooterVariants = cva('flex items-center px-5 min-h-14', {
  variants: {
    variant: {
      default: 'border-t border-border',
      accent: 'bg-card rounded-b-xl mt-[2px]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

// Card Component
interface CardProps extends ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <CardContext.Provider value={{ variant: variant || 'default' }}>
      <div
        data-slot="card"
        className={cx(cardVariants({ variant }), className)}
        {...props}
      />
    </CardContext.Provider>
  )
}

// CardHeader Component
function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  const { variant } = useCardContext()
  return (
    <div
      data-slot="card-header"
      className={cx(cardHeaderVariants({ variant }), className)}
      {...props}
    />
  )
}

// CardHeading Component (for title + description grouping)
function CardHeading({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-heading"
      className={cx('space-y-1', className)}
      {...props}
    />
  )
}

// CardToolbar Component (for header actions)
function CardToolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-toolbar"
      className={cx('flex items-center gap-2.5', className)}
      {...props}
    />
  )
}

// CardTitle Component
function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cx('text-base font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

// CardDescription Component
function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cx('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

// CardContent Component
function CardContent({ className, ...props }: ComponentProps<'div'>) {
  const { variant } = useCardContext()
  return (
    <div
      data-slot="card-content"
      className={cx(cardContentVariants({ variant }), className)}
      {...props}
    />
  )
}

// CardFooter Component
function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  const { variant } = useCardContext()
  return (
    <div
      data-slot="card-footer"
      className={cx(cardFooterVariants({ variant }), className)}
      {...props}
    />
  )
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
}
