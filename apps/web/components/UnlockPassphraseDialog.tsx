'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  busy?: boolean
  error?: string | null
  onSubmit: (passphrase: string) => void
}

export function UnlockPassphraseDialog({
  open,
  busy = false,
  error = null,
  onSubmit,
}: Props) {
  const c = t()
  const router = useRouter()
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!open) setDraft('')
  }, [open])

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = draft.trim()
    if (!next || busy) return
    onSubmit(next)
  }

  return (
    <div className={cn('aib-dialog-backdrop z-50')} role="presentation">
      <form
        onSubmit={submit}
        className="aib-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-passphrase-title"
        aria-describedby="unlock-passphrase-desc"
      >
        <h2 id="unlock-passphrase-title" className="aib-dialog-title">
          {c.passphraseRequired}
        </h2>
        <p
          id="unlock-passphrase-desc"
          className="text-[13px] leading-snug text-aib-muted dark:text-aib-muted-dark"
        >
          {c.passphraseUnlockHint}
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unlock-pass">{c.passphraseUnlockLabel}</Label>
          <Input
            id="unlock-pass"
            type="password"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoComplete="current-password"
            autoFocus
            disabled={busy}
          />
          {error ? (
            <p className="text-[13px] text-aib-brand" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !draft.trim()}
          >
            {busy ? c.loading : c.unlock}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={() => router.push('/')}
          >
            {c.unlockBackHome}
          </Button>
        </div>
      </form>
    </div>
  )
}
