'use client'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-aib-border-strong transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-aib-track-active/40',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'data-checked:border-aib-fg data-checked:bg-aib-fg data-checked:text-aib-fg-inverse',
        'dark:border-aib-border-strong-dark dark:data-checked:border-aib-fg-inverse dark:data-checked:bg-aib-fg-inverse dark:data-checked:text-aib-fg',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
