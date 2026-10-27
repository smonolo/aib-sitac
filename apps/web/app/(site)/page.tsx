'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import { createIncident, listIncidents } from '@/lib/api'
import { formatPageOf, t } from '@/lib/i18n'
import { formatTs, writePassphrase } from '@/lib/storage'
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

const PAGE_SIZE = 10

export default function HomePage() {
  const router = useRouter()
  const c = t()
  const [title, setTitle] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [incidents, setIncidents] = useState<SitacIncident[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQ, setSearchQ] = useState('')
  const [draftQ, setDraftQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setListLoading(true)
      setListError(null)
      try {
        const result = await listIncidents({
          q: searchQ || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
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
  }, [searchQ, fromDate, toDate, page])

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

  const clearFilters = () => {
    setDraftQ('')
    setSearchQ('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const hasFilters = Boolean(draftQ.trim() || searchQ || fromDate || toDate)

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
      })
      goIncident(incident.id, passphrase.trim() || undefined)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-3">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
          {c.brand}
        </h1>
        <p className="text-[16px] leading-normal text-aib-muted-dark sm:text-[17px]">
          {c.tagline}
        </p>
      </header>

      <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10">
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

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Input
              value={draftQ}
              onChange={e => setDraftQ(e.target.value)}
              placeholder={c.incidentsSearch}
              aria-label={c.incidentsSearch}
            />
            <div className="grid grid-cols-2 gap-2">
              <label
                htmlFor="from-date"
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-aib border border-aib-border-dark bg-aib-surface-dark px-3.5 text-[15px] text-aib-fg-inverse transition-[border-color] focus-within:border-aib-border-strong-dark"
              >
                <span className="shrink-0 text-[13px] font-medium text-aib-muted-dark">
                  {c.incidentsFrom}
                </span>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={e => {
                    setFromDate(e.target.value)
                    setPage(1)
                  }}
                  aria-label={c.incidentsFrom}
                  className="min-h-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:border-transparent"
                />
              </label>
              <label
                htmlFor="to-date"
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-aib border border-aib-border-dark bg-aib-surface-dark px-3.5 text-[15px] text-aib-fg-inverse transition-[border-color] focus-within:border-aib-border-strong-dark"
              >
                <span className="shrink-0 text-[13px] font-medium text-aib-muted-dark">
                  {c.incidentsTo}
                </span>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={e => {
                    setToDate(e.target.value)
                    setPage(1)
                  }}
                  aria-label={c.incidentsTo}
                  className="min-h-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:border-transparent"
                />
              </label>
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="aib-link self-start text-[13px] font-medium"
              >
                {c.incidentsClear}
              </button>
            ) : null}
          </div>

          {listLoading ? (
            <p className="text-[13px] text-aib-muted-dark">{c.loading}</p>
          ) : listError ? (
            <p className="text-[13px] text-aib-brand">{listError}</p>
          ) : incidents.length === 0 ? (
            <p className="text-[13px] text-aib-muted-dark">
              {c.incidentsEmpty}
            </p>
          ) : (
            <ul className="aib-list">
              {incidents.map(incident => (
                <li key={incident.id}>
                  <button
                    type="button"
                    onClick={() => goIncident(incident.id)}
                    className="aib-list-row"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-aib-fg-inverse">
                        {incident.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-aib-muted-dark">
                        {formatTs(incident.createdAt)}
                      </span>
                    </span>
                    {incident.hasPassphrase ? (
                      <span className="shrink-0 text-[11px] font-medium tracking-wide text-aib-muted-dark uppercase">
                        {c.incidentsLocked}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

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
              <span className="shrink-0 px-2 text-[13px] text-aib-muted-dark tabular-nums">
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
        </section>
      </div>
    </div>
  )
}
