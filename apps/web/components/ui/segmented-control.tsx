'use client'

import { cn } from '@/lib/utils'

type Option<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-0.5 rounded-aib-sm bg-aib-track p-0.5 dark:bg-aib-track-dark',
        className
      )}
    >
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (!active) onChange(option.value)
            }}
            className={cn(
              'min-h-7 min-w-7 cursor-pointer rounded-md px-2 text-[12px] font-medium transition-opacity sm:text-[13px]',
              active
                ? 'bg-aib-fg text-aib-fg-inverse dark:bg-aib-fg-inverse dark:text-aib-fg'
                : 'text-aib-track-idle hover:opacity-70 dark:text-aib-track-idle-dark'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
