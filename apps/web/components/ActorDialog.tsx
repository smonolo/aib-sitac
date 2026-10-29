'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/lib/i18n'
import { clearActor, readActor, writeActor } from '@/lib/storage'

type Props = {
  open: boolean
  onClose: () => void
  onChange?: (name: string) => void
}

export function ActorDialog({ open, onClose, onChange }: Props) {
  const c = t()
  const [draft, setDraft] = useState('')
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    const current = readActor()
    setDraft(current)
    setHasSaved(Boolean(current))
  }, [open])

  if (!open) return null

  const save = (e: FormEvent) => {
    e.preventDefault()
    const next = draft.trim()
    writeActor(next)
    setHasSaved(Boolean(next))
    onChange?.(next)
    if (next) onClose()
  }

  const logout = () => {
    clearActor()
    setDraft('')
    setHasSaved(false)
    onChange?.('')
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-aib-canvas-inverse/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        className="flex w-full max-w-sm flex-col gap-5 rounded-aib bg-aib-surface-dark p-5 shadow-lg sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="actor-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="actor-dialog-title"
            className="min-w-0 flex-1 text-[15px] font-semibold text-aib-fg-inverse"
          >
            {c.actorDialogTitle}
          </h2>
          <IconButton aria-label={c.textDialogCancel} onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <p className="text-[13px] leading-snug text-aib-muted-dark">
          {c.actorDialogHint}
        </p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="actor-name">{c.actorLabel}</Label>
          <Input
            id="actor-name"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={c.actorPlaceholder}
            autoComplete="nickname"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={!draft.trim()}>
            {c.actorDialogSave}
          </Button>
          {hasSaved ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={logout}
            >
              {c.actorDialogLogout}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
