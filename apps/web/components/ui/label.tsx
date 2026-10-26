import * as React from 'react'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-[13px] font-medium text-aib-muted dark:text-aib-muted-dark',
        className
      )}
      {...props}
    />
  )
}

export { Label }
