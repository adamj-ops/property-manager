import type { ComponentProps, HTMLInputTypeAttribute } from 'react'

import { cx } from '~/libs/utils'

// https://css-tricks.com/everything-you-ever-wanted-to-know-about-inputmode/
const defaultInputModes: Partial<Record<HTMLInputTypeAttribute, ComponentProps<'input'>['inputMode']>> = {
  url: 'url',
  tel: 'tel',
  text: 'text',
  email: 'email',
  number: 'numeric',
}

function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type='text'
      spellCheck={false}
      autoComplete='off'
      onWheel={(e) => e.currentTarget.blur()}
      inputMode={defaultInputModes[props.type ?? 'text']}
      className={cx(
        // Base styles
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'dark:bg-input/30 border-input',
        'h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
        // File input styles
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Disabled state
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // Responsive font size
        'md:text-sm',
        // Focus state
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        // Invalid state
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
