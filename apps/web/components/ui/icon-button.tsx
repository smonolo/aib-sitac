'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-label': string
  children: ReactNode
}

export function IconButton({ className, children, ...props }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-aib-surface-muted text-aib-fg transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-40 dark:bg-aib-surface-muted-dark dark:text-aib-fg-inverse [&_svg]:size-5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
