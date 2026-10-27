'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  iconSrc?: string
  icon?: ReactNode
  title: string
  kindLabel?: string
  body: string
  className?: string
}

export function ToolTipCard({
  iconSrc,
  icon,
  title,
  kindLabel,
  body,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-aib-sm bg-aib-surface-muted-dark px-3 py-2.5',
        className
      )}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            width={28}
            height={28}
            className="mt-0.5 size-7 shrink-0"
          />
        ) : icon ? (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center text-aib-fg-inverse">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[14px] font-semibold text-aib-fg-inverse">
              {title}
            </p>
            {kindLabel ? (
              <span className="shrink-0 text-[11px] font-medium tracking-wide text-aib-muted-dark uppercase">
                {kindLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-aib-muted-dark">
            {body}
          </p>
        </div>
      </div>
    </div>
  )
}
