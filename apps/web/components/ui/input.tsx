import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-auto min-h-11 w-full min-w-0 rounded-aib border border-aib-border bg-aib-surface px-3.5 py-3 text-[15px] text-aib-fg transition-opacity outline-none',
        'placeholder:text-aib-placeholder focus-visible:border-aib-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'dark:border-aib-border-dark dark:bg-aib-surface-dark dark:text-aib-fg-inverse dark:placeholder:text-aib-placeholder-dark dark:focus-visible:border-aib-border-strong-dark',
        className
      )}
      {...props}
    />
  )
}

export { Input }
