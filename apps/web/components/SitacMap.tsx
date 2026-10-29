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
  Menu,
  MousePointer2,
  Settings,
  User,
  X,
} from 'lucide-react'
import {
  SYMBOL_CATALOG,
  featuresToGeoJson,
  foldFeatures,
  getSymbol,
  isAnnotationSymbol,
  listMarkEvents,
  summarizeMarkEvents,
  translateGeometry,
  type LonLat,
  type SitacEvent,
  type SitacFeature,
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
import { ThemeToggle } from '@/components/ThemeToggle'
import { UnlockPassphraseDialog } from '@/components/UnlockPassphraseDialog'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Slider } from '@/components/ui/slider'
import {
  appendEvent,
  eventsStreamUrl,
  isPassphraseError,
  listEvents,
} from '@/lib/api'
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

const ANNOTATION_SYMBOLS = SYMBOL_CATALOG.filter(s => isAnnotationSymbol(s.id))
const TACTICAL_SYMBOLS = SYMBOL_CATALOG.filter(s => !isAnnotationSymbol(s.id))

type Props = {
  incident: SitacIncident
  passphrase: string | null
  locked?: boolean
  unlockBusy?: boolean
  unlockError?: string | null
  onUnlock?: (passphrase: string) => void
  onIncidentChange?: (incident: SitacIncident) => void
  onPassphraseChange?: (passphrase: string | null) => void
  onAccessDenied?: () => void
}

