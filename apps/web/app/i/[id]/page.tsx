'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import type { SitacIncident } from '@aib-sitac/core'
import { getIncident, getIncidentGate } from '@/lib/api'
import { t } from '@/lib/i18n'
import {
  classifyUnlockError,
  lockedIncidentStub,
  resolveRoomGate,
  unlockErrorMessage,
} from '@/lib/room-access'
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
    setIncident(lockedIncidentStub(id, c.roomLockedTitle))
    setLocked(true)
    setUnlockError(null)
    setError(null)
  }, [c.roomLockedTitle, id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setUnlockError(null)
      try {
        const gate = await getIncidentGate(id)
        if (cancelled) return
        const result = await resolveRoomGate({
          hasPassphrase: gate.hasPassphrase,
          storedPassphrase: readPassphrase(id),
          loadIncident: pass => getIncident(id, pass),
        })
        if (cancelled) return
        if (result.status === 'locked') {
          enterLocked()
          return
        }
        if (result.status === 'error') {
          setIncident(null)
          setLocked(false)
          setError(result.message)
          return
        }
        setIncident(result.incident)
        setPassphrase(result.passphrase)
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
      setUnlockError(
        unlockErrorMessage(classifyUnlockError(err), {
          passphraseWrong: c.passphraseWrong,
        })
      )
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
