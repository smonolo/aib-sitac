'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import type { SitacIncident } from '@aib-sitac/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getIncident, isPassphraseError } from '@/lib/api'
import { t } from '@/lib/i18n'
import { readPassphrase, writePassphrase } from '@/lib/storage'

const SitacMap = dynamic(
  () => import('@/components/SitacMap').then(m => m.SitacMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-0 flex-1 place-items-center text-[13px] text-aib-muted-dark">
        …
      </div>
    ),
  }
)

export default function IncidentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [passInput, setPassInput] = useState('')
  const [incident, setIncident] = useState<SitacIncident | null>(null)
  const [needsPass, setNeedsPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readPassphrase(id)
    if (stored) setPassphrase(stored)
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getIncident(id, passphrase)
        if (cancelled) return
        setIncident(data)
        setNeedsPass(false)
      } catch (err) {
        if (cancelled) return
        if (isPassphraseError(err)) {
          setNeedsPass(true)
          setIncident(null)
        } else {
          setError(String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, passphrase])

  const c = t()

  if (loading) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center text-[15px] text-aib-muted-dark">
        {c.loading}
      </div>
    )
  }

  if (needsPass && !incident) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 sm:px-5">
        <Card>
          <CardHeader>
            <CardTitle>{c.passphraseRequired}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="unlock-pass">{c.passphraseLabel}</Label>
              <Input
                id="unlock-pass"
                type="password"
                value={passInput}
                onChange={e => setPassInput(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                writePassphrase(id, passInput)
                setPassphrase(passInput)
              }}
            >
              {c.unlock}
            </Button>
          </CardContent>
        </Card>
      </main>
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
      onIncidentChange={setIncident}
      onPassphraseChange={setPassphrase}
    />
  )
}
