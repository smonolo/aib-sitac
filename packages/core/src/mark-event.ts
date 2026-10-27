import { getSymbol } from './symbols'
import type { GeometryKind, SymbolId } from './symbols'
import type { SitacEvent } from './types'

export type MarkEventSummary = {
  eventId: string
  ts: string
  action: 'add' | 'remove'
  featureId: string
  symbolId: SymbolId | null
  geometryKind: GeometryKind | null
  label: string
  color: string | null
  actorLabel: string | null
}

function propsFromPriorUpsert(
  events: readonly SitacEvent[],
  featureId: string,
  beforeIndex: number
): {
  symbolId: SymbolId | null
  geometryKind: GeometryKind | null
  label: string | null
  color: string | null
} {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    const event = events[i]!
    if (event.op !== 'upsert_feature') continue
    if (event.payload.featureId !== featureId) continue
    const { properties } = event.payload
    const symbol = getSymbol(properties.symbolId)
    return {
      symbolId: properties.symbolId,
      geometryKind: properties.geometryKind,
      label: properties.label?.trim() || symbol?.label || null,
      color: properties.color ?? symbol?.color ?? null,
    }
  }
  return {
    symbolId: null,
    geometryKind: null,
    label: null,
    color: null,
  }
}

function summarizeMarkEvent(
  event: SitacEvent,
  allMarkEvents: readonly SitacEvent[],
  indexInMarkEvents: number,
  fallbackLabel = 'Segno'
): MarkEventSummary | null {
  if (event.op === 'upsert_feature') {
    const { featureId, properties } = event.payload
    const symbol = getSymbol(properties.symbolId)
    return {
      eventId: event.id,
      ts: event.ts,
      action: 'add',
      featureId,
      symbolId: properties.symbolId,
      geometryKind: properties.geometryKind,
      label: properties.label?.trim() || symbol?.label || fallbackLabel,
      color: properties.color ?? symbol?.color ?? null,
      actorLabel: event.actorLabel?.trim() || null,
    }
  }

  if (event.op === 'delete_feature') {
    const prior = propsFromPriorUpsert(
      allMarkEvents,
      event.payload.featureId,
      indexInMarkEvents
    )
    const symbol = prior.symbolId ? getSymbol(prior.symbolId) : undefined
    return {
      eventId: event.id,
      ts: event.ts,
      action: 'remove',
      featureId: event.payload.featureId,
      symbolId: prior.symbolId,
      geometryKind: prior.geometryKind,
      label: prior.label || symbol?.label || fallbackLabel,
      color: prior.color,
      actorLabel: event.actorLabel?.trim() || null,
    }
  }

  return null
}

export function summarizeMarkEvents(
  markEvents: readonly SitacEvent[],
  fallbackLabel = 'Segno'
): MarkEventSummary[] {
  const out: MarkEventSummary[] = []
  for (let i = 0; i < markEvents.length; i++) {
    const summary = summarizeMarkEvent(
      markEvents[i]!,
      markEvents,
      i,
      fallbackLabel
    )
    if (summary) out.push(summary)
  }
  return out
}
