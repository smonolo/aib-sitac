'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapMouseEvent,
} from 'maplibre-gl'
import {
  Braces,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Link2,
  MousePointer2,
  Settings,
} from 'lucide-react'
import {
  ANNOTATION_SYMBOL_IDS,
  SYMBOL_CATALOG,
  featuresToGeoJson,
  foldFeatures,
  getSymbol,
  isAnnotationSymbol,
  listMarkEvents,
  summarizeMarkEvents,
  type LonLat,
  type SitacEvent,
  type SitacGeometry,
  type SitacIncident,
  type SymbolId,
} from '@aib-sitac/core'
import { ActorDialog } from '@/components/ActorDialog'
import { RoomSettingsDialog } from '@/components/RoomSettingsDialog'
import { TextMarkDialog } from '@/components/TextMarkDialog'
import { ToolTipCard } from '@/components/ToolTipCard'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { appendEvent, eventsStreamUrl, listEvents } from '@/lib/api'
import {
  drawHintForGeometry,
  formatStepOf,
  geometryKindLabel,
  t,
} from '@/lib/i18n'
import { BASEMAP_STYLE } from '@/lib/map-basemap'
import {
  draftToDisplayGeoJson,
  featuresToDisplayGeoJson,
} from '@/lib/map-display'
import { symbolIconDataUrl } from '@/lib/map-icons'
import { addSitacSourcesAndLayers, PICK_LAYERS } from '@/lib/map-layers'
import { formatTs, readActor } from '@/lib/storage'
import {
  markScrubIndex,
  readTimelineStepParam,
  roomUrlWithTimelineStep,
  writeTimelineStepParam,
} from '@/lib/timeline-url'
import { cn } from '@/lib/utils'

type ActiveTool = 'select' | SymbolId
type DrawMode = 'idle' | 'drawing'
type PendingText = { coordinates: LonLat }

const SYMBOL_ICON_URLS = Object.fromEntries(
  SYMBOL_CATALOG.map(s => [s.id, symbolIconDataUrl(s.id, s.color)])
) as Record<SymbolId, string>

const ANNOTATION_SYMBOLS = SYMBOL_CATALOG.filter(s =>
  (ANNOTATION_SYMBOL_IDS as readonly string[]).includes(s.id)
)
const TACTICAL_SYMBOLS = SYMBOL_CATALOG.filter(s => !isAnnotationSymbol(s.id))

type Props = {
  incident: SitacIncident
  passphrase: string | null
  onIncidentChange?: (incident: SitacIncident) => void
  onPassphraseChange?: (passphrase: string | null) => void
}