export function SitacMap({
  incident,
  passphrase,
  locked = false,
  unlockBusy = false,
  unlockError = null,
  onUnlock,
  onIncidentChange,
  onPassphraseChange,
  onAccessDenied,
}: Props) {
  const c = t()
  const onAccessDeniedRef = useRef(onAccessDenied)
  onAccessDeniedRef.current = onAccessDenied
  const lockedRef = useRef(locked)
  lockedRef.current = locked
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
  const [moveMode, setMoveMode] = useState(false)
  const [moveDelta, setMoveDelta] = useState<LonLat | null>(null)
  const [moveBusy, setMoveBusy] = useState(false)
  const [moveOverride, setMoveOverride] = useState<{
    featureId: string
    geometry: SitacGeometry
  } | null>(null)
  const [eventsReady, setEventsReady] = useState(false)
  const [profileActor, setProfileActor] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const actorWaitersRef = useRef<Array<(name: string | null) => void>>([])
  const urlStepAppliedRef = useRef(false)
  const moveOriginRef = useRef<LonLat | null>(null)
  const moveDragBaseRef = useRef<LonLat>([0, 0])
  const moveDeltaRef = useRef<LonLat | null>(null)
  const moveDraggingRef = useRef(false)
  const moveBusyRef = useRef(false)
  const selectedFeatureRef = useRef<SitacFeature | null>(null)

  const selectMode = tool === 'select'
  const symbol = selectMode ? null : (getSymbol(tool) ?? null)
  const live = scrubTs === null
  const features = useMemo(
    () => foldFeatures(events, scrubTs),
    [events, scrubTs]
  )
  moveDeltaRef.current = moveDelta
  const displayFeatures = useMemo(() => {
    let next = features
    if (moveOverride) {
      next = next.map(feature =>
        feature.id === moveOverride.featureId
          ? { ...feature, geometry: moveOverride.geometry }
          : feature
      )
    }
    if (moveMode && selectedId && moveDelta) {
      const [dLng, dLat] = moveDelta
      if (dLng !== 0 || dLat !== 0) {
        next = next.map(feature =>
          feature.id === selectedId
            ? {
                ...feature,
                geometry: translateGeometry(feature.geometry, dLng, dLat),
              }
            : feature
        )
      }
    }
    return next
  }, [features, moveDelta, moveMode, moveOverride, selectedId])
  const displayGeoJson = useMemo(
    () => featuresToDisplayGeoJson(displayFeatures),
    [displayFeatures]
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
    if (lockedRef.current) return
    const list = await listEvents(incident.id, passphrase)
    if (lockedRef.current) return
    setEvents(list)
    setEventsReady(true)
  }, [incident.id, passphrase])

  useEffect(() => {
    setProfileActor(readActor())
  }, [])

  useEffect(() => {
    if (locked) {
      setEvents([])
      setEventsReady(false)
      urlStepAppliedRef.current = false
      setScrubTs(null)
      setSelectedId(null)
      setError(null)
      setDrawCoords([])
      setDrawMode('idle')
      setPendingText(null)
      setTextDraft('')
      setTool('select')
      moveDraggingRef.current = false
      moveOriginRef.current = null
      moveDragBaseRef.current = [0, 0]
      moveDeltaRef.current = null
      moveBusyRef.current = false
      setMoveMode(false)
      setMoveDelta(null)
      setMoveBusy(false)
      setMoveOverride(null)
      setSettingsOpen(false)
      setExportOpen(false)
      setMarkInfoOpen(false)
      setDeleteConfirmOpen(false)
      return
    }
    setEventsReady(false)
    urlStepAppliedRef.current = false
    setScrubTs(null)
    refresh().catch(err => {
      if (isPassphraseError(err)) {
        onAccessDeniedRef.current?.()
        return
      }
      setError(String(err))
    })
  }, [locked, refresh])

  useEffect(() => {
    if (locked || !eventsReady || urlStepAppliedRef.current) return
    urlStepAppliedRef.current = true
    const step = readTimelineStepParam()
    if (step == null || markEvents.length === 0) return
    goToMarkStep(step - 1)
  }, [eventsReady, goToMarkStep, locked, markEvents.length])

  useEffect(() => {
    if (locked) return
    if (passphrase) {
      const id = window.setInterval(() => {
        if (lockedRef.current) return
        refresh().catch(err => {
          if (isPassphraseError(err)) onAccessDeniedRef.current?.()
        })
      }, 4000)
      return () => window.clearInterval(id)
    }
    let stopped = false
    const es = new EventSource(eventsStreamUrl(incident.id))
    es.onmessage = msg => {
      if (lockedRef.current || stopped) return
      try {
        const event = JSON.parse(msg.data) as SitacEvent
        setEvents(prev =>
          prev.some(e => e.id === event.id) ? prev : [...prev, event]
        )
      } catch {}
    }
    es.onerror = () => {
      if (stopped || lockedRef.current) return
      void refresh().catch(err => {
        if (!isPassphraseError(err)) return
        stopped = true
        es.close()
        onAccessDeniedRef.current?.()
      })
    }
    return () => {
      stopped = true
      es.close()
    }
  }, [incident.id, locked, passphrase, refresh])

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
      if (lockedRef.current) return null
      setError(null)
      const actor = await resolveActorLabel()
      if (!actor || lockedRef.current) {
        if (!actor) setError(c.actorRequired)
        return null
      }
      const event = await appendEvent(
        incident.id,
        { op, payload, actorLabel: actor },
        passphrase
      )
      if (lockedRef.current) return null
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

  const cancelMove = useCallback(() => {
    moveDraggingRef.current = false
    moveOriginRef.current = null
    moveDragBaseRef.current = [0, 0]
    moveDeltaRef.current = null
    moveBusyRef.current = false
    setMoveMode(false)
    setMoveDelta(null)
    setMoveBusy(false)
    setMoveOverride(null)
  }, [])

  const selectSelectTool = () => {
    if (locked) return
    setTool('select')
    cancelDraw()
    cancelMove()
    setMenuOpen(false)
  }

  const selectSymbolTool = (id: SymbolId) => {
    if (locked) return
    setTool(id)
    setSelectedId(null)
    cancelDraw()
    cancelMove()
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

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
      const pad = 16
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
      if (
        locked ||
        !live ||
        pendingText ||
        moveMode ||
        moveDraggingRef.current
      ) {
        return
      }

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
      if (
        locked ||
        !live ||
        selectMode ||
        drawMode !== 'drawing' ||
        pendingText
      ) {
        return
      }
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
    locked,
    mapReady,
    moveMode,
    pendingText,
    selectMode,
    symbol,
  ])

  const deleteSelected = async () => {
    if (!selectedId || !live || deleteBusy || moveMode) return
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

  const finishMove = useCallback(async () => {
    const feature = selectedFeatureRef.current
    const delta = moveDeltaRef.current
    if (!feature || moveBusyRef.current) return
    if (!delta || (Math.abs(delta[0]) < 1e-10 && Math.abs(delta[1]) < 1e-10)) {
      cancelMove()
      return
    }
    const geometry = translateGeometry(feature.geometry, delta[0], delta[1])
    moveBusyRef.current = true
    moveDraggingRef.current = false
    moveOriginRef.current = null
    moveDragBaseRef.current = [0, 0]
    moveDeltaRef.current = null
    setMoveBusy(true)
    setMoveOverride({ featureId: feature.id, geometry })
    setMoveMode(false)
    setMoveDelta(null)
    try {
      const event = await pushEvent('upsert_feature', {
        featureId: feature.id,
        geometry,
        properties: { ...feature.properties },
      })
      if (!event) {
        setMoveOverride(null)
        return
      }
    } catch (err) {
      setMoveOverride(null)
      setError(String(err))
    } finally {
      moveBusyRef.current = false
      setMoveBusy(false)
      setMoveOverride(null)
    }
  }, [cancelMove, pushEvent])

  useEffect(() => {
    if (moveMode && live && selectedId && selectMode) return
    if (moveMode) cancelMove()
  }, [cancelMove, live, moveMode, selectMode, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    if (moveMode) {
      map.dragPan.disable()
      map.getCanvas().style.cursor = 'grab'
    } else {
      map.dragPan.enable()
      map.getCanvas().style.cursor = ''
      return
    }

    const featureIdAt = (point: { x: number; y: number }): string | null => {
      const layers = PICK_LAYERS.filter(id => map.getLayer(id))
      if (layers.length === 0) return null
      const pad = 16
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

    const onMouseDown = (e: MapMouseEvent) => {
      if (!selectedId || moveBusyRef.current) return
      if (featureIdAt(e.point) !== selectedId) return
      e.preventDefault()
      moveDraggingRef.current = true
      moveDragBaseRef.current = moveDeltaRef.current ?? [0, 0]
      moveOriginRef.current = [e.lngLat.lng, e.lngLat.lat]
      map.getCanvas().style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MapMouseEvent) => {
      if (!moveDraggingRef.current || !moveOriginRef.current) return
      const [originLng, originLat] = moveOriginRef.current
      const [baseLng, baseLat] = moveDragBaseRef.current
      setMoveDelta([
        baseLng + (e.lngLat.lng - originLng),
        baseLat + (e.lngLat.lat - originLat),
      ])
    }

    const endDrag = () => {
      if (!moveDraggingRef.current) return
      moveDraggingRef.current = false
      moveOriginRef.current = null
      map.getCanvas().style.cursor = 'grab'
    }

    map.on('mousedown', onMouseDown)
    map.on('mousemove', onMouseMove)
    map.on('mouseup', endDrag)
    window.addEventListener('mouseup', endDrag)

    return () => {
      map.off('mousedown', onMouseDown)
      map.off('mousemove', onMouseMove)
      map.off('mouseup', endDrag)
      window.removeEventListener('mouseup', endDrag)
      map.dragPan.enable()
      map.getCanvas().style.cursor = ''
    }
  }, [mapReady, moveMode, selectedId])

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
  selectedFeatureRef.current = selectedFeature ?? null
  const selectedSymbol = selectedFeature
    ? (getSymbol(selectedFeature.properties.symbolId) ?? null)
    : null

  const currentMarkSummary = markSummaries[scrubIndex] ?? null
  const drawing = drawMode === 'drawing' && !selectMode

  const markInfo = useMemo((): {
    symbolId?: SymbolId
    icon?: React.ReactNode
    title: string
    kindLabel?: string
    purpose: string
    howTo: string
  } | null => {
    if (symbol) {
      return {
        symbolId: symbol.id,
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
        symbolId: selectedSymbol.id,
        title: label,
        kindLabel: geometryKindLabel(selectedFeature.properties.geometryKind),
        purpose: c.symbolPurpose[selectedSymbol.id],
        howTo: moveMode ? c.moveHint : c.selectedMarkHow,
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
    c.moveHint,
    c.selectTool,
    c.selectToolHow,
    c.selectToolPurpose,
    c.selectedMarkHow,
    c.symbolPurpose,
    moveMode,
    selectMode,
    selectedFeature,
    selectedSymbol,
    symbol,
  ])

  useEffect(() => {
    setMarkInfoOpen(false)
    setDeleteConfirmOpen(false)
  }, [tool, selectedId, drawMode, moveMode])

  useEffect(() => {
    if (!moveMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelMove()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelMove, moveMode])

  const showMarkControls =
    !locked &&
    (markInfo != null ||
      drawing ||
      moveMode ||
      (selectMode && selectedId != null))

  return (
    <div className="relative flex min-h-0 flex-1 bg-aib-canvas text-aib-fg md:gap-3 md:p-3 dark:bg-aib-canvas-inverse dark:text-aib-fg-inverse">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-aib-fg/40 md:hidden dark:bg-aib-canvas-inverse/70"
          aria-label={c.menuClose}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="sitac-room-menu"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[min(100%,20rem)] max-w-full flex-col overflow-hidden bg-aib-surface shadow-lg transition-transform duration-200 ease-out md:relative md:inset-auto md:z-auto md:w-72 md:max-w-none md:translate-x-0 md:rounded-aib md:shadow-lg dark:bg-aib-surface-dark',
          menuOpen
            ? 'translate-x-0'
            : '-translate-x-full max-md:pointer-events-none md:translate-x-0'
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label={c.roomInfo}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-aib-border p-3 dark:border-aib-border-dark">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 no-underline transition-opacity hover:opacity-70"
            aria-label={c.homeAria}
          >
            <Image
              src="/aib-assets/logo.png"
              alt=""
              width={350}
              height={180}
              className="h-4.5 w-auto brightness-0 sm:h-5 dark:brightness-100"
              priority
            />
            <span className="text-[18px] font-bold tracking-[-0.4px] text-aib-fg sm:text-[20px] dark:text-aib-fg-inverse">
              SITAC
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 text-aib-muted md:hidden dark:text-aib-muted-dark"
            aria-label={c.menuClose}
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <section
          className="shrink-0 space-y-2 border-b border-aib-border p-3 dark:border-aib-border-dark"
          aria-label={c.roomInfo}
        >
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-aib-fg dark:text-aib-fg-inverse">
              {incident.title}
            </h2>
            {incident.hasPassphrase ? (
              <Lock
                className="size-3.5 shrink-0 text-aib-muted dark:text-aib-muted-dark"
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

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <div
            className="flex max-h-full flex-col overflow-y-auto rounded-aib-sm bg-aib-canvas dark:bg-aib-canvas-inverse"
            aria-label={c.palette}
          >
            <div className="flex flex-col gap-0.5 p-1.5">
              <button
                type="button"
                aria-pressed={selectMode}
                disabled={locked}
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
            <div className="flex flex-col gap-0.5 border-t border-aib-border p-1.5 dark:border-aib-border-dark">
              {ANNOTATION_SYMBOLS.map(s => (
                <SymbolToolButton
                  key={s.id}
                  symbol={s}
                  active={tool === s.id}
                  disabled={locked}
                  onSelect={selectSymbolTool}
                />
              ))}
            </div>
            <div className="flex flex-col gap-0.5 border-t border-aib-border p-1.5 dark:border-aib-border-dark">
              {TACTICAL_SYMBOLS.map(s => (
                <SymbolToolButton
                  key={s.id}
                  symbol={s}
                  active={tool === s.id}
                  disabled={locked}
                  onSelect={selectSymbolTool}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col">
          <div className="flex flex-col gap-0.5 border-t border-aib-border p-3 dark:border-aib-border-dark">
            <Button
              variant="quiet"
              size="sm"
              className="w-full gap-2.5"
              disabled={locked || !live}
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
              disabled={locked}
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
          <div className="flex items-center gap-2 border-t border-aib-border p-3 dark:border-aib-border-dark">
            <Button
              variant="quiet"
              size="sm"
              className="min-w-0 flex-1 gap-2.5"
              aria-label={c.actorDialogOpen}
              onClick={() => setActorOpen(true)}
            >
              <User className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">
                {profileActor.trim() || c.actorDialogOpen}
              </span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div className="relative h-full min-h-0 w-full overflow-hidden bg-aib-canvas md:rounded-aib md:border md:border-aib-border md:shadow-lg dark:bg-aib-canvas-inverse md:dark:border-aib-border-dark">
          <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full [&_.maplibregl-map]:h-full [&_.maplibregl-map]:w-full"
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              'absolute top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 size-10 rounded-aib p-0 shadow-lg md:hidden [&_svg]:size-5',
              menuOpen && 'hidden'
            )}
            aria-label={c.menuOpen}
            aria-expanded={menuOpen}
            aria-controls="sitac-room-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden />
          </Button>

          <div className="pointer-events-none absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] left-[max(3.5rem,calc(env(safe-area-inset-left)+3.25rem))] z-10 flex justify-center md:left-[max(0.75rem,env(safe-area-inset-left))]">
            <div
              className="pointer-events-auto flex w-full max-w-xl min-w-0 flex-col gap-1.5 overflow-hidden rounded-aib border border-aib-border bg-aib-surface px-2.5 py-1.5 shadow-lg sm:flex-row sm:items-center sm:gap-2 dark:border-aib-border-dark dark:bg-aib-surface-dark"
              role="region"
              aria-label={c.timeline}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={
                    locked || markEvents.length === 0 || scrubIndex <= 0
                  }
                  aria-label={c.firstStep}
                  onClick={() => goToMarkStep(0)}
                  className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
                >
                  <ChevronsLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={
                    locked || markEvents.length === 0 || scrubIndex <= 0
                  }
                  aria-label={c.prevStep}
                  onClick={() => goToMarkStep(scrubIndex - 1)}
                  className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <Slider
                  className="min-w-0 flex-1 sm:w-40 sm:flex-none md:w-48"
                  min={0}
                  max={Math.max(markEvents.length - 1, 1)}
                  value={[scrubIndex]}
                  disabled={locked || markEvents.length <= 1}
                  onValueChange={values => {
                    const list = Array.isArray(values) ? values : [values]
                    goToMarkStep(Number(list[0] ?? 0))
                  }}
                />
                <button
                  type="button"
                  disabled={
                    locked ||
                    markEvents.length === 0 ||
                    scrubIndex >= markEvents.length - 1
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
                    locked ||
                    markEvents.length === 0 ||
                    scrubIndex >= markEvents.length - 1
                  }
                  aria-label={c.lastStep}
                  onClick={() => goToMarkStep(markEvents.length - 1)}
                  className="aib-quiet-btn flex h-8 w-6 shrink-0 items-center justify-center !px-0"
                >
                  <ChevronsRight className="size-4" aria-hidden />
                </button>
                <p className="w-10 shrink-0 text-right text-[12px] text-aib-muted tabular-nums dark:text-aib-muted-dark">
                  {formatStepOf(
                    markEvents.length === 0 ? 0 : scrubIndex + 1,
                    markEvents.length
                  )}
                </p>
              </div>
              <div
                className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden border-t border-aib-border pt-1.5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-2.5 dark:border-aib-border-dark"
                role="status"
              >
                {currentMarkSummary ? (
                  <>
                    {currentMarkSummary.symbolId ? (
                      <MarkIcon
                        symbolId={currentMarkSummary.symbolId}
                        size={markIconSize.timeline}
                      />
                    ) : (
                      <span
                        className="shrink-0 rounded-aib-sm bg-aib-border dark:bg-aib-border-dark"
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
                  <span className="min-w-0 flex-1 truncate text-[12px] text-aib-muted dark:text-aib-muted-dark">
                    {c.noEvents}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showMarkControls ? (
            <div
              className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3"
              style={{
                bottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              <div
                className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-aib border border-aib-border bg-aib-surface px-2.5 py-1.5 shadow-lg dark:border-aib-border-dark dark:bg-aib-surface-dark"
                role="region"
                aria-label={c.markControls}
              >
                {markInfo ? (
                  <div className="flex min-w-0 items-center gap-2 px-1">
                    {markInfo.symbolId ? (
                      <MarkIcon
                        symbolId={markInfo.symbolId}
                        size={markIconSize.control}
                      />
                    ) : markInfo.icon ? (
                      <span
                        className="flex shrink-0 items-center justify-center text-aib-fg dark:text-aib-fg-inverse [&_svg]:size-[18px]"
                        style={{
                          width: markIconSize.control,
                          height: markIconSize.control,
                        }}
                      >
                        {markInfo.icon}
                      </span>
                    ) : null}
                    <span className="max-w-[9rem] truncate text-[13px] font-semibold text-aib-fg sm:max-w-[12rem] dark:text-aib-fg-inverse">
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
                {selectMode && selectedId && !moveMode ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!live || moveBusy}
                      onClick={() => {
                        setMoveMode(true)
                        setMoveDelta(null)
                      }}
                    >
                      {c.moveFeature}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!live}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      {c.deleteFeature}
                    </Button>
                  </>
                ) : null}
                {moveMode ? (
                  <>
                    <Button
                      size="sm"
                      disabled={moveBusy}
                      onClick={() => void finishMove()}
                    >
                      {c.finishMove}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={moveBusy}
                      onClick={cancelMove}
                    >
                      {c.cancelMove}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <MarkInfoDialog
          open={markInfoOpen && markInfo != null}
          title={markInfo?.title ?? ''}
          kindLabel={markInfo?.kindLabel}
          symbolId={markInfo?.symbolId}
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
          open={settingsOpen && !locked}
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
          open={exportOpen && !locked}
          busy={exportBusy}
          onClose={() => {
            if (!exportBusy) setExportOpen(false)
          }}
          onExportGeoJson={exportGeoJson}
          onExportPng={() => void exportPng()}
        />
        <UnlockPassphraseDialog
          open={locked}
          busy={unlockBusy}
          error={unlockError}
          onSubmit={pass => onUnlock?.(pass)}
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
        className="block truncate text-[12px] font-semibold text-aib-fg dark:text-aib-fg-inverse"
      >
        {label}
      </span>
      <span
        ref={metaRef}
        className="block truncate text-[11px] text-aib-muted dark:text-aib-muted-dark"
      >
        {meta}
      </span>
    </span>
  )
}

function SymbolToolButton({
  symbol,
  active,
  disabled = false,
  onSelect,
}: {
  symbol: (typeof SYMBOL_CATALOG)[number]
  active: boolean
  disabled?: boolean
  onSelect: (id: SymbolId) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => onSelect(symbol.id)}
      className={cn(
        'aib-tool-btn',
        active ? 'aib-tool-btn-active' : 'aib-tool-btn-idle'
      )}
    >
      <MarkIcon
        symbolId={symbol.id}
        size={markIconSize.sidebar}
        sidebar
        active={active}
      />
      <span className="min-w-0 flex-1 truncate">{symbol.label}</span>
      <span
        className={cn(
          'shrink-0 text-[11px] font-medium tracking-wide uppercase opacity-70',
          active
            ? 'text-aib-muted-dark dark:text-aib-muted'
            : 'text-aib-muted dark:text-aib-muted-dark'
        )}
      >
        {geometryKindLabel(symbol.geometry)}
      </span>
    </button>
  )
}
