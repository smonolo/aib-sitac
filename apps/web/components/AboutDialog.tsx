'use client'

import { BookOpen, FileText, Scale, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { t } from '@/lib/i18n'
import { MARKETING_URLS } from '@/lib/marketing'

type Props = {
  open: boolean
  onClose: () => void
}

function openMarketing(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function AboutDialog({ open, onClose }: Props) {
  const c = t()

  if (!open) return null

  return (
    <div className="aib-dialog-backdrop" onClick={onClose}>
      <div
        className="aib-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="about-dialog-title" className="aib-dialog-title">
            {c.aboutTitle}
          </h2>
          <IconButton aria-label={c.aboutClose} onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <p className="text-[13px] leading-snug text-aib-muted dark:text-aib-muted-dark">
          {c.unofficial}
        </p>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => openMarketing(MARKETING_URLS.guide)}
          >
            <BookOpen className="size-[18px] shrink-0" aria-hidden />
            {c.guide}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => openMarketing(MARKETING_URLS.privacy)}
          >
            <FileText className="size-[18px] shrink-0" aria-hidden />
            {c.privacy}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => openMarketing(MARKETING_URLS.terms)}
          >
            <Scale className="size-[18px] shrink-0" aria-hidden />
            {c.terms}
          </Button>
        </div>
      </div>
    </div>
  )
}
