'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { t } from '@/lib/i18n'

type Props = {
  open: boolean
  markLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteMarkDialog({
  open,
  markLabel,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const c = t()

  if (!open) return null

  return (
    <div className="aib-dialog-backdrop" onClick={busy ? undefined : onCancel}>
      <div
        className="aib-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-mark-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="delete-mark-title" className="aib-dialog-title">
            {c.deleteMarkTitle}
          </h2>
          <IconButton
            aria-label={c.deleteMarkCancel}
            onClick={onCancel}
            disabled={busy}
          >
            <X />
          </IconButton>
        </div>

        <p className="text-[13px] leading-snug text-aib-muted dark:text-aib-muted-dark">
          {markLabel
            ? c.deleteMarkBodyNamed.replace('{name}', markLabel)
            : c.deleteMarkBody}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={onCancel}
          >
            {c.deleteMarkCancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={onConfirm}
          >
            {c.deleteMarkConfirm}
          </Button>
        </div>
      </div>
    </div>
  )
}
