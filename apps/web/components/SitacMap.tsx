'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapMouseEvent,
  StyleSpecification,
} from 'maplibre-gl'
import {
  SYMBOL_CATALOG,
  featuresToGeoJson,
  foldFeatures,
  getSymbol,
  listMarkEvents,
  listNamedMoments,
  type LonLat,
  type SitacEvent,
  type SitacFeature,
  type SitacGeometry,
  type SitacIncident,
  type SymbolId,
} from '@aib-sitac/core'
import { appendEvent, eventsStreamUrl, listEvents } from '@/lib/api'
import { formatStepOf, geometryKindLabel, t, type Locale } from '@/lib/i18n'
import { loadSymbolIcon, symbolIconDataUrl } from '@/lib/map-icons'
import { formatTs } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const SYMBOL_ICON_URLS = Object.fromEntries(
  SYMBOL_CATALOG.map(s => [s.id, symbolIconDataUrl(s.id, s.color)])
) as Record<SymbolId, string>

type DrawMode = 'idle' | 'drawing'

function newId(): string {
  return crypto.randomUUID()
}

function toFc(features: readonly SitacFeature[]): GeoJSON.FeatureCollection {
  return featuresToGeoJson(features) as GeoJSON.FeatureCollection
}

type Props = {
  incident: SitacIncident
  passphrase: string | null
  locale: Locale
  actorLabel: string
}

