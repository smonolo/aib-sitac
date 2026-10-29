'use client'

import { type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/lib/i18n'

type Props = {
  open: boolean
  value: string
  onChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function TextMarkDialog({
  open,
  value,
  onChange,
  onConfirm,
  onCancel,
}: Props) {
  const c = t()

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-aib-canvas-inverse/70 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-aib bg-aib-surface-dark p-5 shadow-lg sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-mark-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <Label
            id="text-mark-title"
            htmlFor="text-mark-input"
            className="min-w-0 flex-1 text-[15px] font-semibold text-aib-fg-inverse"
          >
            {c.textDialogTitle}
          </Label>
          <IconButton aria-label={c.textDialogCancel} onClick={onCancel}>
            <X />
          </IconButton>
        </div>
        <Input
          id="text-mark-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={c.textDialogPlaceholder}
          autoComplete="off"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onCancel}
          >
            {c.textDialogCancel}
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            disabled={!value.trim()}
          >
            {c.textDialogConfirm}
          </Button>
        </div>
      </form>
    </div>
  )
}
