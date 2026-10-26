'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import type { SitacIncident } from '@aib-sitac/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getIncident } from '@/lib/api'
import { t, type Locale } from '@/lib/i18n'
import {
  readActor,
  readLocale,
  readPassphrase,
  writePassphrase,
} from '@/lib/storage'

const SitacMap = dynamic(
  () => import('@/components/SitacMap').then(m => m.SitacMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-aib-canvas-inverse text-[13px] text-aib-muted-dark">
        …
      </div>
    ),
  }
)

export default function IncidentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [locale, setLocale] = useState<Locale>('it')
  const [actor, setActor] = useState('')
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [passInput, setPassInput] = useState('')
  const [incident, setIncident] = useState<SitacIncident | null>(null)
  const [needsPass, setNeedsPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLocale(readLocale())
    setActor(readActor())
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
        const message = String(err)
        if (
          message.toLowerCase().includes('passphrase') ||
          message.toLowerCase().includes('unauthorized') ||
          message.toLowerCase().includes('forbidden')
        ) {
          setNeedsPass(true)
          setIncident(null)
        } else {
          setError(message)
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

  const c = t(locale)

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-[15px] text-aib-muted-dark">
        {c.loading}
      </div>
    )
  }

  if (needsPass && !incident) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
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
        <a
          href="/"
          className="text-center text-[13px] font-medium text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
        >
          {c.home}
        </a>
      </main>
    )
  }

  if (error || !incident) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
        <p className="text-[15px] text-aib-brand">
          {c.error}: {error ?? 'Not found'}
        </p>
        <a
          href="/"
          className="text-[13px] font-medium text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
        >
          {c.home}
        </a>
      </main>
    )
  }

  return (
    <SitacMap
      incident={incident}
      passphrase={passphrase}
      locale={locale}
      actorLabel={actor}
    />
  )
}
