'use client'

import { Braces, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { t } from '@/lib/i18n'

type Props = {
  open: boolean
  busy?: boolean
  onClose: () => void
  onExportGeoJson: () => void
  onExportPng: () => void
}

export function ExportDialog({
  open,
  busy = false,
  onClose,
  onExportGeoJson,
  onExportPng,
}: Props) {
  const c = t()

  if (!open) return null

  return (
    <div className="aib-dialog-backdrop" onClick={busy ? undefined : onClose}>
      <div
        className="aib-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="export-dialog-title" className="aib-dialog-title">
            {c.exportTitle}
          </h2>
          <IconButton
            aria-label={c.exportClose}
            onClick={onClose}
            disabled={busy}
          >
            <X />
          </IconButton>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            disabled={busy}
            onClick={onExportGeoJson}
          >
            <Braces className="size-[18px] shrink-0" aria-hidden />
            {c.exportGeoJson}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            disabled={busy}
            onClick={onExportPng}
          >
            <ImageIcon className="size-[18px] shrink-0" aria-hidden />
            {c.exportPng}
          </Button>
        </div>
      </div>
    </div>
  )
}