export function SitacMap({ incident, passphrase, locale, actorLabel }: Props) {
  const c = t(locale)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [events, setEvents] = useState<SitacEvent[]>([])
  const [scrubTs, setScrubTs] = useState<string | null>(null)
  const [symbolId, setSymbolId] = useState<SymbolId>('hotspot')
  const [estimated, setEstimated] = useState(false)
  const [drawCoords, setDrawCoords] = useState<LonLat[]>([])
  const [drawMode, setDrawMode] = useState<DrawMode>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snapshotName, setSnapshotName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const symbol = getSymbol(symbolId) ?? SYMBOL_CATALOG[0]!
  const live = scrubTs === null
  const features = useMemo(
    () => foldFeatures(events, scrubTs),
    [events, scrubTs]
  )
  const moments = useMemo(() => listNamedMoments(events), [events])
  const markEvents = useMemo(() => listMarkEvents(events), [events])

  const scrubIndex = useMemo(() => {
    if (markEvents.length === 0) return 0
    if (scrubTs == null) return markEvents.length - 1
    const scrubMs = Date.parse(scrubTs)
    let idx = 0
    for (let i = 0; i < markEvents.length; i++) {
      if (Date.parse(markEvents[i]!.ts) <= scrubMs) idx = i
      else break
    }
    return idx
  }, [markEvents, scrubTs])

  const goToMarkStep = useCallback(
    (idx: number) => {
      if (markEvents.length === 0) {
        setScrubTs(null)
        return
      }
      const clamped = Math.max(0, Math.min(idx, markEvents.length - 1))
      if (clamped >= markEvents.length - 1) {
        setScrubTs(null)
        return
      }
      setScrubTs(markEvents[clamped]!.ts)
    },
    [markEvents]
  )

  const refresh = useCallback(async () => {
    const list = await listEvents(incident.id, passphrase)
    setEvents(list)
  }, [incident.id, passphrase])

  useEffect(() => {
    refresh().catch(err => setError(String(err)))
  }, [refresh])

  useEffect(() => {
    if (passphrase) {
      const id = window.setInterval(() => {
        refresh().catch(() => undefined)
      }, 4000)
      return () => window.clearInterval(id)
    }
    const es = new EventSource(eventsStreamUrl(incident.id))
    es.onmessage = msg => {
      try {
        const event = JSON.parse(msg.data) as SitacEvent
        setEvents(prev =>
          prev.some(e => e.id === event.id) ? prev : [...prev, event]
        )
      } catch {}
    }
    es.onerror = () => {}
    return () => es.close()
  }, [incident.id, passphrase, refresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    let cancelled = false
    let map: MapLibreMap | null = null
    let resizeObserver: ResizeObserver | null = null

    void (async () => {
      type MaplibreGl = typeof import('maplibre-gl')
      const mod = (await import('maplibre-gl')) as MaplibreGl & {
        default?: MaplibreGl
      }
      const maplibregl: MaplibreGl = mod.default ?? mod
      if (cancelled || !containerRef.current) return

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [incident.centerLng, incident.centerLat],
        zoom: incident.zoom,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      })
      map = instance
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        'top-right'
      )
      mapRef.current = instance
      setMapReady(false)

      const resize = () => {
        instance.resize()
      }
      requestAnimationFrame(resize)
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(el)

      instance.on('load', () => {
        void (async () => {
          instance.resize()
          await Promise.all(
            SYMBOL_CATALOG.map(s => loadSymbolIcon(instance, s.id, s.color))
          )
          if (cancelled) return

          instance.addSource('sitac', {
            type: 'geojson',
            data: EMPTY_FC,
            promoteId: 'id',
          })
          instance.addLayer({
            id: 'sitac-fill',
            type: 'fill',
            source: 'sitac',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': ['coalesce', ['get', 'color'], '#AF2525'],
              'fill-opacity': 0.35,
            },
          })
          instance.addLayer({
            id: 'sitac-line',
            type: 'line',
            source: 'sitac',
            filter: [
              'any',
              ['==', ['geometry-type'], 'LineString'],
              ['==', ['geometry-type'], 'Polygon'],
            ],
            paint: {
              'line-color': ['coalesce', ['get', 'color'], '#AF2525'],
              'line-width': 3,
            },
          })
          instance.addLayer({
            id: 'sitac-point',
            type: 'symbol',
            source: 'sitac',
            filter: ['==', ['geometry-type'], 'Point'],
            layout: {
              'icon-image': [
                'concat',
                'sitac-icon-',
                ['coalesce', ['get', 'symbolId'], 'hotspot'],
              ],
              'icon-size': 1.15,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'text-field': ['coalesce', ['get', 'label'], ''],
              'text-size': 13,
              'text-offset': [0, 2.1],
              'text-anchor': 'top',
              'text-optional': true,
            },
            paint: {
              'text-color': '#fafafa',
              'text-halo-color': '#111111',
              'text-halo-width': 1.2,
            },
          })
          instance.addSource('draft', {
            type: 'geojson',
            data: EMPTY_FC,
          })
          instance.addLayer({
            id: 'draft-line',
            type: 'line',
            source: 'draft',
            paint: {
              'line-color': '#AF2525',
              'line-width': 2,
              'line-dasharray': [2, 2],
            },
          })
          instance.addLayer({
            id: 'draft-point',
            type: 'circle',
            source: 'draft',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
              'circle-radius': 5,
              'circle-color': '#AF2525',
            },
          })
          setMapReady(true)
        })()
      })
    })()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      map?.remove()
      mapRef.current = null
      setMapReady(false)
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [incident.centerLat, incident.centerLng, incident.zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !map.getSource('sitac')) return
    ;(map.getSource('sitac') as GeoJSONSource).setData(toFc(features))
  }, [features, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !map.getSource('draft')) return
    const draftFeatures: GeoJSON.Feature[] = []
    if (drawCoords.length === 1) {
      draftFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: drawCoords[0]! },
      })
    } else if (drawCoords.length > 1) {
      draftFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: drawCoords },
      })
    }
    ;(map.getSource('draft') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: draftFeatures,
    })
  }, [drawCoords, mapReady])

  const pushEvent = useCallback(
    async (op: SitacEvent['op'], payload: SitacEvent['payload']) => {
      setError(null)
      const event = await appendEvent(
        incident.id,
        { op, payload, actorLabel: actorLabel || null },
        passphrase
      )
      setEvents(prev =>
        prev.some(e => e.id === event.id) ? prev : [...prev, event]
      )
      setScrubTs(null)
      return event
    },
    [actorLabel, incident.id, passphrase]
  )

  const commitGeometry = useCallback(
    async (geometry: SitacGeometry) => {
      const featureId = newId()
      const note =
        symbol.geometry === 'text'
          ? (window.prompt(locale === 'it' ? 'Testo nota' : 'Note text') ?? '')
          : undefined
      await pushEvent('upsert_feature', {
        featureId,
        geometry,
        properties: {
          symbolId: symbol.id,
          geometryKind: symbol.geometry,
          color: symbol.color,
          estimated,
          note: note || undefined,
          label: note || undefined,
        },
      })
      setDrawCoords([])
      setDrawMode('idle')
    },
    [estimated, locale, pushEvent, symbol]
  )

  const finishDraw = useCallback(async () => {
    if (symbol.geometry === 'polygon') {
      if (drawCoords.length < 3) return
      const ring = [...drawCoords, drawCoords[0]!]
      await commitGeometry({ type: 'Polygon', coordinates: [ring] })
      return
    }
    if (drawCoords.length < 2) return
    await commitGeometry({ type: 'LineString', coordinates: drawCoords })
  }, [commitGeometry, drawCoords, symbol.geometry])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const onClick = (e: MapMouseEvent) => {
      if (!live) return

      const layers = ['sitac-point', 'sitac-line', 'sitac-fill'].filter(id =>
        map.getLayer(id)
      )
      const hit =
        layers.length > 0 ? map.queryRenderedFeatures(e.point, { layers }) : []

      if (e.originalEvent.shiftKey) {
        if (hit.length > 0) {
          const id = hit[0]?.id
          if (id != null) setSelectedId(String(id))
        } else {
          setSelectedId(null)
        }
        return
      }

      setSelectedId(null)
      const lngLat: LonLat = [e.lngLat.lng, e.lngLat.lat]

      if (symbol.geometry === 'point' || symbol.geometry === 'text') {
        void commitGeometry({ type: 'Point', coordinates: lngLat }).catch(err =>
          setError(String(err))
        )
        return
      }

      setDrawMode('drawing')
      setDrawCoords(prev => [...prev, lngLat])
    }

    const onDblClick = (e: MapMouseEvent) => {
      if (!live || drawMode !== 'drawing') return
      e.preventDefault()
      void finishDraw().catch(err => setError(String(err)))
    }

    map.on('click', onClick)
    map.on('dblclick', onDblClick)

    return () => {
      map.off('click', onClick)
      map.off('dblclick', onDblClick)
    }
  }, [commitGeometry, drawMode, finishDraw, live, mapReady, symbol.geometry])

  const cancelDraw = () => {
    setDrawCoords([])
    setDrawMode('idle')
  }

  const deleteSelected = async () => {
    if (!selectedId || !live) return
    await pushEvent('delete_feature', { featureId: selectedId })
    setSelectedId(null)
  }

  const saveSnapshot = async () => {
    const name = snapshotName.trim()
    if (!name) return
    await pushEvent('named_snapshot', { name })
    setSnapshotName('')
    setStatus(c.snapshotCta)
    window.setTimeout(() => setStatus(null), 2000)
  }

  const exportGeoJson = () => {
    const blob = new Blob(
      [JSON.stringify(featuresToGeoJson(features), null, 2)],
      {
        type: 'application/geo+json',
      }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sitac-${incident.id}.geojson`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportPng = async () => {
    const map = mapRef.current
    if (!map) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('PNG export timed out'))
      }, 8000)
      map.once('render', () => {
        window.clearTimeout(timeout)
        try {
          resolve(map.getCanvas().toDataURL('image/png'))
        } catch (err) {
          reject(err)
        }
      })
      map.triggerRepaint()
    }).catch(err => {
      setError(String(err))
      return null
    })
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `sitac-${incident.id}.png`
    a.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const drawHint =
    symbol.geometry === 'point' || symbol.geometry === 'text'
      ? c.drawHintPoint
      : symbol.geometry === 'polygon'
        ? c.drawHintPolygon
        : c.drawHintLine

  return (
    <div className="flex h-dvh flex-col bg-aib-canvas-inverse text-aib-fg-inverse">
      <header className="flex flex-wrap items-center gap-3 border-b border-aib-border-dark bg-aib-canvas-inverse px-3 py-2.5">
        <a
          href="/"
          className="text-[13px] font-semibold tracking-[-0.2px] text-aib-fg-inverse underline-offset-2 hover:opacity-70"
        >
          {c.brand}
        </a>
        <span className="truncate text-[13px] text-aib-muted-dark">
          {incident.title}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="xs" onClick={() => void copyLink()}>
            {copied ? c.copied : c.shareLink}
          </Button>
          <Button variant="ghost" size="xs" onClick={exportGeoJson}>
            {c.exportGeoJson}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => void exportPng()}>
            {c.exportPng}
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full [&_.maplibregl-map]:h-full [&_.maplibregl-map]:w-full"
        />

        <aside className="absolute top-3 left-3 z-10 max-h-[70vh] w-60 overflow-auto rounded-aib border border-aib-border-dark bg-aib-surface-dark/95 p-2 backdrop-blur">
          <div className="mb-2 text-[13px] font-medium text-aib-muted-dark">
            {c.palette}
          </div>
          <div className="flex flex-col gap-0.5">
            {SYMBOL_CATALOG.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSymbolId(s.id)
                  cancelDraw()
                }}
                className={cn(
                  'flex min-h-9 cursor-pointer items-center gap-2 rounded-aib-sm px-2 text-left text-[13px] font-medium transition-opacity',
                  symbolId === s.id
                    ? 'bg-aib-fg-inverse text-aib-fg'
                    : 'text-aib-track-idle-dark hover:opacity-70'
                )}
              >
                <img
                  src={SYMBOL_ICON_URLS[s.id]}
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px] shrink-0"
                />
                <span className="min-w-0 flex-1 truncate">
                  {locale === 'it' ? s.labelIt : s.labelEn}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[11px] font-medium tracking-wide uppercase opacity-70',
                    symbolId === s.id ? 'text-aib-muted' : 'text-aib-muted-dark'
                  )}
                >
                  {geometryKindLabel(s.geometry, locale)}
                </span>
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px] text-aib-muted-dark">
            <Checkbox
              checked={estimated}
              onCheckedChange={value => setEstimated(value === true)}
              disabled={!live}
            />
            {c.estimated}
          </label>
          <p className="mt-2 text-[12px] leading-snug text-aib-muted-dark">
            {live ? drawHint : c.scrubbingHint}
          </p>
          {drawMode === 'drawing' ? (
            <div className="mt-2 flex gap-1">
              <Button
                size="sm"
                className="flex-1"
                onClick={() =>
                  void finishDraw().catch(err => setError(String(err)))
                }
              >
                {c.finishDraw}
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelDraw}>
                {c.cancelDraw}
              </Button>
            </div>
          ) : null}
          {selectedId && live ? (
            <Button
              variant="destructive"
              size="sm"
              className="mt-2 w-full"
              onClick={() =>
                void deleteSelected().catch(err => setError(String(err)))
              }
            >
              {c.deleteFeature}
            </Button>
          ) : null}
        </aside>
      </div>

      <footer className="border-t border-aib-border-dark bg-aib-canvas-inverse px-3 py-2.5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-aib-muted-dark">
            {c.timeline}
          </span>
          <button
            type="button"
            onClick={() => setScrubTs(null)}
            className={cn(
              'min-h-7 cursor-pointer rounded-md px-2 text-[12px] font-medium transition-opacity',
              live
                ? 'bg-aib-fg-inverse text-aib-fg'
                : 'text-aib-track-idle-dark hover:opacity-70'
            )}
          >
            {c.live}
          </button>
          <Button
            variant="ghost"
            size="xs"
            disabled={markEvents.length === 0 || scrubIndex <= 0}
            aria-label={c.prevStep}
            onClick={() => goToMarkStep(scrubIndex - 1)}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={
              markEvents.length === 0 || scrubIndex >= markEvents.length - 1
            }
            aria-label={c.nextStep}
            onClick={() => goToMarkStep(scrubIndex + 1)}
          >
            →
          </Button>
          {markEvents.length > 0 ? (
            <span className="text-[12px] text-aib-muted-dark">
              {formatStepOf(locale, scrubIndex + 1, markEvents.length)}
            </span>
          ) : null}
          {moments.length > 0 ? (
            <>
              <span className="text-[12px] text-aib-muted-dark">
                {c.labels}
              </span>
              {moments.map(m => (
                <button
                  key={m.eventId}
                  type="button"
                  title={formatTs(m.ts, locale)}
                  onClick={() => setScrubTs(m.ts)}
                  className={cn(
                    'min-h-7 cursor-pointer rounded-md px-2 text-[12px] font-medium transition-opacity',
                    scrubTs === m.ts
                      ? 'bg-aib-fg-inverse text-aib-fg'
                      : 'text-aib-track-idle-dark hover:opacity-70'
                  )}
                >
                  {m.name}
                </button>
              ))}
            </>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <Input
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              placeholder={c.snapshotName}
              disabled={!live}
              className="min-h-7 w-44 rounded-aib-sm px-2 py-1 text-[12px]"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void saveSnapshot().catch(err => setError(String(err)))
                }
              }}
            />
            <Button
              variant="ghost"
              size="xs"
              disabled={!live || !snapshotName.trim()}
              onClick={() =>
                void saveSnapshot().catch(err => setError(String(err)))
              }
            >
              {c.snapshot}
            </Button>
          </div>
        </div>
        <p className="mb-2 text-[12px] leading-snug text-aib-muted-dark">
          {c.timelineHint} {c.snapshotHint}
        </p>
        <Slider
          min={0}
          max={Math.max(markEvents.length - 1, 0)}
          value={[scrubIndex]}
          disabled={markEvents.length === 0}
          onValueChange={values => {
            const list = Array.isArray(values) ? values : [values]
            goToMarkStep(Number(list[0] ?? 0))
          }}
        />
        <div className="mt-1.5 flex justify-between gap-2 text-[12px] text-aib-muted-dark">
          <span>
            {markEvents.length === 0
              ? c.noEvents
              : formatTs(
                  markEvents[scrubIndex]?.ts ?? incident.createdAt,
                  locale
                )}
          </span>
          {status ? <span>{status}</span> : null}
          {error ? (
            <span className="text-aib-brand">
              {c.error}: {error}
            </span>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
