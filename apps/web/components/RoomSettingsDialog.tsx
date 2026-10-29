'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { SitacIncident } from '@aib-sitac/core'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateIncident } from '@/lib/api'
import { t } from '@/lib/i18n'
import { clearPassphrase, writePassphrase } from '@/lib/storage'

type Props = {
  open: boolean
  incident: SitacIncident
  passphrase: string | null
  onClose: () => void
  onIncidentChange?: (incident: SitacIncident) => void
  onPassphraseChange?: (passphrase: string | null) => void
}

export function RoomSettingsDialog({
  open,
  incident,
  passphrase,
  onClose,
  onIncidentChange,
  onPassphraseChange,
}: Props) {
  const c = t()
  const [titleDraft, setTitleDraft] = useState(incident.title)
  const [passDraft, setPassDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitleDraft(incident.title)
    setPassDraft('')
    setError(null)
    setSaved(false)
  }, [open, incident.title])

  if (!open) return null

  const flashSaved = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const saveTitle = async () => {
    const next = titleDraft.trim()
    if (!next || next === incident.title) return
    setBusy(true)
    setError(null)
    try {
      const updated = await updateIncident(
        incident.id,
        { title: next },
        passphrase
      )
      onIncidentChange?.(updated)
      flashSaved()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  const savePassphrase = async () => {
    const next = passDraft.trim()
    if (next.length < 4) {
      setError(c.roomPassTooShort)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await updateIncident(
        incident.id,
        { passphrase: next },
        passphrase
      )
      writePassphrase(incident.id, next)
      onPassphraseChange?.(next)
      onIncidentChange?.(updated)
      setPassDraft('')
      flashSaved()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  const removePassphrase = async () => {
    setBusy(true)
    setError(null)
    try {
      const updated = await updateIncident(
        incident.id,
        { passphrase: null },
        passphrase
      )
      clearPassphrase(incident.id)
      onPassphraseChange?.(null)
      onIncidentChange?.(updated)
      setPassDraft('')
      flashSaved()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="aib-dialog-backdrop" onClick={onClose}>
      <div
        className="aib-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-settings-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="room-settings-title" className="aib-dialog-title">
            {c.roomSettings}
          </h2>
          <IconButton aria-label={c.textDialogCancel} onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="room-title">{c.roomTitleLabel}</Label>
          <Input
            id="room-title"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            disabled={
              busy || !titleDraft.trim() || titleDraft.trim() === incident.title
            }
            onClick={() => void saveTitle()}
          >
            {c.roomTitleSave}
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-aib-border pt-4 dark:border-aib-border-dark">
          <Label htmlFor="room-pass">{c.roomPassLabel}</Label>
          <p className="text-[12px] leading-snug text-aib-muted dark:text-aib-muted-dark">
            {incident.hasPassphrase ? c.roomPassProtected : c.roomPassOpenHint}
          </p>
          <Input
            id="room-pass"
            type="password"
            value={passDraft}
            onChange={e => setPassDraft(e.target.value)}
            placeholder={c.roomPassPlaceholder}
            disabled={busy}
            autoComplete="new-password"
          />
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={busy || passDraft.trim().length < 4}
              onClick={() => void savePassphrase()}
            >
              {c.roomPassSet}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={busy || !incident.hasPassphrase}
              onClick={() => void removePassphrase()}
            >
              {c.roomPassRemove}
            </Button>
          </div>
        </div>

        {saved ? (
          <p className="text-[13px] text-aib-muted dark:text-aib-muted-dark">
            {c.roomSaved}
          </p>
        ) : null}
        {error ? (
          <p className="text-[13px] text-aib-brand">
            {c.error}: {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
