'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapMouseEvent,
} from 'maplibre-gl'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Download,
  Info,
  Link2,
  Lock,
  MousePointer2,
  Settings,
  User,
} from 'lucide-react'
import {
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
import { AboutDialog } from '@/components/AboutDialog'
import { ActorDialog } from '@/components/ActorDialog'
import { DeleteMarkDialog } from '@/components/DeleteMarkDialog'
import { ExportDialog } from '@/components/ExportDialog'
import { MarkInfoDialog } from '@/components/MarkInfoDialog'
import { RoomSettingsDialog } from '@/components/RoomSettingsDialog'
import { TextMarkDialog } from '@/components/TextMarkDialog'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
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
import { MarkIcon, markIconSize } from '@/components/MarkIcon'
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

const ANNOTATION_SYMBOLS = SYMBOL_CATALOG.filter(s => isAnnotationSymbol(s.id))
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
  const [aboutOpen, setAboutOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [markInfoOpen, setMarkInfoOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [profileActor, setProfileActor] = useState('')
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
    setProfileActor(readActor())
  }, [])

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
    if (!selectedId || !live || deleteBusy) return
    setDeleteBusy(true)
    try {
      const event = await pushEvent('delete_feature', { featureId: selectedId })
      if (!event) return
      setSelectedId(null)
      setDeleteConfirmOpen(false)
    } finally {
      setDeleteBusy(false)
    }
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
    setExportOpen(false)
  }

  const exportPng = async () => {
    const map = mapRef.current
    if (!map || exportBusy) return
    setExportBusy(true)
    try {
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
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `sitac-${incident.id}.png`
      a.click()
      setExportOpen(false)
    } catch (err) {
      setError(String(err))
    } finally {
      setExportBusy(false)
    }
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
  const drawing = drawMode === 'drawing' && !selectMode

  const markInfo = useMemo((): {
    iconSrc?: string
    icon?: React.ReactNode
    title: string
    kindLabel?: string
    purpose: string
    howTo: string
  } | null => {
    if (symbol) {
      return {
        iconSrc: SYMBOL_ICON_URLS[symbol.id],
        title: symbol.label,
        kindLabel: geometryKindLabel(symbol.geometry),
        purpose: c.symbolPurpose[symbol.id],
        howTo: drawHintForGeometry(symbol.geometry),
      }
    }
    if (selectMode && selectedSymbol && selectedFeature) {
      const label =
        selectedFeature.properties.label?.trim() || selectedSymbol.label
      return {
        iconSrc: SYMBOL_ICON_URLS[selectedSymbol.id],
        title: label,
        kindLabel: geometryKindLabel(selectedFeature.properties.geometryKind),
        purpose: c.symbolPurpose[selectedSymbol.id],
        howTo: c.selectedMarkHow,
      }
    }
    if (selectMode) {
      return {
        icon: <MousePointer2 className="size-5" aria-hidden />,
        title: c.selectTool,
        purpose: c.selectToolPurpose,
        howTo: c.selectToolHow,
      }
    }
    return null
  }, [
    c.selectTool,
    c.selectToolHow,
    c.selectToolPurpose,
    c.selectedMarkHow,
    c.symbolPurpose,
    selectMode,
    selectedFeature,
    selectedSymbol,
    symbol,
  ])

  useEffect(() => {
    setMarkInfoOpen(false)
    setDeleteConfirmOpen(false)
  }, [tool, selectedId, drawMode])

  const showMarkControls =
    markInfo != null || drawing || (selectMode && selectedId != null)

  return (
    <div className="flex min-h-0 flex-1 gap-3 bg-aib-canvas-inverse p-3 text-aib-fg-inverse">
      <aside
        className="flex w-64 shrink-0 flex-col overflow-hidden rounded-aib bg-aib-surface-dark shadow-lg sm:w-72"
        aria-label={c.roomInfo}
      >
        <div className="shrink-0 border-b border-aib-border-dark p-3">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline transition-opacity hover:opacity-70"
            aria-label={c.homeAria}
          >
            <Image
              src="/aib-assets/logo.png"
              alt=""
              width={350}
              height={180}
              className="h-4.5 w-auto sm:h-5"
              priority
            />
            <span className="text-[18px] font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[20px]">
              SITAC
            </span>
          </Link>
        </div>

        <section
          className="shrink-0 space-y-2 border-b border-aib-border-dark p-3"
          aria-label={c.roomInfo}
        >
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-aib-fg-inverse">
              {incident.title}
            </h2>
            {incident.hasPassphrase ? (
              <Lock
                className="size-3.5 shrink-0 text-aib-muted-dark"
                aria-label={c.roomPassProtected}
              />
            ) : null}
          </div>
          {error ? (
            <p className="text-[13px] text-aib-brand">
              {c.error}: {error}
            </p>
          ) : null}
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div
            className="flex flex-col overflow-hidden rounded-aib-sm bg-aib-canvas-inverse"
            aria-label={c.palette}
          >
            <div className="flex flex-col gap-0.5 p-1.5">
              <button
                type="button"
                aria-pressed={selectMode}
                onClick={selectSelectTool}
                className={cn(
                  'aib-tool-btn w-full',
                  selectMode ? 'aib-tool-btn-active' : 'aib-tool-btn-idle'
                )}
              >
                <MousePointer2 className="size-[26px] shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{c.selectTool}</span>
              </button>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-aib-border-dark p-1.5">
              {ANNOTATION_SYMBOLS.map(s => (
                <SymbolToolButton
                  key={s.id}
                  symbol={s}
                  active={tool === s.id}
                  onSelect={selectSymbolTool}
                />
              ))}
            </div>
            <div className="flex flex-col gap-0.5 border-t border-aib-border-dark p-1.5">
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
        </div>

        <div className="flex shrink-0 flex-col">
          <div className="flex flex-col gap-0.5 border-t border-aib-border-dark p-3">
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
              onClick={() => setExportOpen(true)}
            >
              <Download className="size-4 shrink-0" aria-hidden />
              {c.exportOpen}
            </Button>
            <Button
              variant="quiet"
              size="sm"
              className="w-full gap-2.5"
              onClick={() => setAboutOpen(true)}
            >
              <CircleHelp className="size-4 shrink-0" aria-hidden />
              {c.aboutOpen}
            </Button>
          </div>
          <div className="border-t border-aib-border-dark p-3">
            <Button
              variant="quiet"
              size="sm"
              className="w-full gap-2.5"
              aria-label={c.actorDialogOpen}
              onClick={() => setActorOpen(true)}
            >
              <User className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">
                {profileActor.trim() || c.actorDialogOpen}
              </span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div className="relative h-full min-h-0 w-full overflow-hidden rounded-aib border border-aib-border-dark bg-aib-canvas-inverse shadow-lg">
          <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full [&_.maplibregl-map]:h-full [&_.maplibregl-map]:w-full"
          />
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <div
              className="pointer-events-auto flex w-full max-w-xl min-w-0 items-center gap-2 overflow-hidden rounded-aib border border-aib-border-dark bg-aib-surface-dark px-2.5 py-1.5 shadow-lg"
              role="region"
              aria-label={c.timeline}
            >
              <button
                type="button"
                disabled={markEvents.length === 0 || scrubIndex <= 0}
                aria-label={c.firstStep}
                onClick={() => goToMarkStep(0)}
                className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
              >
                <ChevronsLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={markEvents.length === 0 || scrubIndex <= 0}
                aria-label={c.prevStep}
                onClick={() => goToMarkStep(scrubIndex - 1)}
                className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <Slider
                className="w-48 shrink-0"
                min={0}
                max={Math.max(markEvents.length - 1, 1)}
                value={[scrubIndex]}
                disabled={markEvents.length <= 1}
                onValueChange={values => {
                  const list = Array.isArray(values) ? values : [values]
                  goToMarkStep(Number(list[0] ?? 0))
                }}
              />
              <button
                type="button"
                disabled={
                  markEvents.length === 0 || scrubIndex >= markEvents.length - 1
                }
                aria-label={c.nextStep}
                onClick={() => goToMarkStep(scrubIndex + 1)}
                className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={
                  markEvents.length === 0 || scrubIndex >= markEvents.length - 1
                }
                aria-label={c.lastStep}
                onClick={() => goToMarkStep(markEvents.length - 1)}
                className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
              >
                <ChevronsRight className="size-4" aria-hidden />
              </button>
              <p className="w-10 shrink-0 text-right text-[12px] text-aib-muted-dark tabular-nums">
                {formatStepOf(
                  markEvents.length === 0 ? 0 : scrubIndex + 1,
                  markEvents.length
                )}
              </p>
              <div
                className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden border-l border-aib-border-dark pl-2.5"
                role="status"
              >
                {currentMarkSummary ? (
                  <>
                    {currentMarkSummary.symbolId ? (
                      <MarkIcon
                        src={SYMBOL_ICON_URLS[currentMarkSummary.symbolId]}
                        size={markIconSize.timeline}
                      />
                    ) : (
                      <span
                        className="shrink-0 rounded-aib-sm bg-aib-border-dark"
                        style={{
                          width: markIconSize.timeline,
                          height: markIconSize.timeline,
                        }}
                      />
                    )}
                    <TimelineMarkText
                      label={currentMarkSummary.label}
                      meta={`${
                        currentMarkSummary.action === 'add'
                          ? c.timelineAdded
                          : c.timelineRemoved
                      }${
                        currentMarkSummary.actorLabel
                          ? ` · ${currentMarkSummary.actorLabel}`
                          : ''
                      } · ${formatTs(currentMarkSummary.ts)}`}
                    />
                  </>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[12px] text-aib-muted-dark">
                    {c.noEvents}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showMarkControls ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
              <div
                className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-aib border border-aib-border-dark bg-aib-surface-dark px-2.5 py-1.5 shadow-lg"
                role="region"
                aria-label={c.markControls}
              >
                {markInfo ? (
                  <div className="flex min-w-0 items-center gap-2 px-1">
                    {markInfo.iconSrc ? (
                      <MarkIcon
                        src={markInfo.iconSrc}
                        size={markIconSize.control}
                      />
                    ) : markInfo.icon ? (
                      <span
                        className="flex shrink-0 items-center justify-center text-aib-fg-inverse [&_svg]:size-[18px]"
                        style={{
                          width: markIconSize.control,
                          height: markIconSize.control,
                        }}
                      >
                        {markInfo.icon}
                      </span>
                    ) : null}
                    <span className="max-w-[9rem] truncate text-[13px] font-semibold text-aib-fg-inverse sm:max-w-[12rem]">
                      {markInfo.title}
                    </span>
                    <IconButton
                      aria-label={c.markInfoOpen}
                      aria-expanded={markInfoOpen}
                      onClick={() => setMarkInfoOpen(true)}
                      className="size-8 [&_svg]:size-4"
                    >
                      <Info />
                    </IconButton>
                  </div>
                ) : null}
                {drawing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        void finishDraw().catch(err => setError(String(err)))
                      }
                    >
                      {c.finishDraw}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelDraw}>
                      {c.cancelDraw}
                    </Button>
                  </>
                ) : null}
                {selectMode && selectedId ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!live}
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    {c.deleteFeature}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <MarkInfoDialog
          open={markInfoOpen && markInfo != null}
          title={markInfo?.title ?? ''}
          kindLabel={markInfo?.kindLabel}
          iconSrc={markInfo?.iconSrc}
          icon={markInfo?.icon}
          purpose={markInfo?.purpose ?? ''}
          howTo={markInfo?.howTo ?? ''}
          onClose={() => setMarkInfoOpen(false)}
        />
        <DeleteMarkDialog
          open={deleteConfirmOpen && selectedId != null}
          markLabel={
            selectMode && selectedSymbol && selectedFeature
              ? selectedFeature.properties.label?.trim() || selectedSymbol.label
              : undefined
          }
          busy={deleteBusy}
          onCancel={() => {
            if (!deleteBusy) setDeleteConfirmOpen(false)
          }}
          onConfirm={() =>
            void deleteSelected().catch(err => setError(String(err)))
          }
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
            const name = readActor().trim()
            setProfileActor(name)
            settleActorWaiters(name || null)
          }}
          onChange={name => {
            const trimmed = name.trim()
            setProfileActor(trimmed)
            if (trimmed) {
              setActorOpen(false)
              settleActorWaiters(trimmed)
            }
          }}
        />
        <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        <ExportDialog
          open={exportOpen}
          busy={exportBusy}
          onClose={() => {
            if (!exportBusy) setExportOpen(false)
          }}
          onExportGeoJson={exportGeoJson}
          onExportPng={() => void exportPng()}
        />
      </div>
    </div>
  )
}

function TimelineMarkText({ label, meta }: { label: string; meta: string }) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const metaRef = useRef<HTMLSpanElement>(null)
  const [tip, setTip] = useState<string | undefined>()
  const full = `${label} · ${meta}`

  useEffect(() => {
    const labelEl = labelRef.current
    const metaEl = metaRef.current
    if (!labelEl || !metaEl) return

    const update = () => {
      const cut =
        labelEl.scrollWidth > labelEl.clientWidth + 0.5 ||
        metaEl.scrollWidth > metaEl.clientWidth + 0.5
      setTip(cut ? full : undefined)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(labelEl)
    observer.observe(metaEl)
    return () => observer.disconnect()
  }, [full])

  return (
    <span className="min-w-0 flex-1 overflow-hidden leading-tight" title={tip}>
      <span
        ref={labelRef}
        className="block truncate text-[12px] font-semibold text-aib-fg-inverse"
      >
        {label}
      </span>
      <span
        ref={metaRef}
        className="block truncate text-[11px] text-aib-muted-dark"
      >
        {meta}
      </span>
    </span>
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
      <MarkIcon src={SYMBOL_ICON_URLS[symbol.id]} size={markIconSize.sidebar} />
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
