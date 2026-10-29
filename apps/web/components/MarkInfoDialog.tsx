'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { MarkIcon, markIconSize } from '@/components/MarkIcon'
import { IconButton } from '@/components/ui/icon-button'
import { t } from '@/lib/i18n'

type Props = {
  open: boolean
  title: string
  kindLabel?: string
  iconSrc?: string
  icon?: ReactNode
  purpose: string
  howTo: string
  onClose: () => void
}

export function MarkInfoDialog({
  open,
  title,
  kindLabel,
  iconSrc,
  icon,
  purpose,
  howTo,
  onClose,
}: Props) {
  const c = t()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-aib-canvas-inverse/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-5 rounded-aib bg-aib-surface-dark p-5 shadow-lg sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-info-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {iconSrc ? (
              <MarkIcon src={iconSrc} size={markIconSize.dialog} />
            ) : icon ? (
              <span
                className="flex shrink-0 items-center justify-center text-aib-fg-inverse [&_svg]:size-5"
                style={{
                  width: markIconSize.dialog,
                  height: markIconSize.dialog,
                }}
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2
                id="mark-info-title"
                className="truncate text-[15px] leading-tight font-semibold text-aib-fg-inverse"
              >
                {title}
              </h2>
              {kindLabel ? (
                <p className="text-[11px] leading-tight font-medium tracking-wide text-aib-muted-dark uppercase">
                  {kindLabel}
                </p>
              ) : null}
            </div>
          </div>
          <IconButton aria-label={c.markInfoClose} onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4">
          <section>
            <h3 className="text-[13px] leading-snug font-semibold text-aib-fg-inverse">
              {c.markInfoPurpose}
            </h3>
            <p className="text-[13px] leading-snug text-aib-muted-dark">
              {purpose}
            </p>
          </section>
          <section>
            <h3 className="text-[13px] leading-snug font-semibold text-aib-fg-inverse">
              {c.markInfoHow}
            </h3>
            <p className="text-[13px] leading-snug text-aib-muted-dark">
              {howTo}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
