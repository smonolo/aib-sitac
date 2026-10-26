'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_CENTER } from '@aib-sitac/core'
import { createIncident } from '@/lib/api'
import { t, type Locale } from '@/lib/i18n'
import {
  readActor,
  readLocale,
  writeActor,
  writeLocale,
  writePassphrase,
} from '@/lib/storage'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'

export default function HomePage() {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'it'
    return readLocale()
  })
  const c = useMemo(() => t(locale), [locale])
  const [title, setTitle] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [actor, setActor] = useState(() => {
    if (typeof window === 'undefined') return ''
    return readActor()
  })
  const [existingId, setExistingId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchLocale = (next: Locale) => {
    setLocale(next)
    writeLocale(next)
  }

  const goIncident = (id: string, pass?: string) => {
    writeActor(actor)
    if (pass) writePassphrase(id, pass)
    router.push(`/i/${id}`)
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      let centerLng = DEFAULT_CENTER.lng
      let centerLat = DEFAULT_CENTER.lat
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 2500,
                maximumAge: 60_000,
              })
            }
          )
          centerLng = pos.coords.longitude
          centerLat = pos.coords.latitude
        } catch {}
      }
      const incident = await createIncident({
        title: title.trim() || (locale === 'it' ? 'Incidente' : 'Incident'),
        centerLng,
        centerLat,
        passphrase: passphrase.trim() || null,
      })
      goIncident(incident.id, passphrase.trim() || undefined)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[700px] flex-col justify-center gap-8 bg-aib-canvas-inverse px-4 py-10 text-aib-fg-inverse sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-[-0.2px] text-aib-fg-inverse">
            {c.brand}
          </p>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
            {c.tagline}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-aib-muted-dark">
            {c.unofficial}
          </p>
        </div>
        <SegmentedControl
          aria-label={c.language}
          value={locale}
          onChange={switchLocale}
          options={[
            { value: 'it', label: 'IT' },
            { value: 'en', label: 'EN' },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c.createTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => void onCreate(e)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">{c.titleLabel}</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={c.titlePlaceholder}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="actor">{c.actorLabel}</Label>
              <Input
                id="actor"
                value={actor}
                onChange={e => setActor(e.target.value)}
                placeholder={c.actorPlaceholder}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="passphrase">{c.passphraseLabel}</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
              />
              <CardDescription>{c.passphraseHint}</CardDescription>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? c.loading : c.createCta}
            </Button>
            {error ? (
              <p className="text-[13px] text-aib-brand">{error}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.openExisting}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault()
              if (!existingId.trim()) return
              goIncident(existingId.trim())
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="incidentId">{c.incidentIdLabel}</Label>
              <Input
                id="incidentId"
                value={existingId}
                onChange={e => setExistingId(e.target.value)}
                className="font-mono text-[13px]"
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full">
              {c.openCta}
            </Button>
          </form>
        </CardContent>
      </Card>

      <nav className="flex flex-wrap gap-4 text-[13px] font-medium text-aib-muted-dark">
        <a
          href="/privacy"
          className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
        >
          {c.privacy}
        </a>
        <a
          href="/terms"
          className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
        >
          {c.terms}
        </a>
        <a
          href="https://smnl.dev/aib-sitac"
          className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
          target="_blank"
          rel="noreferrer"
        >
          smnl.dev
        </a>
      </nav>
    </main>
  )
}
