'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import { getIncident, getIncidentGate, isPassphraseError } from '@/lib/api'
import { t } from '@/lib/i18n'
import { clearPassphrase, readPassphrase, writePassphrase } from '@/lib/storage'

const SitacMap = dynamic(
  () => import('@/components/SitacMap').then(m => m.SitacMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-0 flex-1 place-items-center text-[13px] text-aib-muted dark:text-aib-muted-dark">
        …
      </div>
    ),
  }
)

function lockedStub(id: string): SitacIncident {
  return {
    id,
    title: t().roomLockedTitle,
    createdAt: new Date(0).toISOString(),
    createdBy: null,
    centerLng: DEFAULT_CENTER.lng,
    centerLat: DEFAULT_CENTER.lat,
    zoom: DEFAULT_CENTER.zoom,
    hasPassphrase: true,
    schemaVersion: 1,
  }
}

export default function IncidentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const c = t()
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [incident, setIncident] = useState<SitacIncident | null>(null)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const enterLocked = useCallback(() => {
    clearPassphrase(id)
    setPassphrase(null)
    setIncident(lockedStub(id))
    setLocked(true)
    setUnlockError(null)
    setError(null)
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setUnlockError(null)
      try {
        const gate = await getIncidentGate(id)
        if (cancelled) return

        if (gate.hasPassphrase) {
          const stored = readPassphrase(id)
          if (!stored) {
            enterLocked()
            return
          }
          try {
            const data = await getIncident(id, stored)
            if (cancelled) return
            setIncident(data)
            setPassphrase(stored)
            setLocked(false)
          } catch (err) {
            if (cancelled) return
            if (isPassphraseError(err)) enterLocked()
            else setError(String(err))
          }
          return
        }

        const data = await getIncident(id, null)
        if (cancelled) return
        setIncident(data)
        setPassphrase(null)
        setLocked(false)
      } catch (err) {
        if (cancelled) return
        setIncident(null)
        setLocked(false)
        setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [enterLocked, id])

  const handleUnlock = async (pass: string) => {
    setUnlockBusy(true)
    setUnlockError(null)
    try {
      const data = await getIncident(id, pass)
      writePassphrase(id, pass)
      setPassphrase(pass)
      setIncident(data)
      setLocked(false)
    } catch (err) {
      if (isPassphraseError(err)) {
        setUnlockError(c.passphraseWrong)
      } else {
        setUnlockError(String(err))
      }
    } finally {
      setUnlockBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center text-[15px] text-aib-muted dark:text-aib-muted-dark">
        {c.loading}
      </div>
    )
  }

  if (error || !incident) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 sm:px-5">
        <p className="text-[15px] text-aib-brand">
          {c.error}: {error ?? c.notFound}
        </p>
      </main>
    )
  }

  return (
    <SitacMap
      incident={incident}
      passphrase={passphrase}
      locked={locked}
      unlockBusy={unlockBusy}
      unlockError={unlockError}
      onUnlock={pass => void handleUnlock(pass)}
      onIncidentChange={setIncident}
      onPassphraseChange={setPassphrase}
      onAccessDenied={enterLocked}
    />
  )
}
