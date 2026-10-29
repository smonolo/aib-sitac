'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, FileText, Scale, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { t } from '@/lib/i18n'

type Props = {
  open: boolean
  onClose: () => void
}

export function AboutDialog({ open, onClose }: Props) {
  const c = t()
  const router = useRouter()

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
        aria-labelledby="about-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="about-dialog-title"
            className="min-w-0 flex-1 text-[15px] font-semibold text-aib-fg-inverse"
          >
            {c.aboutTitle}
          </h2>
          <IconButton aria-label={c.aboutClose} onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <p className="text-[13px] leading-snug text-aib-muted-dark">
          {c.unofficial}
        </p>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => {
              window.open(
                'https://smnl.dev/aib-sitac/guide',
                '_blank',
                'noopener,noreferrer'
              )
            }}
          >
            <BookOpen className="size-[18px] shrink-0" aria-hidden />
            {c.guide}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => {
              onClose()
              router.push('/privacy')
            }}
          >
            <FileText className="size-[18px] shrink-0" aria-hidden />
            {c.privacy}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={() => {
              onClose()
              router.push('/terms')
            }}
          >
            <Scale className="size-[18px] shrink-0" aria-hidden />
            {c.terms}
          </Button>
        </div>
      </div>
    </div>
  )
}