export function SitacMap({
  incident,
  passphrase,
  onIncidentChange,
  onPassphraseChange,
}: Props) {
  const c = t()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const initialViewRef = useRef({
    lng: incident.centerLng,
    lat: incident.centerLat,
    zoom: Math.min(incident.zoom, 19),
  })
  const [events, setEvents] = useState<SitacEvent[]>([])
  const [scrubTs, setScrubTs] = useState<string | null>(null)
  const [tool, setTool] = useState<ActiveTool>('select')
  const [drawCoords, setDrawCoords] = useState<LonLat[]>([])
  const [drawMode, setDrawMode] = useState<DrawMode>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [pendingText, setPendingText] = useState<PendingText | null>(null)
  const [textDraft, setTextDraft] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [actorOpen, setActorOpen] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const actorWaitersRef = useRef<Array<(name: string | null) => void>>([])
  const urlStepAppliedRef = useRef(false)

  const selectMode = tool === 'select'
  const symbol = selectMode ? null : (getSymbol(tool) ?? null)
  const live = scrubTs === null
  const features = useMemo(
    () => foldFeatures(events, scrubTs),
    [events, scrubTs]
  )
  const displayGeoJson = useMemo(
    () => featuresToDisplayGeoJson(features),
    [features]
  )
  const markEvents = useMemo(() => listMarkEvents(events), [events])
  const markSummaries = useMemo(
    () => summarizeMarkEvents(markEvents, c.timelineUnknownMark),
    [markEvents, c.timelineUnknownMark]
  )
  const scrubIndex = useMemo(
    () => markScrubIndex(markEvents, scrubTs),
    [markEvents, scrubTs]
  )

  const goToMarkStep = useCallback(
    (idx: number) => {
      if (markEvents.length === 0) {
        setScrubTs(null)
        writeTimelineStepParam(null)
        return
      }
      const clamped = Math.max(0, Math.min(idx, markEvents.length - 1))
      if (clamped >= markEvents.length - 1) {
        setScrubTs(null)
        writeTimelineStepParam(null)
        return
      }
      setScrubTs(markEvents[clamped]!.ts)
      writeTimelineStepParam(clamped + 1)
    },
    [markEvents]
  )

  const refresh = useCallback(async () => {
    const list = await listEvents(incident.id, passphrase)
    setEvents(list)
    setEventsReady(true)
  }, [incident.id, passphrase])

  useEffect(() => {
    setEventsReady(false)
    urlStepAppliedRef.current = false
    setScrubTs(null)
    refresh().catch(err => setError(String(err)))
  }, [refresh])

  useEffect(() => {
    if (!eventsReady || urlStepAppliedRef.current) return
    urlStepAppliedRef.current = true
    const step = readTimelineStepParam()
    if (step == null || markEvents.length === 0) return
    goToMarkStep(step - 1)
  }, [eventsReady, goToMarkStep, markEvents.length])

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
    const view = initialViewRef.current

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
        center: [view.lng, view.lat],
        zoom: view.zoom,
        maxZoom: 22,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      })
      map = instance
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        'top-left'
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
          await addSitacSourcesAndLayers(instance)
          if (cancelled) return
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
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    map.jumpTo({
      center: [incident.centerLng, incident.centerLat],
      zoom: Math.min(incident.zoom, 19),
    })
  }, [incident.centerLat, incident.centerLng, incident.zoom, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !map.getSource('sitac')) return
    ;(map.getSource('sitac') as GeoJSONSource).setData(displayGeoJson)
  }, [displayGeoJson, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !map.getSource('draft')) return
    const kind =
      symbol?.geometry === 'arrow' ||
      symbol?.geometry === 'line' ||
      symbol?.geometry === 'polygon'
        ? symbol.geometry
        : null
    ;(map.getSource('draft') as GeoJSONSource).setData(
      draftToDisplayGeoJson(drawCoords, kind, symbol?.color)
    )
  }, [drawCoords, mapReady, symbol])

  const resolveActorLabel = useCallback(async (): Promise<string | null> => {
    const existing = readActor().trim()
    if (existing) return existing
    setActorOpen(true)
    return await new Promise<string | null>(resolve => {
      actorWaitersRef.current.push(resolve)
    })
  }, [])

  const settleActorWaiters = useCallback((name: string | null) => {
    const waiters = actorWaitersRef.current
    actorWaitersRef.current = []
    for (const resolve of waiters) resolve(name)
  }, [])

  const pushEvent = useCallback(
    async (op: SitacEvent['op'], payload: SitacEvent['payload']) => {
      setError(null)
      const actor = await resolveActorLabel()
      if (!actor) {
        setError(c.actorRequired)
        return null
      }
      const event = await appendEvent(
        incident.id,
        { op, payload, actorLabel: actor },
        passphrase
      )
      setEvents(prev =>
        prev.some(e => e.id === event.id) ? prev : [...prev, event]
      )
      setScrubTs(null)
      writeTimelineStepParam(null)
      return event
    },
    [c.actorRequired, incident.id, passphrase, resolveActorLabel]
  )

  const commitGeometry = useCallback(
    async (geometry: SitacGeometry, text?: string) => {
      if (!symbol) return
      const featureId = crypto.randomUUID()
      const trimmed = text?.trim()
      const event = await pushEvent('upsert_feature', {
        featureId,
        geometry,
        properties: {
          symbolId: symbol.id,
          geometryKind: symbol.geometry,
          color: symbol.color,
          note: trimmed || undefined,
          label: trimmed || undefined,
        },
      })
      if (!event) return
      setDrawCoords([])
      setDrawMode('idle')
    },
    [pushEvent, symbol]
  )

  const finishDraw = useCallback(async () => {
    if (!symbol) return
    if (symbol.geometry === 'polygon') {
      if (drawCoords.length < 3) return
      const ring = [...drawCoords, drawCoords[0]!]
      await commitGeometry({ type: 'Polygon', coordinates: [ring] })
      return
    }
    if (drawCoords.length < 2) return
    await commitGeometry({ type: 'LineString', coordinates: drawCoords })
  }, [commitGeometry, drawCoords, symbol])

  const cancelDraw = useCallback(() => {
    setDrawCoords([])
    setDrawMode('idle')
    setPendingText(null)
    setTextDraft('')
  }, [])

  const selectSelectTool = () => {
    setTool('select')
    cancelDraw()
  }

  const selectSymbolTool = (id: SymbolId) => {
    setTool(id)
    setSelectedId(null)
    cancelDraw()
  }

  const confirmTextMark = () => {
    if (!pendingText || !textDraft.trim()) return
    const coords = pendingText.coordinates
    setPendingText(null)
    const label = textDraft.trim()
    setTextDraft('')
    void commitGeometry({ type: 'Point', coordinates: coords }, label).catch(
      err => setError(String(err))
    )
  }

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const featureIdAt = (point: { x: number; y: number }): string | null => {
      const layers = PICK_LAYERS.filter(id => map.getLayer(id))
      if (layers.length === 0) return null
      const pad = 10
      const hits = map.queryRenderedFeatures(
        [
          [point.x - pad, point.y - pad],
          [point.x + pad, point.y + pad],
        ],
        { layers: [...layers] }
      )
      const hit = hits[0]
      if (!hit) return null
      const fromProps = hit.properties?.id
      if (fromProps != null && fromProps !== '') return String(fromProps)
      const fromId = hit.id
      if (fromId != null && fromId !== '') return String(fromId)
      return null
    }

    const onClick = (e: MapMouseEvent) => {
      if (!live || pendingText) return

      if (selectMode || !symbol) {
        setSelectedId(featureIdAt(e.point))
        return
      }

      setSelectedId(null)
      const lngLat: LonLat = [e.lngLat.lng, e.lngLat.lat]

      if (symbol.geometry === 'text') {
        setTextDraft('')
        setPendingText({ coordinates: lngLat })
        return
      }

      if (symbol.geometry === 'point') {
        void commitGeometry({ type: 'Point', coordinates: lngLat }).catch(err =>
          setError(String(err))
        )
        return
      }

      setDrawMode('drawing')
      setDrawCoords(prev => [...prev, lngLat])
    }

    const onDblClick = (e: MapMouseEvent) => {
      if (!live || selectMode || drawMode !== 'drawing' || pendingText) return
      e.preventDefault()
      void finishDraw().catch(err => setError(String(err)))
    }

    map.on('click', onClick)
    map.on('dblclick', onDblClick)

    return () => {
      map.off('click', onClick)
      map.off('dblclick', onDblClick)
    }
  }, [
    commitGeometry,
    drawMode,
    finishDraw,
    live,
    mapReady,
    pendingText,
    selectMode,
    symbol,
  ])

  const deleteSelected = async () => {
    if (!selectedId || !live) return
    const event = await pushEvent('delete_feature', { featureId: selectedId })
    if (!event) return
    setSelectedId(null)
  }

  const exportGeoJson = () => {
    const blob = new Blob(
      [JSON.stringify(featuresToGeoJson(features), null, 2)],
      { type: 'application/geo+json' }
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
    const step = live || markEvents.length === 0 ? null : scrubIndex + 1
    const url = roomUrlWithTimelineStep(window.location.href, step)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const selectedFeature = useMemo(
    () => (selectedId ? features.find(f => f.id === selectedId) : null),
    [features, selectedId]
  )
  const selectedSymbol = selectedFeature
    ? (getSymbol(selectedFeature.properties.symbolId) ?? null)
    : null

  const currentMarkSummary = markSummaries[scrubIndex] ?? null

  const activeTip = useMemo((): {
    iconSrc?: string
    icon?: React.ReactNode
    title: string
    kindLabel?: string
    body: string
  } | null => {
    if (symbol) {
      return {
        iconSrc: SYMBOL_ICON_URLS[symbol.id],
        title: symbol.label,
        kindLabel: geometryKindLabel(symbol.geometry),
        body: `${c.symbolHelp[symbol.id]} ${drawHintForGeometry(symbol.geometry)}`,
      }
    }
    if (selectMode && selectedSymbol && selectedFeature) {
      const label =
        selectedFeature.properties.label?.trim() || selectedSymbol.label
      return {
        iconSrc: SYMBOL_ICON_URLS[selectedSymbol.id],
        title: label,
        kindLabel: geometryKindLabel(selectedFeature.properties.geometryKind),
        body: c.selectedMarkHint,
      }
    }
    if (selectMode) {
      return {
        icon: <MousePointer2 className="size-5" aria-hidden />,
        title: c.selectTool,
        body: c.selectToolHint,
      }
    }
    return null
  }, [
    c.selectTool,
    c.selectToolHint,
    c.selectedMarkHint,
    c.symbolHelp,
    selectMode,
    selectedFeature,
    selectedSymbol,
    symbol,
  ])

  return (
    <div className="flex min-h-0 flex-1 bg-aib-canvas-inverse text-aib-fg-inverse">
      <aside
        className="flex w-56 shrink-0 flex-col border-r border-aib-border-dark bg-aib-surface-dark sm:w-64"
        aria-label={c.palette}
      >
        <div className="shrink-0 p-2.5">
          <button
            type="button"
            aria-pressed={selectMode}
            onClick={selectSelectTool}
            className={cn(
              'aib-tool-btn w-full',
              selectMode ? 'aib-tool-btn-active' : 'aib-tool-btn-idle'
            )}
          >
            <MousePointer2 className="size-[22px] shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{c.selectTool}</span>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col border-t border-aib-border-dark">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-0.5 p-2.5">
              {ANNOTATION_SYMBOLS.map(s => (
                <SymbolToolButton
                  key={s.id}
                  symbol={s}
                  active={tool === s.id}
                  onSelect={selectSymbolTool}
                />
              ))}
            </div>
            <div className="flex flex-col gap-0.5 border-t border-aib-border-dark p-2.5">
              {TACTICAL_SYMBOLS.map(s => (
                <SymbolToolButton
                  key={s.id}
                  symbol={s}
                  active={tool === s.id}
                  onSelect={selectSymbolTool}
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 border-t border-aib-border-dark p-2.5">
            {activeTip ? (
              <ToolTipCard
                iconSrc={activeTip.iconSrc}
                icon={activeTip.icon}
                title={activeTip.title}
                kindLabel={activeTip.kindLabel}
                body={activeTip.body}
              />
            ) : null}
            {drawMode === 'drawing' && !selectMode ? (
              <div className="flex gap-1.5">
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
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={!selectedId || !live || !selectMode}
              onClick={() =>
                void deleteSelected().catch(err => setError(String(err)))
              }
            >
              {c.deleteFeature}
            </Button>
          </div>
        </div>
      </aside>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full [&_.maplibregl-map]:h-full [&_.maplibregl-map]:w-full"
        />
        <TextMarkDialog
          open={pendingText != null}
          value={textDraft}
          onChange={setTextDraft}
          onConfirm={confirmTextMark}
          onCancel={cancelDraw}
        />
        <RoomSettingsDialog
          open={settingsOpen}
          incident={incident}
          passphrase={passphrase}
          onClose={() => setSettingsOpen(false)}
          onIncidentChange={onIncidentChange}
          onPassphraseChange={onPassphraseChange}
        />
        <ActorDialog
          open={actorOpen}
          onClose={() => {
            setActorOpen(false)
            settleActorWaiters(readActor().trim() || null)
          }}
          onChange={name => {
            const trimmed = name.trim()
            if (trimmed) {
              setActorOpen(false)
              settleActorWaiters(trimmed)
            }
          }}
        />
      </div>

      <aside className="flex w-72 shrink-0 flex-col border-l border-aib-border-dark bg-aib-surface-dark sm:w-80">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[13px] font-medium text-aib-muted-dark">
              {c.timeline}
            </p>
            <p className="shrink-0 text-[13px] text-aib-muted-dark tabular-nums">
              {formatStepOf(
                markEvents.length === 0 ? 0 : scrubIndex + 1,
                markEvents.length
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Slider
              min={0}
              max={Math.max(markEvents.length - 1, 1)}
              value={[scrubIndex]}
              disabled={markEvents.length <= 1}
              onValueChange={values => {
                const list = Array.isArray(values) ? values : [values]
                goToMarkStep(Number(list[0] ?? 0))
              }}
            />
            <p className="text-[13px] leading-snug text-aib-muted-dark">
              {markEvents.length === 0
                ? c.noEvents
                : formatTs(markEvents[scrubIndex]?.ts ?? incident.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={markEvents.length === 0 || scrubIndex <= 0}
              aria-label={c.prevStep}
              onClick={() => goToMarkStep(scrubIndex - 1)}
              className="aib-quiet-btn flex flex-1 items-center justify-center"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goToMarkStep(markEvents.length - 1)}
              className={cn(
                'aib-quiet-btn flex-[2]',
                live && 'aib-tool-btn-active hover:opacity-100'
              )}
            >
              {c.live}
            </button>
            <button
              type="button"
              disabled={
                markEvents.length === 0 || scrubIndex >= markEvents.length - 1
              }
              aria-label={c.nextStep}
              onClick={() => goToMarkStep(scrubIndex + 1)}
              className="aib-quiet-btn flex flex-1 items-center justify-center"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          {currentMarkSummary ? (
            <div
              className="flex w-full items-center gap-2.5 rounded-aib-sm bg-aib-surface-muted-dark px-2.5 py-2"
              role="status"
            >
              {currentMarkSummary.symbolId ? (
                <img
                  src={SYMBOL_ICON_URLS[currentMarkSummary.symbolId]}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
              ) : (
                <span className="size-7 shrink-0 rounded-aib-sm bg-aib-border-dark" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-aib-fg-inverse">
                  {currentMarkSummary.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-aib-muted-dark">
                  {currentMarkSummary.action === 'add'
                    ? c.timelineAdded
                    : c.timelineRemoved}
                  {currentMarkSummary.actorLabel
                    ? ` · ${currentMarkSummary.actorLabel}`
                    : ''}
                  {' · '}
                  {formatTs(currentMarkSummary.ts)}
                </span>
              </span>
            </div>
          ) : null}

          {error ? (
            <p className="text-[13px] text-aib-brand">
              {c.error}: {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-0.5 border-t border-aib-border-dark p-2.5">
          <Button
            variant="quiet"
            size="sm"
            className="w-full gap-2.5"
            disabled={!live}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4 shrink-0" aria-hidden />
            {c.roomSettingsOpen}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            className="w-full gap-2.5"
            onClick={() => void copyLink()}
          >
            <Link2 className="size-4 shrink-0" aria-hidden />
            {copied ? c.copied : c.shareLink}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            className="w-full gap-2.5"
            onClick={exportGeoJson}
          >
            <Braces className="size-4 shrink-0" aria-hidden />
            {c.exportGeoJson}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            className="w-full gap-2.5"
            onClick={() => void exportPng()}
          >
            <ImageIcon className="size-4 shrink-0" aria-hidden />
            {c.exportPng}
          </Button>
        </div>
      </aside>
    </div>
  )
}

function SymbolToolButton({
  symbol,
  active,
  onSelect,
}: {
  symbol: (typeof SYMBOL_CATALOG)[number]
  active: boolean
  onSelect: (id: SymbolId) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(symbol.id)}
      className={cn(
        'aib-tool-btn',
        active ? 'aib-tool-btn-active' : 'aib-tool-btn-idle'
      )}
    >
      <img
        src={SYMBOL_ICON_URLS[symbol.id]}
        alt=""
        width={22}
        height={22}
        className="size-[22px] shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{symbol.label}</span>
      <span
        className={cn(
          'shrink-0 text-[11px] font-medium tracking-wide uppercase opacity-70',
          active ? 'text-aib-muted' : 'text-aib-muted-dark'
        )}
      >
        {geometryKindLabel(symbol.geometry)}
      </span>
    </button>
  )
}
