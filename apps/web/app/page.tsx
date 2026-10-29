'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CircleHelp, Lock, User } from 'lucide-react'
import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import { AboutDialog } from '@/components/AboutDialog'
import { ActorDialog } from '@/components/ActorDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createIncident, listIncidents } from '@/lib/api'
import { formatPageOf, t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { formatTs, readActor, writePassphrase } from '@/lib/storage'

const PAGE_SIZE = 5

type HomeMode = 'open' | 'create'

export default function HomePage() {
  const router = useRouter()
  const c = t()
  const [mode, setMode] = useState<HomeMode>('open')
  const [title, setTitle] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [incidents, setIncidents] = useState<SitacIncident[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQ, setSearchQ] = useState('')
  const [draftQ, setDraftQ] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [actorOpen, setActorOpen] = useState(false)
  const [profileActor, setProfileActor] = useState('')

  useEffect(() => {
    setProfileActor(readActor())
  }, [])

  useEffect(() => {
    if (mode !== 'open') return
    let cancelled = false
    async function load() {
      setListLoading(true)
      setListError(null)
      try {
        const result = await listIncidents({
          q: searchQ || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
        if (cancelled) return
        setIncidents(result.items)
        setTotalPages(result.totalPages)
        setTotal(result.total)
        if (result.page !== page) setPage(result.page)
      } catch (err) {
        if (!cancelled) setListError(String(err))
      } finally {
        if (!cancelled) setListLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [mode, searchQ, page])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draftQ.trim()
      if (next === searchQ) return
      setSearchQ(next)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draftQ, searchQ])

  const goIncident = (id: string, pass?: string) => {
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
        title: title.trim() || 'Intervento',
        centerLng,
        centerLat,
        passphrase: passphrase.trim() || null,
        createdBy: readActor().trim() || null,
      })
      goIncident(incident.id, passphrase.trim() || undefined)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-aib-canvas-inverse p-4 text-aib-fg-inverse">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-aib bg-aib-surface-dark p-6 shadow-lg sm:p-8">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/aib-assets/logo.png"
              alt=""
              width={350}
              height={180}
              className="h-6 w-auto"
              priority
            />
            <span className="text-[26px] font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
              SITAC
            </span>
          </div>
          <p className="text-[13px] leading-snug text-aib-muted-dark">
            {c.tagline}
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-1 rounded-aib-sm bg-aib-track-dark p-1"
          role="tablist"
          aria-label={c.brand}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'open'}
            onClick={() => setMode('open')}
            className={cn(
              'min-h-9 rounded-aib-sm px-3 text-[13px] font-medium transition-opacity',
              mode === 'open'
                ? 'bg-aib-fg-inverse text-aib-fg'
                : 'text-aib-muted-dark hover:opacity-70'
            )}
          >
            {c.homeModeOpen}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            onClick={() => setMode('create')}
            className={cn(
              'min-h-9 rounded-aib-sm px-3 text-[13px] font-medium transition-opacity',
              mode === 'create'
                ? 'bg-aib-fg-inverse text-aib-fg'
                : 'text-aib-muted-dark hover:opacity-70'
            )}
          >
            {c.homeModeCreate}
          </button>
        </div>

        {mode === 'open' ? (
          <div
            className="flex flex-col gap-3"
            role="tabpanel"
            aria-label={c.homeModeOpen}
          >
            <Input
              value={draftQ}
              onChange={e => setDraftQ(e.target.value)}
              placeholder={c.incidentsSearch}
              aria-label={c.incidentsSearch}
            />
            <div className="max-h-80 overflow-y-auto rounded-aib-sm bg-aib-canvas-inverse">
              {listLoading ? (
                <p className="p-3 text-[13px] text-aib-muted-dark">
                  {c.loading}
                </p>
              ) : listError ? (
                <p className="p-3 text-[13px] text-aib-brand">{listError}</p>
              ) : incidents.length === 0 ? (
                <p className="p-3 text-[13px] text-aib-muted-dark">
                  {c.incidentsEmpty}
                </p>
              ) : (
                <ul className="divide-y divide-aib-border-dark">
                  {incidents.map(incident => (
                    <li key={incident.id}>
                      <button
                        type="button"
                        onClick={() => goIncident(incident.id)}
                        className="aib-list-row rounded-none"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-aib-fg-inverse">
                            {incident.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] leading-snug text-aib-muted-dark">
                            {formatTs(incident.createdAt)}
                            {incident.createdBy
                              ? ` · ${incident.createdBy}`
                              : ''}
                          </span>
                        </span>
                        {incident.hasPassphrase ? (
                          <Lock
                            className="size-3.5 shrink-0 text-aib-muted-dark"
                            aria-label={c.incidentsLocked}
                          />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {total > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || listLoading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="aib-quiet-btn flex-1"
                >
                  {c.incidentsPrev}
                </button>
                <span className="shrink-0 px-1.5 text-[12px] text-aib-muted-dark tabular-nums">
                  {formatPageOf(page, totalPages)}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || listLoading}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="aib-quiet-btn flex-1"
                >
                  {c.incidentsNext}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <form
            onSubmit={e => void onCreate(e)}
            className="flex flex-col gap-4"
            role="tabpanel"
            aria-label={c.createTitle}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">{c.titleLabel}</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={c.titlePlaceholder}
                autoFocus
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
              <p className="text-[12px] leading-snug text-aib-muted-dark">
                {c.passphraseHint}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? c.loading : c.createCta}
            </Button>
            {error ? (
              <p className="text-[13px] text-aib-brand">{error}</p>
            ) : null}
          </form>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-aib-border-dark pt-4">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1.5 text-aib-muted-dark"
            onClick={() => setAboutOpen(true)}
          >
            <CircleHelp className="size-3.5 shrink-0" aria-hidden />
            {c.aboutOpen}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="max-w-[10rem] gap-1.5 text-aib-muted-dark"
            aria-label={c.actorDialogOpen}
            onClick={() => setActorOpen(true)}
          >
            <User className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {profileActor.trim() || c.actorDialogOpen}
            </span>
          </Button>
        </div>
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ActorDialog
        open={actorOpen}
        onClose={() => setActorOpen(false)}
        onChange={setProfileActor}
      />
    </div>
  )
}
